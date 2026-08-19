import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class AppleSignInDto {
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  // Apple only returns full name on the FIRST sign-in. Mobile must capture and send it
  // through; we use it only when creating a new account.
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  // Only used for new account creation. Existing users keep their stored role.
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
