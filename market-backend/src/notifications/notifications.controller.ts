import { Body, Controller, Delete, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { JwtAuthGuard } from '../auth';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** Called by the mobile app after login to register the device push token. */
  @Post('register-token')
  @HttpCode(200)
  async registerToken(@Req() req: any, @Body() dto: RegisterTokenDto) {
    await this.notificationsService.registerToken(req.user.userId, dto.token);
    return { success: true };
  }

  /** Called on logout so the device stops receiving notifications. */
  @Delete('register-token')
  @HttpCode(200)
  async clearToken(@Req() req: any) {
    await this.notificationsService.clearToken(req.user.userId);
    return { success: true };
  }
}
