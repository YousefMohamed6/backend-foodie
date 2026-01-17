export class VendorDefaults {
  static readonly DEFAULT_STATUS = true;
  static readonly DEFAULT_DINE_IN = false;
  static readonly INITIAL_REVIEWS_SUM = 0;
  static readonly INITIAL_REVIEWS_COUNT = 0;
  static readonly INITIAL_TOTAL_ORDERS = 0;
  static readonly INITIAL_WALLET_AMOUNT = 0;
}

export class VendorScheduleDefaults {
  static readonly DEFAULT_OPEN_TIME = '00:00';
  static readonly DEFAULT_CLOSE_TIME = '23:59';
  static readonly DEFAULT_IS_ACTIVE = true;
}

export enum VendorDocumentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}
