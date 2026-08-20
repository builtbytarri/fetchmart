export const QUEUES = {
  EMAIL: 'email',
  LOCATION: 'location',
  PAYMENT: 'payment',
  CLEANUP: 'cleanup',
  DELIVERY: 'delivery',
} as const;

export const JOBS = {
  SEND_EMAIL: 'send-email',
  PERSIST_LOCATION: 'persist-location',
  VERIFY_PAYMENT: 'verify-payment',
  CLEANUP_EXPIRED_TOKENS: 'cleanup-expired-tokens',
  RIDER_OFFER_TIMEOUT: 'rider-offer-timeout',
  STORE_ACCEPT_TIMEOUT: 'store-accept-timeout',
} as const;
