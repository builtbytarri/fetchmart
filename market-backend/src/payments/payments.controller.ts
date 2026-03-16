import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId/initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.paymentsService.initiatePayment(orderId, user.userId);
  }

  @Get('verify/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }

  @Post('webhook/korah')
  async handleWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-korah-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }
}
