export interface PaymentProvider {
  initiatePayment(options: InitiatePaymentOptions): Promise<PaymentInitiationResult>;
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;
  refundPayment(reference: string, amount?: number): Promise<RefundResult>;
}

export interface InitiatePaymentOptions {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  /** Mobile app's deep-link redirect URL (e.g. fetchmart://payment/callback).
   *  Falls back to the provider's default if not provided. */
  redirectUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitiationResult {
  success: boolean;
  reference: string;
  authorizationUrl?: string;
  accessCode?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt?: Date;
  /** Flutterwave reusable card token — only present for card payments */
  cardToken?: string;
  /** Masked card info for display, e.g. "VISA •••• 4567" */
  maskedCard?: string;
  cardType?: string;
  expiryMonth?: string;
  expiryYear?: string;
}

export interface RefundResult {
  success: boolean;
  reference: string;
  refundReference?: string;
  amount: number;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ABANDONED = 'ABANDONED',
  REFUNDED = 'REFUNDED',
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';
