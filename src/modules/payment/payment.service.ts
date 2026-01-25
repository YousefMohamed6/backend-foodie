import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentLogStatus, TransactionType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FawaterakService } from '../../shared/services/fawaterak.service';
import { WalletConstants } from '../wallet/wallet.constants';
import { WalletService } from '../wallet/wallet.service';
import { CreateTopUpDto } from './dto/create-top-up.dto';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly fawaterakService: FawaterakService,
        private readonly walletService: WalletService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Step 1 & 2: Create payment record and Invoice link
     */
    async createTopUp(userId: string, dto: CreateTopUpDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                countryCode: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 1. Create payment record (PENDING)
        const paymentLog = await this.prisma.paymentLog.create({
            data: {
                userId: user.id,
                amount: dto.amount,
                currency: 'EGP',
                status: PaymentLogStatus.PENDING,
                provider: 'FAWATERAK',
                isProcessed: false,
            },
        });

        try {
            const baseUrl = this.configService.get<string>('app.baseUrl');
            const redirectUrl = `${baseUrl}/api/v1/payments/redirect`;

            // 2. Call Fawaterak API
            const invoice = await this.fawaterakService.createInvoiceLink({
                amount: dto.amount,
                currency: 'EGP',
                customer: {
                    first_name: user.firstName || 'Customer',
                    last_name: user.lastName || 'User',
                    email: user.email,
                    phone: user.phoneNumber || '01000000000',
                },
                redirectionUrls: {
                    successUrl: redirectUrl,
                    failUrl: redirectUrl,
                    pendingUrl: redirectUrl,
                },
            });

            // Store invoiceId returned by provider
            await this.prisma.paymentLog.update({
                where: { id: paymentLog.id },
                data: {
                    invoiceId: String(invoice.invoiceId),
                },
            });

            return {
                paymentUrl: invoice.url,
            };
        } catch (error) {
            this.logger.error(`[PAYMENT] Initiation failed for user ${userId}: ${error.message}`);
            await this.prisma.paymentLog.update({
                where: { id: paymentLog.id },
                data: { status: PaymentLogStatus.FAILED, rawProviderResponse: { error: error.message } },
            });
            throw new BadRequestException('Payment initiation failed. Please try again later.');
        }
    }

    /**
     * Step 5: Server-to-Server Verification (Single Source of Truth)
     */
    async verifyPayment(invoiceId: string) {
        this.logger.log(`[PAYMENT] Verifying invoiceId: ${invoiceId}`);

        // 1. Validate invoiceId exists in DB
        const paymentLog = await this.prisma.paymentLog.findFirst({
            where: { invoiceId: String(invoiceId) },
            include: { user: true },
        });

        if (!paymentLog) {
            this.logger.warn(`[PAYMENT] PaymentLog not found for invoiceId: ${invoiceId}`);
            throw new NotFoundException('Payment record not found.');
        }

        // 2. payment.isProcessed === false (Idempotency)
        if (paymentLog.isProcessed) {
            this.logger.log(`[PAYMENT] Invoice ${invoiceId} already processed.`);
            return {
                status: paymentLog.status,
                data: paymentLog.rawProviderResponse
            };
        }

        try {
            // S2S Verification Call
            const response = await this.fawaterakService.getInvoiceStatus(invoiceId);

            if (response.status !== 'success') {
                this.logger.error(`[PAYMENT] Provider API error for ${invoiceId}: ${JSON.stringify(response)}`);
                return { status: 'FAILED', message: 'Unable to verify payment with provider.' };
            }

            const providerData = response.data;

            // 3. Fawaterak status === PAID
            const providerStatus = String(providerData?.invoice_status || '').toUpperCase();
            const isPaid = providerStatus === 'PAID';

            if (isPaid) {
                // 4. Amount matches logged amount
                const providerAmount = parseFloat(String(providerData.total));
                const loggedAmount = Number(paymentLog.amount);

                if (Math.abs(providerAmount - loggedAmount) > 0.01) {
                    this.logger.error(`[PAYMENT] Amount mismatch! Log: ${loggedAmount}, Provider: ${providerAmount}`);
                    await this.markAsFailed(paymentLog.id, { error: 'Amount mismatch', providerData });
                    return { status: 'FAILED', message: 'Payment amount mismatch detected.' };
                }

                // 5. Currency matches logged currency
                const providerCurrency = String(providerData.currency || 'EGP').toUpperCase();
                if (providerCurrency !== paymentLog.currency.toUpperCase()) {
                    this.logger.error(`[PAYMENT] Currency mismatch! Log: ${paymentLog.currency}, Provider: ${providerCurrency}`);
                    await this.markAsFailed(paymentLog.id, { error: 'Currency mismatch', providerData });
                    return { status: 'FAILED', message: 'Payment currency mismatch detected.' };
                }

                // Step 6: Atomic Confirmation
                await this.processSuccess(paymentLog, providerData);
                return { status: 'SUCCESS', data: providerData };
            } else {
                this.logger.warn(`[PAYMENT] Invoice ${invoiceId} NOT PAID. State: ${providerStatus}`);

                // Final failure states
                if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(providerStatus)) {
                    await this.markAsFailed(paymentLog.id, providerData);
                    return { status: 'FAILED', data: providerData };
                }

                return { status: 'PENDING', data: providerData };
            }
        } catch (error) {
            this.logger.error(`[PAYMENT] Verification exception for ${invoiceId}:`, error.stack);
            return { status: 'FAILED', message: 'Verification process failed.' };
        }
    }

    /**
     * Step 6: Atomic Confirmation (Critical Section)
     */
    private async processSuccess(paymentLog: any, providerData: any) {
        return this.prisma.$transaction(async (tx) => {
            // Re-check processed status inside transaction
            const log = await tx.paymentLog.findUnique({
                where: { id: paymentLog.id },
                select: { isProcessed: true }
            });

            if (log?.isProcessed) {
                this.logger.warn(`[PAYMENT] Race condition prevented for log ${paymentLog.id}`);
                return;
            }

            // 1. Update PaymentLog
            await tx.paymentLog.update({
                where: { id: paymentLog.id },
                data: {
                    status: PaymentLogStatus.SUCCESS,
                    isProcessed: true,
                    rawProviderResponse: providerData,
                }
            });

            const user = paymentLog.user;

            // 2. Update Wallet (Role Based)
            if (user.role === UserRole.CUSTOMER) {
                await this.walletService.updateUserWallet(user.id, Number(paymentLog.amount), WalletConstants.OPERATION_ADD, tx);
            } else if (user.role === UserRole.DRIVER) {
                await this.walletService.updateDriverWallet(user.id, Number(paymentLog.amount), WalletConstants.OPERATION_ADD, tx);
            } else if (user.role === UserRole.VENDOR) {
                const vendor = await tx.vendor.findUnique({ where: { authorId: user.id } });
                if (vendor) {
                    await this.walletService.updateVendorWallet(vendor.id, Number(paymentLog.amount), WalletConstants.OPERATION_ADD, tx);
                }
            } else {
                // Fallback for any other user role with a wallet
                await this.walletService.updateUserWallet(user.id, Number(paymentLog.amount), WalletConstants.OPERATION_ADD, tx);
            }

            // 3. Create Wallet Transaction Entry
            await tx.walletTransaction.create({
                data: {
                    userId: user.id,
                    amount: paymentLog.amount,
                    type: TransactionType.DEPOSIT,
                    paymentStatus: 'PAID',
                    isTopup: true,
                    descriptionEn: 'Wallet Top-up via Fawaterak',
                    descriptionAr: 'شحن المحفظة عبر فواتيرك',
                    balanceType: 'PAYMENT',
                    metadata: {
                        paymentLogId: paymentLog.id,
                        invoiceId: paymentLog.invoiceId,
                        provider: 'FAWATERAK'
                    }
                }
            });

            this.logger.log(`[PAYMENT] Successfully processed top-up for user ${user.id}, amount ${paymentLog.amount}`);
        }, {
            isolationLevel: 'Serializable' // Highest isolation level for critical section
        });
    }

    private async markAsFailed(id: string, providerResponse: any) {
        await this.prisma.paymentLog.update({
            where: { id },
            data: {
                status: PaymentLogStatus.FAILED,
                isProcessed: true,
                rawProviderResponse: providerResponse
            }
        });
    }
}
