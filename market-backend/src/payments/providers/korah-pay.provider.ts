import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config';
import type { PaymentProvider } from '../payment.interface';
import {
  InitiatePaymentOptions,
  PaymentInitiationResult,
  PaymentVerificationResult,
  RefundResult,
  PaymentStatus,
} from '../payment.interface';

@Injectable()
export class KorahPayProvider implements PaymentProvider {
  private readonly logger = new Logger(KorahPayProvider.name);
  private readonly baseUrl = 'https://api.korahpay.com';

  constructor(private readonly appConfig: AppConfigService) {}

  async initiatePayment(options: InitiatePaymentOptions): Promise<PaymentInitiationResult> {
    const paymentConfig = this.appConfig.getPaymentConfig();

    try {
      const response = await fetch(`${this.baseUrl}/transactions/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paymentConfig.korahPaySecretKey}`,
        },
        body: JSON.stringify({
          amount: options.amount * 100,
          currency: options.currency,
          email: options.customerEmail,
          reference: `order_${options.orderId}_${Date.now()}`,
          metadata: {
            orderId: options.orderId,
            customerName: options.customerName,
            ...options.metadata,
          },
        }),
      });

      const data = await response.json() as { status: boolean; data: { reference: string; authorization_url: string; access_code: string } };

      if (data.status) {
        return {
          success: true,
          reference: data.data.reference,
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
        };
      }

      return {
        success: false,
        reference: '',
      };
    } catch (error) {
      this.logger.error('Payment initiation failed', error);
      return {
        success: false,
        reference: '',
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    const paymentConfig = this.appConfig.getPaymentConfig();

    try {
      const response = await fetch(`${this.baseUrl}/transactions/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paymentConfig.korahPaySecretKey}`,
        },
      });

      const data = await response.json() as {
        status: boolean;
        data: {
          status: string;
          reference: string;
          amount: number;
          currency: string;
          paid_at: string;
        };
      };

      if (data.status) {
        return {
          success: true,
          reference: data.data.reference,
          status: this.mapStatus(data.data.status),
          amount: data.data.amount / 100,
          currency: data.data.currency,
          paidAt: data.data.paid_at ? new Date(data.data.paid_at) : undefined,
        };
      }

      return {
        success: false,
        reference,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'NGN',
      };
    } catch (error) {
      this.logger.error('Payment verification failed', error);
      return {
        success: false,
        reference,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'NGN',
      };
    }
  }

  async refundPayment(reference: string, amount?: number): Promise<RefundResult> {
    const paymentConfig = this.appConfig.getPaymentConfig();

    try {
      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paymentConfig.korahPaySecretKey}`,
        },
        body: JSON.stringify({
          transaction: reference,
          ...(amount && { amount: amount * 100 }),
        }),
      });

      const data = await response.json() as {
        status: boolean;
        data: { reference: string; amount: number };
      };

      if (data.status) {
        return {
          success: true,
          reference,
          refundReference: data.data.reference,
          amount: data.data.amount / 100,
        };
      }

      return {
        success: false,
        reference,
        amount: 0,
      };
    } catch (error) {
      this.logger.error('Refund failed', error);
      return {
        success: false,
        reference,
        amount: 0,
      };
    }
  }

  private mapStatus(status: string): PaymentStatus {
    switch (status.toLowerCase()) {
      case 'success':
        return PaymentStatus.SUCCESS;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'abandoned':
        return PaymentStatus.ABANDONED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
