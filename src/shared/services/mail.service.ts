import { Injectable, Logger } from '@nestjs/common';
import { CurrenciesService } from '../../modules/currencies/currencies.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async sendOrderEmail(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        author: true,
        vendor: true,
        address: true,
        items: {
          include: {
            product: true,
            extras: true,
          },
        },
      },
    });

    if (!order) {
      this.logger.error(`Order with ID ${orderId} not found`);
      return;
    }

    const template = await this.prisma.emailTemplate.findFirst({
      where: { type: 'order_placed' },
    });

    if (!template) {
      this.logger.warn('Email template "order_placed" not found');
      return;
    }

    const currency = await this.currenciesService.findCurrent();
    const taxes = await this.prisma.tax.findMany({ where: { isActive: true } });

    // Format Helpers
    const formatPrice = (amount: any) => {
      const num = parseFloat(amount?.toString() || '0');
      const symbol = currency?.symbol || '$';
      return currency?.isAfter
        ? `${num.toFixed(2)}${symbol}`
        : `${symbol}${num.toFixed(2)}`;
    };

    // Construct Product Table
    let productTable = `<table style="width: 100%; border-collapse: collapse; border: 1px solid rgb(0, 0, 0);">
        <thead>
            <tr>
                <th style="text-align: left; border: 1px solid rgb(0, 0, 0);">Product Name</th>
                <th style="text-align: left; border: 1px solid rgb(0, 0, 0);">Quantity</th>
                <th style="text-align: left; border: 1px solid rgb(0, 0, 0);">Price</th>
                <th style="text-align: left; border: 1px solid rgb(0, 0, 0);">Extra Item Price</th>
                <th style="text-align: left; border: 1px solid rgb(0, 0, 0);">Total</th>
            </tr>
        </thead>
        <tbody>`;

    let subtotal = 0;
    for (const item of order.items) {
      const extrasPrice = item.extras.reduce(
        (sum, extra) => sum + parseFloat(extra.price.toString()),
        0,
      );
      const itemTotal =
        parseFloat(item.price.toString()) * item.quantity + extrasPrice;
      subtotal += itemTotal;

      const extrasList = item.extras.map((e) => e.name).join(', ');

      productTable += `
            <tr>
                <td style="width: 20%; border-top: 1px solid rgb(0, 0, 0);">${item.product.name}</td>
                <td style="width: 20%; border: 1px solid rgb(0, 0, 0);" rowspan="2">${item.quantity}</td>
                <td style="width: 20%; border: 1px solid rgb(0, 0, 0);" rowspan="2">${formatPrice(item.price)}</td>
                <td style="width: 20%; border: 1px solid rgb(0, 0, 0);" rowspan="2">${formatPrice(extrasPrice)}</td>
                <td style="width: 20%; border: 1px solid rgb(0, 0, 0);" rowspan="2">${formatPrice(itemTotal)}</td>
            </tr>
            <tr>
                <td style="width: 20%;">${extrasList.length > 0 ? 'Extra Item : ' + extrasList : ''}</td>
            </tr>`;
    }
    productTable += `</tbody></table>`;

    // Tax Details
    let taxDetails = '';
    let totalTax = 0;
    const baseForTax = subtotal - parseFloat(order.discountAmount.toString());
    for (const tax of taxes) {
      let taxAmount = 0;
      if (tax.type === 'percentage') {
        taxAmount = baseForTax * (parseFloat(tax.tax || '0') / 100);
      } else {
        taxAmount = parseFloat(tax.tax || '0');
      }
      totalTax += taxAmount;
      taxDetails += `<span style="font-size: 1rem;">${tax.label}: ${formatPrice(taxAmount)}</span><br>`;
    }

    // Replacement
    let message = template.message;
    const tokens = {
      '{username}': `${order.author.firstName} ${order.author.lastName}`,
      '{orderid}': order.id,
      '{date}': order.createdAt.toISOString().split('T')[0],
      '{address}': `${order.address?.addressLine1 || ''}, ${order.address?.addressLine2 || ''}`,
      '{paymentmethod}': order.paymentMethod,
      '{subtotal}': formatPrice(subtotal),
      '{discountamount}': formatPrice(order.discountAmount),
      '{shippingcharge}': formatPrice(order.deliveryCharge),
      '{tipamount}': formatPrice(order.tipAmount),
      '{totalAmount}': formatPrice(order.totalAmount),
      '{productdetails}': productTable,
      '{taxdetails}': taxDetails,
    };

    for (const [key, value] of Object.entries(tokens)) {
      message = message.replace(new RegExp(key, 'g'), value);
    }

    await this.emailService.sendEmail(
      order.author.email,
      template.subject.replace('{orderid}', order.id),
      message,
    );

    if (template.isSendToAdmin) {
      const emailConfig = (this.emailService as any).configService.get('email');
      if (emailConfig?.smtpUser) {
        await this.emailService.sendEmail(
          emailConfig.smtpUser,
          template.subject.replace('{orderid}', order.id),
          message,
        );
      }
    }
  }

  async sendWalletTopupEmail(
    userId: string,
    amount: number,
    paymentMethod: string,
    transactionId: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const template = await this.prisma.emailTemplate.findFirst({
      where: { type: 'wallet_topup' },
    });

    if (!template) return;

    const currency = await this.currenciesService.findCurrent();
    const formatPrice = (amount: number) => {
      const symbol = currency?.symbol || '$';
      return currency?.isAfter
        ? `${amount.toFixed(2)}${symbol}`
        : `${symbol}${amount.toFixed(2)}`;
    };

    let message = template.message;
    let walletBalance = '0.00';
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (profile) {
      walletBalance = formatPrice(parseFloat(profile.walletAmount.toString()));
    }

    const tokens = {
      '{username}': `${user.firstName} ${user.lastName}`,
      '{date}': new Date().toISOString().split('T')[0],
      '{amount}': formatPrice(amount),
      '{paymentmethod}': paymentMethod,
      '{transactionid}': transactionId,
      '{newwalletbalance}': walletBalance,
    };

    for (const [key, value] of Object.entries(tokens)) {
      message = message.replace(new RegExp(key, 'g'), value);
    }

    await this.emailService.sendEmail(user.email, template.subject, message);
  }
}
