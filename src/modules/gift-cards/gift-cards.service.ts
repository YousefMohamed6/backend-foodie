import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PurchaseGiftCardDto, RedeemGiftCardDto } from './dto/gift-card.dto';

@Injectable()
export class GiftCardsService {
  constructor(
    private prisma: PrismaService,
    private readonly walletService: WalletService,
  ) { }

  async findAll() {
    return this.prisma.giftCardTemplate.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.giftCardTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException('GIFT_CARD_TEMPLATE_NOT_FOUND');
    }
    return template;
  }

  async getMyCards(userId: string) {
    return this.prisma.userGiftCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async purchase(userId: string, purchaseDto: PurchaseGiftCardDto) {
    const template = await this.findOne(purchaseDto.templateId);

    // In a real app, verify payment first
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    return this.prisma.userGiftCard.create({
      data: {
        userId,
        code,
        amount: template.amount,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
      },
    });
  }

  async redeem(userId: string, redeemDto: RedeemGiftCardDto) {
    const card = await this.prisma.userGiftCard.findUnique({
      where: { code: redeemDto.code },
    });

    if (!card) {
      throw new NotFoundException('INVALID_GIFT_CARD');
    }

    if (card.isRedeemed) {
      throw new BadRequestException('GIFT_CARD_REDEEMED');
    }

    if (card.expiresAt && card.expiresAt < new Date()) {
      throw new BadRequestException('GIFT_CARD_EXPIRED');
    }

    // Add balance to user's wallet
    // Add balance to user's wallet
    await this.walletService.refund(
      userId,
      Number(card.amount),
      `Redeem Gift Card: ${card.code}`,
      `استرداد بطاقة هدايا: ${card.code}`,
    );

    return this.prisma.userGiftCard.update({
      where: { id: card.id },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
        usedAmount: Number(card.amount),
      },
    });
  }

  async checkCode(code: string) {
    const card = await this.prisma.userGiftCard.findUnique({
      where: { code },
    });
    if (!card) return null;
    return card;
  }
}
