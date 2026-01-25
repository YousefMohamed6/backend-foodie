import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

type CreateInvoiceLinkResponse =
  | {
    status: 'success';
    message?: string;
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
    // Remove trailing slash
    return v.replace(/\/+$/, '');
  }

  // Helper to construct full API URL
  private getApiUrl(endpoint: string) {
    const base = this.baseUrl;
    // If base already contains /api/v2 and we are appending /api/v2...
    if (base.endsWith('/api/v2')) {
      // Just append the endpoint (e.g. /createInvoiceLink)
      return `${base}/${endpoint}`;
    }
    // Default behavior
    return `${base}/api/v2/${endpoint}`;
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
      customer_unique_id: string;
    };
    redirectionUrls: {
      successUrl: string;
      failUrl: string;
      pendingUrl: string;
    };
    payLoad: Record<string, any>;
  }) {
    const body = {
      cartItems: [
        {
          name: 'Wallet Topup',
          price: String(input.amount),
          quantity: '1',
        },
      ],
      cartTotal: Number(input.amount),
      shipping: 0,
      customer: {
        first_name: input.customer.first_name.replace(/[^a-zA-Z0-9\s]/g, '') || 'Customer',
        last_name: input.customer.last_name.replace(/[^a-zA-Z0-9\s]/g, '') || 'User',
        email: input.customer.email,
        phone: input.customer.phone.replace(/[^0-9]/g, ''),
        address: input.customer.address || 'Cairo, Egypt',
        customer_unique_id: String(input.customer.customer_unique_id),
      },
      redirectionUrls: input.redirectionUrls,
      currency: input.currency,
      payLoad: input.payLoad,
      sendEmail: true,
      sendSMS: false,
    };

    console.log(`[Fawaterak] Requesting Invoice Link: ${JSON.stringify(body)}`);

    const res = await fetch(this.getApiUrl('createInvoiceLink'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // Log response if status != 200 or 201
    const json = (await res.json()) as CreateInvoiceLinkResponse;
    if (!res.ok || json.status !== 'success') {
      console.error(`[Fawaterak] API Error: ${res.status} - ${JSON.stringify(json)}`);
      throw new BadRequestException(`INVOICE_CREATION_FAILED: ${json.message || 'Unknown error'}`);
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

  async getInvoiceData(invoiceId: string | number) {
    const res = await fetch(
      this.getApiUrl(`getInvoiceData/${invoiceId}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Fawaterak] Get Invoice Failed ${res.status}: ${text}`);
      return { status: 'error', message: text };
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    } else {
      const text = await res.text();
      console.error(`[Fawaterak] Received non-JSON response: ${text}`);
      return { status: 'error', message: 'Non-JSON response' };
    }
  }

  async getInvoiceStatus(invoiceId: string | number) {
    const res = await fetch(
      this.getApiUrl(`getTransactionStatus/${invoiceId}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Fawaterak] Get Transaction Status Failed ${res.status}: ${text}`);
      return { status: 'error', message: text };
    }

    return await res.json();
  }
}
