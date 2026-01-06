import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

type CreateInvoiceLinkResponse =
  | {
    status: 'success';
    data: { url: string; invoiceKey: string; invoiceId: number };
  }
  | { status: string; message?: string; data?: any };

@Injectable()
export class FawaterakService {
  constructor(private readonly configService: ConfigService) { }

  private get baseUrl() {
    const v = this.configService.get<string>('FAWATERAK_BASE_URL');
    if (!v) {
      throw new BadRequestException('PAYMENT_CONFIG_INVALID');
    }
    return v.replace(/\/+$/, '');
  }

  private get apiKey() {
    const v = this.configService.get<string>('FAWATERAK_API_KEY');
    if (!v) {
      throw new BadRequestException('PAYMENT_CONFIG_INVALID');
    }
    return v;
  }

  private get vendorKey() {
    const v = this.configService.get<string>('FAWATERAK_VENDOR_KEY');
    if (!v) {
      throw new BadRequestException('PAYMENT_CONFIG_INVALID');
    }
    return v;
  }

  async createInvoiceLink(input: {
    amount: number;
    currency: 'EGP';
    customer: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      address?: string;
    };
    redirectionUrls: { successUrl: string; failUrl: string; pendingUrl: string };
    payLoad: Record<string, any>;
  }) {
    const res = await fetch(`${this.baseUrl}/api/v2/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        cartTotal: input.amount,
        currency: input.currency,
        customer: input.customer,
        redirectionUrls: input.redirectionUrls,
        cartItems: [
          {
            name: 'Wallet Topup',
            price: String(input.amount),
            quantity: '1',
          },
        ],
        payLoad: input.payLoad,
        sendEmail: true,
        sendSMS: false,
      }),
    });

    const json = (await res.json()) as CreateInvoiceLinkResponse;
    if (!res.ok || json.status !== 'success' || !('data' in json)) {
      throw new BadRequestException('INVOICE_CREATION_FAILED');
    }

    return json.data;
  }

  verifyPaidWebhookHash(input: {
    hashKey?: string;
    invoice_id?: number | string;
    invoice_key?: string;
    payment_method?: string;
  }) {
    const { hashKey, invoice_id, invoice_key, payment_method } = input;
    const invoiceId =
      typeof invoice_id === 'string' ? Number(invoice_id) : invoice_id;
    if (!hashKey || !invoiceId || !invoice_key || !payment_method) {
      return false;
    }

    const queryParam = `InvoiceId=${invoiceId}&InvoiceKey=${invoice_key}&PaymentMethod=${payment_method}`;
    const digest = crypto
      .createHmac('sha256', this.vendorKey)
      .update(queryParam)
      .digest('hex');

    const a = Buffer.from(digest.toLowerCase());
    const b = Buffer.from(String(hashKey).toLowerCase());
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  }
}
