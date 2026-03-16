export const QUEUES = {
  EMAIL: 'email',
  LOCATION: 'location',
  PAYMENT: 'payment',
  CLEANUP: 'cleanup',
} as const;

export const JOBS = {
  SEND_EMAIL: 'send-email',
  PERSIST_LOCATION: 'persist-location',
  VERIFY_PAYMENT: 'verify-payment',
  CLEANUP_EXPIRED_TOKENS: 'cleanup-expired-tokens',
} as const;
