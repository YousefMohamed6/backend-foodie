import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceType,
  DeliveryConfirmationType,
  DisputeStatus,
  HeldBalanceStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from './wallet.service';

@Injectable()
export class WalletProtectionService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  /**
   * Create a held balance when customer pays via wallet
   */
  async createHeldBalance(
    orderId: string,
    customerId: string,
    vendorId: string,
    driverId: string | null,
    vendorAmount: number,
    driverAmount: number,
    adminAmount: number,
    autoReleaseDays: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;

    const totalAmount = vendorAmount + driverAmount + adminAmount;
    const autoReleaseDate = new Date();
    autoReleaseDate.setDate(autoReleaseDate.getDate() + autoReleaseDays);

    const heldBalance = await prisma.heldBalance.create({
      data: {
        orderId,
        customerId,
        vendorId,
        driverId,
        totalAmount,
        vendorAmount,
        driverAmount,
        adminAmount,
        status: HeldBalanceStatus.HELD,
        holdReason: 'awaiting_delivery_confirmation',
        autoReleaseDate,
      },
    });

    return heldBalance;
  }

  /**
   * Release held funds to vendor, driver, and admin
   */
  async releaseHeldBalance(
    orderId: string,
    confirmationType: DeliveryConfirmationType,
    resolutionReason: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;

    // Fetch held balance
    const heldBalance = await prisma.heldBalance.findUnique({
      where: { orderId },
      include: { order: { include: { vendor: true } } },
    });

    if (!heldBalance) {
      throw new NotFoundException('HELD_BALANCE_NOT_FOUND');
    }

    if (heldBalance.status !== HeldBalanceStatus.HELD) {
      throw new BadRequestException('HELD_BALANCE_ALREADY_PROCESSED');
    }

    // Credit vendor
    await this.walletService.addVendorEarnings(
      heldBalance.vendorId,
      heldBalance.order.vendor.authorId,
      Number(heldBalance.vendorAmount),
      orderId,
      prisma,
    );

    // Credit driver
    if (heldBalance.driverId && Number(heldBalance.driverAmount) > 0) {
      await this.walletService.addDriverEarnings(
        heldBalance.driverId,
        Number(heldBalance.driverAmount),
        orderId,
        prisma,
      );
    }

    // Credit admin
    if (Number(heldBalance.adminAmount) > 0) {
      await this.walletService.addAdminCommission(
        Number(heldBalance.adminAmount),
        orderId,
        prisma,
      );
    }

    // Update held balance status
    await prisma.heldBalance.update({
      where: { orderId },
      data: {
        status: HeldBalanceStatus.RELEASED,
        releasedAt: new Date(),
        releaseType: confirmationType,
      },
    });

    // Update wallet transactions with release info
    await prisma.walletTransaction.updateMany({
      where: {
        orderId,
        balanceType: BalanceType.HELD,
      },
      data: {
        balanceType: BalanceType.RELEASED,
        deliveryConfirmationType: confirmationType,
        deliveryConfirmationTime: new Date(),
        resolutionReason,
      },
    });

    return heldBalance;
  }

  /**
   * Refund held balance to customer (dispute resolution)
   */
  async refundHeldBalance(
    orderId: string,
    resolutionReason: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;

    const heldBalance = await prisma.heldBalance.findUnique({
      where: { orderId },
    });

    if (!heldBalance) {
      throw new NotFoundException('HELD_BALANCE_NOT_FOUND');
    }

    if (heldBalance.status !== HeldBalanceStatus.HELD) {
      throw new BadRequestException('HELD_BALANCE_ALREADY_PROCESSED');
    }

    // Refund to customer
    await this.walletService.refund(
      heldBalance.customerId,
      Number(heldBalance.totalAmount),
      `Refund for order ${orderId}: ${resolutionReason}`,
      `استرداد للطلب ${orderId}: ${resolutionReason}`,
      orderId,
      prisma,
    );

    // Update held balance status
    await prisma.heldBalance.update({
      where: { orderId },
      data: {
        status: HeldBalanceStatus.REFUNDED,
        releasedAt: new Date(),
        releaseType: DeliveryConfirmationType.ADMIN_RESOLUTION,
      },
    });

    // Update wallet transactions
    await prisma.walletTransaction.updateMany({
      where: {
        orderId,
        balanceType: BalanceType.HELD,
      },
      data: {
        balanceType: BalanceType.REFUNDED,
        deliveryConfirmationType: DeliveryConfirmationType.ADMIN_RESOLUTION,
        deliveryConfirmationTime: new Date(),
        resolutionReason,
      },
    });

    return heldBalance;
  }

  /**
   * Create a dispute
   */
  async createDispute(
    orderId: string,
    customerId: string,
    reason: string,
    evidence?: any,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Check if order has held balance
      const heldBalance = await tx.heldBalance.findUnique({
        where: { orderId },
      });

      if (!heldBalance) {
        throw new BadRequestException('NO_HELD_BALANCE_FOR_ORDER');
      }

      if (heldBalance.status !== HeldBalanceStatus.HELD) {
        throw new BadRequestException('HELD_BALANCE_ALREADY_PROCESSED');
      }

      // Check if dispute already exists
      const existingDispute = await tx.dispute.findFirst({
        where: { orderId },
      });

      if (existingDispute) {
        throw new BadRequestException('DISPUTE_ALREADY_EXISTS');
      }

      // Create dispute
      const dispute = await tx.dispute.create({
        data: {
          orderId,
          customerId,
          driverId: heldBalance.driverId,
          reason,
          customerEvidence: evidence,
          status: DisputeStatus.PENDING,
          priority: 'MEDIUM',
        },
      });

      // Update held balance status and link to dispute
      await tx.heldBalance.update({
        where: { orderId },
        data: {
          status: HeldBalanceStatus.DISPUTED,
          disputeId: dispute.id,
        },
      });

      // Create audit log
      await tx.disputeAuditLog.create({
        data: {
          disputeId: dispute.id,
          actorId: customerId,
          actorRole: 'CUSTOMER',
          action: 'DISPUTE_CREATED',
          newValue: reason,
        },
      });

      return dispute;
    });
  }

  /**
   * Add driver response to dispute
   */
  async addDriverResponse(
    disputeId: string,
    driverId: string,
    response: string,
    evidence?: any,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('DISPUTE_NOT_FOUND');
    }

    if (dispute.driverId !== driverId) {
      throw new BadRequestException('NOT_YOUR_DISPUTE');
    }

    if (
      dispute.status !== DisputeStatus.PENDING &&
      dispute.status !== DisputeStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('DISPUTE_ALREADY_RESOLVED');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          driverResponse: response,
          driverEvidence: evidence,
          status: DisputeStatus.UNDER_REVIEW,
        },
      });

      await tx.disputeAuditLog.create({
        data: {
          disputeId,
          actorId: driverId,
          actorRole: 'DRIVER',
          action: 'DRIVER_RESPONSE_ADDED',
          newValue: response,
        },
      });

      return updated;
    });
  }

  /**
   * Resolve dispute (admin action)
   */
  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: DisputeStatus,
    resolutionReason: string,
    resolutionType: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { heldBalances: true },
    });

    if (!dispute) {
      throw new NotFoundException('DISPUTE_NOT_FOUND');
    }

    if (
      dispute.status !== DisputeStatus.PENDING &&
      dispute.status !== DisputeStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('DISPUTE_ALREADY_RESOLVED');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update dispute
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: resolution,
          resolution: resolutionReason,
          resolutionType,
          resolvedAt: new Date(),
          assignedTo: adminId,
        },
      });

      // Handle held balance based on resolution
      for (const heldBalance of dispute.heldBalances) {
        if (resolution === DisputeStatus.RESOLVED_CUSTOMER_WIN) {
          // Refund to customer
          await this.refundHeldBalance(
            heldBalance.orderId,
            `Dispute resolved in customer favor: ${resolutionReason}`,
            tx,
          );
        } else if (resolution === DisputeStatus.RESOLVED_DRIVER_WIN) {
          // Release to vendor/driver/admin
          await this.releaseHeldBalance(
            heldBalance.orderId,
            DeliveryConfirmationType.ADMIN_RESOLUTION,
            `Dispute resolved in driver favor: ${resolutionReason}`,
            tx,
          );
        }
        // For RESOLVED_PARTIAL, handle custom logic
        // For FRAUD_DETECTED, lock accounts (implement later)
      }

      // Create audit log
      await tx.disputeAuditLog.create({
        data: {
          disputeId,
          actorId: adminId,
          actorRole: UserRole.ADMIN,
          action: 'DISPUTE_RESOLVED',
          oldValue: dispute.status,
          newValue: resolution,
          reason: resolutionReason,
        },
      });

      return updated;
    });
  }

  /**
   * Get held balances pending auto-release
   */
  async getPendingAutoReleases() {
    const now = new Date();
    return this.prisma.heldBalance.findMany({
      where: {
        status: HeldBalanceStatus.HELD,
        autoReleaseDate: {
          lte: now,
        },
      },
      include: {
        order: true,
      },
    });
  }

  /**
   * Auto-release eligible held balances
   */
  async processAutoReleases() {
    const pendingReleases = await this.getPendingAutoReleases();

    console.log(`Processing ${pendingReleases.length} auto-releases...`);

    for (const heldBalance of pendingReleases) {
      try {
        await this.releaseHeldBalance(
          heldBalance.orderId,
          DeliveryConfirmationType.TIMEOUT_RELEASE,
          'Auto-release after timeout period',
        );
        console.log(`Auto-released funds for order: ${heldBalance.orderId}`);
      } catch (error) {
        console.error(
          `Failed to auto-release order ${heldBalance.orderId}:`,
          error,
        );
      }
    }

    return pendingReleases.length;
  }
}
