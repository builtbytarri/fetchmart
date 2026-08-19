import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class GoogleSignInDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;

  // Only honoured when creating a brand-new account. Ignored if the user already exists
  // — we never want client input to mutate an existing user's role.
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
