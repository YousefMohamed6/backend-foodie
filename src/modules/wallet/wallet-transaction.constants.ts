import * as arMessages from '../../i18n/ar/messages.json';
import * as enMessages from '../../i18n/en/messages.json';

type MessageKey = keyof typeof enMessages;

/**
 * Helper function to interpolate template strings
 */
function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return Object.entries(params).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

/**
 * Get localized wallet transaction descriptions from i18n files
 */
export function getWalletTransactionDescription(
  key: MessageKey,
  params: Record<string, string | number> = {},
): { en: string; ar: string } {
  const enTemplate = enMessages[key] || key;
  const arTemplate = arMessages[key] || key;

  return {
    en: interpolate(enTemplate, params),
    ar: interpolate(arTemplate, params),
  };
}

/**
 * Wallet transaction description keys - matches i18n message keys
 */
export const WalletTransactionKeys = {
  TOPUP: 'WALLET_TX_TOPUP' as MessageKey,
  WITHDRAWAL: 'WALLET_TX_WITHDRAWAL' as MessageKey,
  ORDER_PAYMENT: 'WALLET_TX_ORDER_PAYMENT' as MessageKey,
  ORDER_PAYMENT_HELD: 'WALLET_TX_ORDER_PAYMENT_HELD' as MessageKey,
  ORDER_REFUND: 'WALLET_TX_ORDER_REFUND' as MessageKey,
  VENDOR_EARNINGS: 'WALLET_TX_VENDOR_EARNINGS' as MessageKey,
  DRIVER_EARNINGS: 'WALLET_TX_DRIVER_EARNINGS' as MessageKey,
  REFERRAL_BONUS: 'WALLET_TX_REFERRAL_BONUS' as MessageKey,
  GIFT_CARD_REDEMPTION: 'WALLET_TX_GIFT_CARD_REDEMPTION' as MessageKey,
  CASHBACK_EARNED: 'WALLET_TX_CASHBACK_EARNED' as MessageKey,
  TIP_RECEIVED: 'WALLET_TX_TIP_RECEIVED' as MessageKey,
  ADMIN_ADJUSTMENT: 'WALLET_TX_ADMIN_ADJUSTMENT' as MessageKey,
  SUBSCRIPTION_PAYMENT: 'WALLET_TX_SUBSCRIPTION_PAYMENT' as MessageKey,
  CASH_HANDOVER: 'WALLET_TX_CASH_HANDOVER' as MessageKey,
  AUTO_CANCEL_REFUND: 'WALLET_TX_AUTO_CANCEL_REFUND' as MessageKey,
  CASH_COLLECTED_DEBT: 'WALLET_TX_CASH_COLLECTED_DEBT' as MessageKey,
  DELIVERY_CONFIRMED_REASON: 'DELIVERY_CONFIRMED_REASON' as MessageKey,
  ORDER_CANCELLED_BY_USER: 'ORDER_CANCELLED_BY_USER' as MessageKey,
} as const;

/**
 * Convenience functions to get localized wallet transaction descriptions
 */
export const WalletTransactionDescriptions = {
  topUp: (paymentMethod: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.TOPUP, {
      paymentMethod,
    }),

  withdrawal: () =>
    getWalletTransactionDescription(WalletTransactionKeys.WITHDRAWAL),

  orderPayment: (orderId: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.ORDER_PAYMENT, {
      orderId,
    }),

  orderPaymentHeld: (orderId: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.ORDER_PAYMENT_HELD, {
      orderId,
    }),

  orderRefund: (orderId: string, reason: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.ORDER_REFUND, {
      orderId,
      reason,
    }),

  vendorEarnings: (orderId: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.VENDOR_EARNINGS, {
      orderId,
    }),

  driverEarnings: (orderId: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.DRIVER_EARNINGS, {
      orderId,
    }),

  referralBonus: (referralCode: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.REFERRAL_BONUS, {
      referralCode,
    }),

  giftCardRedemption: (code: string) =>
    getWalletTransactionDescription(
      WalletTransactionKeys.GIFT_CARD_REDEMPTION,
      { code },
    ),

  cashbackEarned: (orderId: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.CASHBACK_EARNED, {
      orderId,
    }),

  tipReceived: (orderId: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.TIP_RECEIVED, {
      orderId,
    }),

  adminAdjustment: (reason: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.ADMIN_ADJUSTMENT, {
      reason,
    }),

  subscriptionPayment: (planName: string) =>
    getWalletTransactionDescription(
      WalletTransactionKeys.SUBSCRIPTION_PAYMENT,
      { planName },
    ),

  cashHandover: (orderId: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.CASH_HANDOVER, {
      orderId,
    }),

  autoCancelRefund: (orderId: string, timeoutMinutes: number) =>
    getWalletTransactionDescription(WalletTransactionKeys.AUTO_CANCEL_REFUND, {
      orderId,
      timeoutMinutes,
    }),

  cashCollectedDebt: (orderId: string) =>
    getWalletTransactionDescription(WalletTransactionKeys.CASH_COLLECTED_DEBT, {
      orderId,
    }),

  deliveryConfirmedReason: () =>
    getWalletTransactionDescription(
      WalletTransactionKeys.DELIVERY_CONFIRMED_REASON,
    ),

  orderCancelledByUser: () =>
    getWalletTransactionDescription(
      WalletTransactionKeys.ORDER_CANCELLED_BY_USER,
    ),
} as const;
