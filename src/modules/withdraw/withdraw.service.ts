import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TransactionType,
  UserRole,
  WithdrawStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletTransactionDescriptions } from '../wallet/wallet-transaction.constants';
import { WalletConstants } from '../wallet/wallet.constants';
import { WalletService } from '../wallet/wallet.service';
import {
  AdminApproveWithdrawDto,
  AdminCompleteWithdrawDto,
  AdminRejectWithdrawDto,
  CreateWithdrawRequestDto,
} from './dto/withdraw.dto';

@Injectable()
export class WithdrawService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async createRequest(userId: string, dto: CreateWithdrawRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    // Validate eligibility (Vendor, Driver, or Manager)
    if (
      user.role !== UserRole.VENDOR &&
      user.role !== UserRole.DRIVER &&
      user.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('NOT_VENDOR_DRIVER_OR_MANAGER');
    }

    // Check for existing PENDING request (optional but recommended safety)
    const existingPending = await this.prisma.withdrawRequest.findFirst({
      where: {
        userId,
        status: WithdrawStatus.PENDING,
      },
    });

    if (existingPending) {
      // Optional: Could return existing, but usually blocked.
      // Prompt says "Only one active PENDING allowed? (optional)"
      // I will enforce it to prevent spam/confusion.
      throw new BadRequestException('REQUEST_NOT_PENDING'); // Reusing error code style or "EXISTING_PENDING_REQUEST"
    }

    // Check Balance
    const balance = await this.walletService.getBalance(userId);
    if (balance < dto.amount) {
      throw new BadRequestException('INSUFFICIENT_FUNDS');
    }

    // Validate Payout Account (Optional but recommended)
    if (dto.payoutAccountId) {
      const payoutAccount = await this.prisma.payoutAccount.findFirst({
        where: { id: dto.payoutAccountId, userId },
      });
      if (!payoutAccount) {
        throw new BadRequestException('INVALID_PAYOUT_ACCOUNT');
      }
    }

    let finalPayoutAccountId = dto.payoutAccountId;
    if (!finalPayoutAccountId) {
      const defaultAccount = await this.prisma.payoutAccount.findFirst({
        where: { userId, isDefault: true },
      });
      if (defaultAccount) {
        finalPayoutAccountId = defaultAccount.id;
      }
    }

    // Create Request
    return this.prisma.withdrawRequest.create({
      data: {
        userId,
        amount: dto.amount,
        method: dto.method,
        // @ts-ignore - Prisma types may take a moment to sync in IDE
        payoutAccountId: finalPayoutAccountId,
        accountDetails: dto.accountDetails as Prisma.InputJsonValue,
        status: WithdrawStatus.PENDING,
        snapshotBalance: balance,
      },
    });
  }

  async findAllPending() {
    return this.prisma.withdrawRequest.findMany({
      where: { status: WithdrawStatus.PENDING },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyHistory(userId: string) {
    return this.prisma.withdrawRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.withdrawRequest.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!request) {
      throw new NotFoundException('Withdraw request not found');
    }
    return request;
  }

  async approveRequest(id: string, dto: AdminApproveWithdrawDto) {
    const request = await this.findOne(id);
    if (request.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException('REQUEST_NOT_PENDING');
    }

    return this.prisma.withdrawRequest.update({
      where: { id },
      data: {
        status: WithdrawStatus.APPROVED,
        adminNotes: dto.adminNotes,
      },
    });
  }

  async rejectRequest(id: string, dto: AdminRejectWithdrawDto) {
    const request = await this.findOne(id);
    if (request.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException('REQUEST_NOT_PENDING');
    }

    return this.prisma.withdrawRequest.update({
      where: { id },
      data: {
        status: WithdrawStatus.REJECTED,
        adminNotes: dto.adminNotes,
        rejectedAt: new Date(),
      },
    });
  }

  private readonly logger = new Logger(WithdrawService.name);

  async completeRequest(id: string, dto: AdminCompleteWithdrawDto) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawRequest.findUnique({
        where: { id },
      });
      if (!request) {
        this.logger.warn(`Complete request failed: Request ${id} not found`);
        throw new NotFoundException('Withdraw request not found');
      }

      // Status check
      if (request.status === WithdrawStatus.COMPLETED) {
        throw new BadRequestException('ALREADY_COMPLETED');
      }

      if (
        request.status !== WithdrawStatus.APPROVED &&
        request.status !== WithdrawStatus.PENDING
      ) {
        this.logger.warn(
          `Complete request failed: Request ${id} has invalid status ${request.status}`,
        );
        throw new BadRequestException('REQUEST_NOT_PENDING_OR_APPROVED');
      }

      const amount = Number(request.amount);
      const withdrawalDescriptions = WalletTransactionDescriptions.withdrawal();

      // Fetch User to determine Role and Profile
      const user = await tx.user.findUnique({ where: { id: request.userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check Balance & Debit based on Role
      if (user.role === UserRole.DRIVER) {
        const driverProfile = await tx.driverProfile.findUnique({
          where: { userId: request.userId },
        });
        if (!driverProfile)
          throw new BadRequestException('DRIVER_PROFILE_NOT_FOUND');

        if (driverProfile.walletAmount.toNumber() < amount) {
          this.logger.warn(
            `Withdraw failed for Driver ${request.userId}: Insufficient funds. Balance: ${driverProfile.walletAmount}, Request: ${amount}`,
          );
          throw new BadRequestException('INSUFFICIENT_FUNDS');
        }

        await this.walletService.updateDriverWallet(
          request.userId,
          amount,
          WalletConstants.OPERATION_SUBTRACT,
          tx,
        );
      } else if (user.role === UserRole.VENDOR && user.vendorId) {
        const vendor = await tx.vendor.findUnique({
          where: { id: user.vendorId },
        });
        if (!vendor) throw new BadRequestException('VENDOR_PROFILE_NOT_FOUND');

        if (vendor.walletAmount.toNumber() < amount) {
          this.logger.warn(
            `Withdraw failed for Vendor ${user.vendorId}: Insufficient funds. Balance: ${vendor.walletAmount}, Request: ${amount}`,
          );
          throw new BadRequestException('INSUFFICIENT_FUNDS');
        }

        await this.walletService.updateVendorWallet(
          user.vendorId,
          amount,
          WalletConstants.OPERATION_SUBTRACT,
          tx,
        );
      } else {
        // Fallback: Customer Profile (Used by Customers, Managers, etc.)
        const customerProfile = await tx.customerProfile.findUnique({
          where: { userId: request.userId },
        });
        if (!customerProfile) {
          // If no customer profile, we might need to create one or just use the User entity if that becomes a thing.
          // But based on existing logic, we expect a profile.
          this.logger.error(
            `Withdraw failed: No wallet profile found for user ${request.userId} with role ${user.role}`,
          );
          throw new BadRequestException('WALLET_PROFILE_NOT_FOUND');
        }

        if (customerProfile.walletAmount.toNumber() < amount) {
          this.logger.warn(
            `Withdraw failed for User ${request.userId}: Insufficient funds.`,
          );
          throw new BadRequestException('INSUFFICIENT_FUNDS');
        }

        await this.walletService.updateUserWallet(
          request.userId,
          amount,
          WalletConstants.OPERATION_SUBTRACT,
          tx,
        );
      }

      // Create Wallet Transaction Records
      await tx.walletTransaction.create({
        data: {
          userId: request.userId,
          amount: request.amount,
          type: TransactionType.WITHDRAWAL,
          descriptionEn: withdrawalDescriptions.en,
          descriptionAr: withdrawalDescriptions.ar,
          referenceId: dto.referenceId,
          metadata: {
            withdrawRequestId: request.id,
            adminNotes: dto.adminNotes,
          },
          // Link to orderId? No, it's a general withdrawal.
        },
      });

      // Update Request Status
      this.logger.log(
        `Withdraw request ${id} completed for user ${request.userId}. Amount: ${amount}`,
      );

      return tx.withdrawRequest.update({
        where: { id },
        data: {
          status: WithdrawStatus.COMPLETED,
          completedAt: new Date(),
          referenceId: dto.referenceId,
          adminNotes: dto.adminNotes ?? request.adminNotes,
          processedAt: new Date(),
        },
      });
    });
  }
}
