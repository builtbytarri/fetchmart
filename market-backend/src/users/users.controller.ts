import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
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
}
