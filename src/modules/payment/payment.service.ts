import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentLogStatus, TransactionType, UserRole } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
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
        private readonly i18n: I18nService,
    ) { }

    async createTopUp(userId: string, dto: CreateTopUpDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

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

            const invoice = await this.fawaterakService.createInvoiceLink({
                amount: dto.amount,
                currency: 'EGP',
                customer: {
                    first_name: user.firstName || 'Customer',
                    last_name: user.lastName || 'User',
                    email: user.email,
                    phone: user.phoneNumber || '01000000000',
                    address: 'Digital Wallet Topup',
                    customer_unique_id: user.id,
                },
                redirectionUrls: {
                    successUrl: redirectUrl,
                    failUrl: redirectUrl,
                    pendingUrl: redirectUrl,
                },
                payLoad: {
                    paymentLogId: paymentLog.id,
                },
            });

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
            this.logger.error(`Failed to initiate payment for user ${userId}`, error);
            await this.prisma.paymentLog.update({
                where: { id: paymentLog.id },
                data: { status: PaymentLogStatus.FAILED, rawProviderResponse: error.message },
            });
            throw new BadRequestException('Payment initiation failed');
        }
    }

    async verifyPayment(invoiceId: string) {
        this.logger.log(`Verifying payment for invoiceId: ${invoiceId}`);

        // 1. PaymentLog exists.
        const paymentLog = await this.prisma.paymentLog.findFirst({
            where: { invoiceId: String(invoiceId) },
            include: { user: true },
        });

        if (!paymentLog) {
            this.logger.warn(`PaymentLog not found for invoiceId: ${invoiceId}`);
            throw new NotFoundException('Payment log not found');
        }

        // 2. PaymentLog.isProcessed === false.
        // 6. Invoice not processed before.
        if (paymentLog.isProcessed) {
            this.logger.log(`Payment already processed for invoiceId: ${invoiceId}`);
            return { status: paymentLog.status, message: 'Already processed' };
        }

        let providerData: any = {};

        try {
            // Server-to-Server Verification
            const response = await this.fawaterakService.getInvoiceStatus(invoiceId);

            if (response.status !== 'success') {
                this.logger.error(`Fawaterak API error for ${invoiceId}: ${JSON.stringify(response)}`);
                return { status: 'FAILED', message: 'Provider API error' };
            }

            providerData = response.data;

            // 3. Provider status === PAID.
            // Note: getTransactionStatus returns data.invoice_status
            const providerStatus = String(providerData?.invoice_status || '').toUpperCase();
            const isPaidStatus = providerStatus === 'PAID';

            if (isPaidStatus) {
                // 4. Amount matches logged amount.
                const providerAmount = parseFloat(String(providerData.total));
                const loggedAmount = Number(paymentLog.amount);

                if (Math.abs(providerAmount - loggedAmount) > 0.01) {
                    this.logger.error(`Amount mismatch! Log: ${loggedAmount}, Provider: ${providerAmount}`);
                    await this.markAsFailed(paymentLog.id, { error: 'Amount mismatch', providerData });
                    return { status: 'FAILED', message: 'Amount mismatch' };
                }

                // 5. Currency matches.
                const providerCurrency = String(providerData.currency || 'EGP').toUpperCase();
                if (providerCurrency !== paymentLog.currency.toUpperCase()) {
                    this.logger.error(`Currency mismatch! Log: ${paymentLog.currency}, Provider: ${providerCurrency}`);
                    await this.markAsFailed(paymentLog.id, { error: 'Currency mismatch', providerData });
                    return { status: 'FAILED', message: 'Currency mismatch' };
                }

                // Validation rules passed, process SUCCESS
                await this.processSuccess(paymentLog, providerData);
                return { status: 'SUCCESS', data: providerData };
            } else {
                this.logger.warn(`Payment not paid yet for invoice ${invoiceId}. Status: ${providerStatus}`);
                // If it is FAILED or EXPIRED or CANCELLED, we can mark it as FAILED in our logs
                if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(providerStatus)) {
                    await this.markAsFailed(paymentLog.id, providerData);
                    return { status: 'FAILED', data: providerData };
                }
                return { status: 'PENDING', data: providerData };
            }
        } catch (error) {
            this.logger.error(`Failed to verify with provider`, error);
            // Don't mark as failed yet if it's a network error, keep it pending for retry?
            // But per prompt rules, if transaction fails we should log it.
            // We'll keep it as is.
            return { status: 'FAILED', message: error.message };
        }
    }

    private async processSuccess(paymentLog: any, providerData: any) {
        return this.prisma.$transaction(async (tx) => {
            // Re-check processed status inside transaction to prevent race conditions
            const log = await tx.paymentLog.findUnique({
                where: { id: paymentLog.id },
                select: { isProcessed: true }
            });

            if (log?.isProcessed) {
                return;
            }

            await tx.paymentLog.update({
                where: { id: paymentLog.id },
                data: {
                    status: PaymentLogStatus.SUCCESS,
                    isProcessed: true,
                    rawProviderResponse: providerData,
                }
            });

            const user = paymentLog.user;
            let updated = false;

            // Wallet Update Logic (Atomic)
            if (user.role === UserRole.CUSTOMER) {
                await this.walletService.updateUserWallet(user.id, Number(paymentLog.amount), WalletConstants.OPERATION_ADD, tx);
                updated = true;
            } else if (user.role === UserRole.DRIVER) {
                await this.walletService.updateDriverWallet(user.id, Number(paymentLog.amount), WalletConstants.OPERATION_ADD, tx);
                updated = true;
            } else if (user.role === UserRole.VENDOR) {
                const vendor = await tx.vendor.findUnique({ where: { authorId: user.id } });
                if (vendor) {
                    await this.walletService.updateVendorWallet(vendor.id, Number(paymentLog.amount), WalletConstants.OPERATION_ADD, tx);
                    updated = true;
                }
            }

            if (!updated) {
                // Default fallback to user wallet if no specific role match (shouldn't happen with guards)
                await this.walletService.updateUserWallet(user.id, Number(paymentLog.amount), WalletConstants.OPERATION_ADD, tx);
            }

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
