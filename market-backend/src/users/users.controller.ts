import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UpdateUserDto,
  UpdateNotificationPreferencesDto,
  CreateSavedAddressDto,
  UpdateSavedAddressDto,
} from './dto';
import { JwtAuthGuard, CurrentUser } from '../auth';

interface TokenPayload {
  userId: string;
  role: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: TokenPayload) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.userId, dto);
  }

  @Get('me/notifications')
  async getNotificationPreferences(@CurrentUser() user: TokenPayload) {
    return this.usersService.getNotificationPreferences(user.userId);
  }

  @Patch('me/notifications')
  async updateNotificationPreferences(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.userId, dto);
  }

  @Get('me/addresses')
  async listSavedAddresses(@CurrentUser() user: TokenPayload) {
    return this.usersService.listSavedAddresses(user.userId);
  }

  @Post('me/addresses')
  async createSavedAddress(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateSavedAddressDto,
  ) {
    return this.usersService.createSavedAddress(user.userId, dto);
  }

  @Patch('me/addresses/:id')
  async updateSavedAddress(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSavedAddressDto,
  ) {
    return this.usersService.updateSavedAddress(user.userId, id, dto);
  }

  @Delete('me/addresses/:id')
  async deleteSavedAddress(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.deleteSavedAddress(user.userId, id);
  }
}
