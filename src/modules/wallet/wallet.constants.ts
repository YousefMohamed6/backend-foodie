export const WalletConstants = {
  OPERATION_ADD: 'add',
  OPERATION_SUBTRACT: 'subtract',
  PAYMENT_STATUS_PAID: 'PAID',
  PAYMENT_STATUS_PENDING: 'PENDING',
  GATEWAY_FAWATERAK: 'fawaterak',
  CURRENCY_EGP: 'EGP',
  TRANSACTION_USER_VENDOR: 'vendor',
  TRANSACTION_USER_DRIVER: 'driver',
  ADDRESS_NA: 'N/A',
  PLATFORM_TRANSACTION_TYPE_CREDIT: 'CREDIT',
} as const;

export type WalletOperation =
  | typeof WalletConstants.OPERATION_ADD
  | typeof WalletConstants.OPERATION_SUBTRACT;
