import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RidersService } from './riders.service';
import { UpdateAvailabilityDto, UpdateLocationDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

@Controller('riders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RIDER)
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Post('onboard')
  async onboard(@CurrentUser() user: TokenPayload) {
    return this.ridersService.onboard(user.userId);
  }

  @Patch('availability')
  async updateAvailability(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.ridersService.updateAvailability(user.userId, dto);
  }

  @Post('location')
  async updateLocation(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.ridersService.updateLocation(user.userId, dto);
  }

  @Get('me')
  async getMe(@CurrentUser() user: TokenPayload) {
    return this.ridersService.getMe(user.userId);
  }
}
