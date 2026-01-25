import { Body, Controller, Get, Logger, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTopUpDto } from './dto/create-top-up.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly i18n: I18nService,
  ) { }

  /**
   * Endpoint to initiate a top-up.
   * Step 1 & 2
   */
  @Post('top-up')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.DRIVER, UserRole.VENDOR)
  async createTopUp(@Req() req, @Body() dto: CreateTopUpDto) {
    this.logger.log(`[PAYMENT] Received top-up request for user ${req.user.id}, amount: ${dto.amount}`);
    return this.paymentService.createTopUp(req.user.id, dto);
  }

  /**
   * Endpoint triggered by Fawaterak redirect.
   * Step 4: Trigger only (Sync verification for UI)
   */
  @Get('redirect')
  async handleRedirect(
    @Query('invoiceId') invoiceId: string,
    @Query('invoice_id') invoice_id: string,
    @Req() req,
    @Res() res
  ) {
    const id = invoiceId || invoice_id;
    this.logger.log(`[PAYMENT] Redirect triggered for invoiceId: ${id}`);

    // Detect Language
    const lang = req.headers['x-lang'] || req.query['lang'] || 'ar';
    const isRtl = lang === 'ar';

    if (!id) {
      return res.status(400).send('<h1>Missing Invoice ID</h1>');
    }

    // Step 5 & 6: Verification & Atomic Update
    const result = await this.paymentService.verifyPayment(id);
    const data = result.data || {};

    // Prepare localized UI strings
    const title = result.status === 'SUCCESS'
      ? await this.i18n.translate('messages.PAYMENT_SUCCESS_TITLE', { lang })
      : await this.i18n.translate('messages.PAYMENT_FAILED_TITLE', { lang });

    const message = result.status === 'SUCCESS'
      ? await this.i18n.translate('messages.PAYMENT_SUCCESS_MSG', { lang })
      : (result.message || await this.i18n.translate('messages.PAYMENT_FAILED_MSG', { lang }));

    const closeMsg = await this.i18n.translate('messages.PAYMENT_CLOSE_WINDOW', { lang });
    const lblInvoiceId = await this.i18n.translate('messages.INVOICE_ID', { lang });
    const lblAmount = await this.i18n.translate('messages.AMOUNT', { lang });
    const lblMethod = await this.i18n.translate('messages.PAYMENT_METHOD', { lang });
    const lblDate = await this.i18n.translate('messages.TRANSACTION_DATE', { lang });

    // Responsive Receipt HTML
    return res.send(`
            <html dir="${isRtl ? 'rtl' : 'ltr'}">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 16px;
                    box-sizing: border-box;
                    background-color: #f8fafc;
                  }
                  .card {
                    background: white;
                    padding: 32px;
                    border-radius: 24px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    max-width: 480px;
                    width: 100%;
                    text-align: center;
                  }
                  .icon { font-size: 64px; margin-bottom: 20px; }
                  .status-title { font-size: 24px; font-weight: 800; margin-bottom: 12px; }
                  .success-text { color: #10b981; }
                  .fail-text { color: #ef4444; }
                  .msg { color: #64748b; margin-bottom: 32px; font-size: 16px; line-height: 1.5; }
                  
                  .details {
                    background: #f1f5f9;
                    border-radius: 16px;
                    padding: 20px;
                    text-align: ${isRtl ? 'right' : 'left'};
                    margin-bottom: 32px;
                  }
                  .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    font-size: 15px;
                  }
                  .detail-row:last-child { margin-bottom: 0; }
                  .label { color: #94a3b8; }
                  .value { color: #1e293b; font-weight: 700; }
                  
                  .footer { color: #cbd5e1; font-size: 14px; font-weight: 500; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="icon">${result.status === 'SUCCESS' ? '✅' : '❌'}</div>
                  <div class="status-title ${result.status === 'SUCCESS' ? 'success-text' : 'fail-text'}">${title}</div>
                  <p class="msg">${message}</p>
                  
                  <div class="details">
                    <div class="detail-row">
                      <span class="label">${lblInvoiceId}</span>
                      <span class="value">#${data.invoice_id || id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">${lblAmount}</span>
                      <span class="value">${data.total || '--'} ${data.currency || 'EGP'}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">${lblMethod}</span>
                      <span class="value">${data.payment_method || '--'}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">${lblDate}</span>
                      <span class="value">${data.paid_at ? new Date(data.paid_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : '--'}</span>
                    </div>
                  </div>

                  <div class="footer">${closeMsg}</div>
                </div>
              </body>
            </html>
        `);
  }
}
