import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { FawaterakService } from '../../shared/services/fawaterak.service';
import { WalletService } from '../wallet/wallet.service';

@ApiTags('Payment')
@Controller('payments/fawaterak')
export class FawaterakWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fawaterakService: FawaterakService,
    private readonly walletService: WalletService,
  ) { }

  @Post('webhook')
  @ApiOperation({ summary: 'Fawaterak webhook' })
  async webhook(
    @Body()
    body: {
      hashKey?: string;
      invoice_key?: string;
      invoice_id?: number | string;
      payment_method?: string;
      invoice_status?: string;
      pay_load?: any;
      referenceId?: string;
    },
  ) {
    const valid = this.fawaterakService.verifyPaidWebhookHash({
      hashKey: body.hashKey,
      invoice_id: body.invoice_id,
      invoice_key: body.invoice_key,
      payment_method: body.payment_method,
    });
    if (!valid) {
      throw new BadRequestException('INVALID_HASH_KEY');
    }

    const invoiceId =
      typeof body.invoice_id === 'string'
        ? Number(body.invoice_id)
        : body.invoice_id;
    const invoiceKey = body.invoice_key;
    if (!invoiceId || !invoiceKey) {
      return { ok: true };
    }

    const payloadReferenceId =
      body?.pay_load?.referenceId ||
      body?.pay_load?.reference_id ||
      body?.referenceId;

    const tx = await this.prisma.walletTransaction.findFirst({
      where: {
        isTopup: true,
        OR: [
          {
            metadata: {
              path: ['invoiceId'],
              equals: invoiceId,
            },
            AND: [
              {
                metadata: {
                  path: ['invoiceKey'],
                  equals: invoiceKey,
                },
              },
            ],
          },
          ...(payloadReferenceId
            ? [
              {
                referenceId: String(payloadReferenceId),
              },
            ]
            : []),
        ],
      },
      select: { id: true, userId: true, amount: true, paymentStatus: true, metadata: true },
    });

    if (!tx) {
      return { ok: true };
    }
    if (tx.paymentStatus === 'PAID') {
      return { ok: true };
    }

    const status = String(body.invoice_status || '').toLowerCase();
    if (status === 'paid') {
      await this.prisma.$transaction(async (db) => {
        const updated = await db.walletTransaction.updateMany({
          where: { id: tx.id, paymentStatus: { not: 'PAID' } },
          data: {
            paymentStatus: 'PAID',
            paymentMethod: body.payment_method,
            metadata: {
              ...(tx.metadata as any),
              webhook: body,
            },
          },
        });
        if (updated.count === 0) {
          return;
        }
        await this.walletService.updateUserWallet(
          tx.userId,
          (tx.amount as any).toNumber(),
          'add',
          db,
        );
      });
      return { ok: true };
    }

    const mapped =
      status === 'expired'
        ? 'EXPIRED'
        : status === 'failed'
          ? 'FAILED'
          : status === 'cancelled'
            ? 'FAILED'
            : 'FAILED';

    await this.prisma.walletTransaction.updateMany({
      where: { id: tx.id, paymentStatus: { not: 'PAID' } },
      data: { paymentStatus: mapped },
    });

    return { ok: true };
  }
}
