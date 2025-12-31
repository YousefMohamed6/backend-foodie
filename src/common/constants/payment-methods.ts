/**
 * Payment Methods
 * Simple constants to avoid magic strings and typos
 */
export const PaymentMethod = {
    WALLET: 'wallet',
    CARD: 'card',
    CASH: 'cash',
    ONLINE: 'online',
} as const;

export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];
