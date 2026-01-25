import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTopUpDto } from './dto/create-top-up.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly i18n: I18nService,
  ) { }

  @Post('top-up')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.DRIVER, UserRole.VENDOR)
  async createTopUp(@Req() req, @Body() dto: CreateTopUpDto) {
    return this.paymentService.createTopUp(req.user.id, dto);
  }

  @Get('redirect')
  async handleRedirect(
    @Query('invoiceId') invoiceId: string,
    @Query('invoice_id') invoice_id: string,
    @Req() req,
    @Res() res
  ) {
    // Determine language (detect via x-lang header or query or default to ar)
    const lang = req.headers['x-lang'] || req.query['lang'] || 'ar';
    const isRtl = lang === 'ar';

    // Standardize param
    const id = invoiceId || invoice_id;
    if (!id) {
      return res.status(400).send('<h1>Missing Invoice ID</h1>');
    }

    const result = await this.paymentService.verifyPayment(id);
    const data = result.data || {};

    const title = result.status === 'SUCCESS'
      ? await this.i18n.translate('messages.PAYMENT_SUCCESS_TITLE', { lang })
      : await this.i18n.translate('messages.PAYMENT_FAILED_TITLE', { lang });

    const message = result.status === 'SUCCESS'
      ? await this.i18n.translate('messages.PAYMENT_SUCCESS_MSG', { lang })
      : (result.message || await this.i18n.translate('messages.PAYMENT_FAILED_MSG', { lang }));

    const closeMsg = await this.i18n.translate('messages.PAYMENT_CLOSE_WINDOW', { lang });

    // Detail Labels
    const lblInvoiceId = await this.i18n.translate('messages.INVOICE_ID', { lang });
    const lblAmount = await this.i18n.translate('messages.AMOUNT', { lang });
    const lblMethod = await this.i18n.translate('messages.PAYMENT_METHOD', { lang });
    const lblDate = await this.i18n.translate('messages.TRANSACTION_DATE', { lang });

    return res.send(`
            <html dir="${isRtl ? 'rtl' : 'ltr'}">
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { 
                    font-family: sans-serif; 
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 16px;
                    box-sizing: border-box;
                    text-align: center;
                    background-color: #f1f5f9;
                  }
                  .card {
                    background: white;
                    padding: 24px;
                    border-radius: 16px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    max-width: 450px;
                    width: 100%;
                  }
                  .success { color: #10b981; font-size: 22px; margin-bottom: 8px; font-weight: 700; }
                  .fail { color: #ef4444; font-size: 22px; margin-bottom: 8px; font-weight: 700; }
                  .icon { font-size: 56px; margin-bottom: 16px; }
                  .msg { color: #475569; margin-bottom: 24px; font-size: 15px; }
                  
                  .details {
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                    text-align: ${isRtl ? 'right' : 'left'};
                    margin-bottom: 24px;
                  }
                  .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    font-size: 14px;
                  }
                  .label { color: #64748b; font-weight: 500; }
                  .value { color: #1e293b; font-weight: 700; }
                  
                  .footer { color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="icon">${result.status === 'SUCCESS' ? '✅' : '❌'}</div>
                  <div class="${result.status === 'SUCCESS' ? 'success' : 'fail'}">${title}</div>
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

                  <div class="footer">
                    ${closeMsg}
                  </div>
                </div>
              </body>
            </html>
        `);
  }
}
