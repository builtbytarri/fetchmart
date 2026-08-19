import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { PrismaService } from '../database';
import { AppConfigService } from '../config';
import { EmailService } from '../email';
import { RegisterDto, LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, SendOtpDto, VerifyOtpDto, GoogleSignInDto, AppleSignInDto } from './dto';
import { AuthProvider, UserRole, UserStatus } from '@prisma/client';
import { OAuthService, VerifiedIdentity } from './oauth.service';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly resetTokenExpiry = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
    private readonly emailService: EmailService,
    private readonly oauthService: OAuthService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    // Create rider profile if user is registering as a rider
    if (dto.role === UserRole.RIDER) {
      await this.prisma.rider.create({
        data: {
          userId: user.id,
          isAvailable: true,
        },
      });
    }

    return this.generateTokens(user.id, user.role);
  }

  async signInWithGoogle(dto: GoogleSignInDto) {
    const identity = await this.oauthService.verifyGoogleIdToken(dto.idToken);
    return this.signInWithProvider(AuthProvider.GOOGLE, identity, identity.name, dto.role);
  }

  async signInWithApple(dto: AppleSignInDto) {
    const identity = await this.oauthService.verifyAppleIdentityToken(dto.identityToken);
    // Apple only returns the user's name on the FIRST sign-in. The mobile client passes it through;
    // we use it only when creating a new user record.
    const fallbackName = [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim() || undefined;
    return this.signInWithProvider(AuthProvider.APPLE, identity, fallbackName, dto.role);
  }

  /**
   * Find-or-create the User for a verified provider identity.
   *
   * SECURITY: this method assumes `identity` has already been verified against
   * the provider's signed token. Never call it with raw client input.
   */
  private async signInWithProvider(
    provider: AuthProvider,
    identity: VerifiedIdentity,
    fallbackName: string | undefined,
    requestedRole: UserRole | undefined,
  ): Promise<AuthTokens & { user: { id: string; email: string; name: string; role: string } }> {
    // 1. Direct match on (provider, providerUid) — happy path for repeat sign-ins
    const linked = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerUid: { provider, providerUid: identity.providerUid } },
      include: { user: true },
    });

    if (linked) {
      if (linked.user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Account suspended');
      }
      return this.completeAuth(linked.user);
    }

    // 2. Account-linking: provider hasn't been seen before, but the email might already be on file.
    // We only auto-link when the provider attests `email_verified`; otherwise an attacker could
    // create a Google/Apple account with someone else's email and take over their account.
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: identity.email },
    });

    if (existingByEmail) {
      if (!identity.emailVerified) {
        throw new BadRequestException(
          'An account with this email exists. Please sign in with your existing method first to link this provider.',
        );
      }
      if (existingByEmail.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Account suspended');
      }
      await this.prisma.oAuthAccount.create({
        data: {
          userId: existingByEmail.id,
          provider,
          providerUid: identity.providerUid,
          email: identity.email,
        },
      });
      return this.completeAuth(existingByEmail);
    }

    // 3. Brand-new account. Default to CUSTOMER for OAuth sign-ups; STORE/RIDER onboarding has
    // extra requirements that are better collected via the regular email flow.
    const role = requestedRole ?? UserRole.CUSTOMER;
    const name =
      identity.name?.trim() ||
      fallbackName?.trim() ||
      identity.email.split('@')[0];

    const newUser = await this.prisma.user.create({
      data: {
        email: identity.email,
        // passwordHash deliberately left null — this is an OAuth-only account.
        name,
        role,
        oauthAccounts: {
          create: {
            provider,
            providerUid: identity.providerUid,
            email: identity.email,
          },
        },
      },
    });

    if (role === UserRole.RIDER) {
      await this.prisma.rider.create({
        data: { userId: newUser.id, isAvailable: true },
      });
    }

    return this.completeAuth(newUser);
  }

  private async completeAuth(user: { id: string; email: string; name: string; role: UserRole }) {
    const tokens = await this.generateTokens(user.id, user.role);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: { id: string; email: string; name: string; role: string } }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended');
    }

    // OAuth-only accounts have no passwordHash. Reject with a generic-but-helpful message
    // that doesn't reveal which providers the user has linked (avoids enumeration).
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account was created with social sign-in. Please continue with Google or Apple.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (storedToken.user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(storedToken.userId, storedToken.user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (storedToken && !storedToken.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + this.resetTokenExpiry),
      },
    });

    const resetUrl = `${this.appConfig.port}/auth/reset-password?token=${resetToken}`;
    await this.emailService.sendPasswordResetEmail(user.email, resetToken, resetUrl);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async generateTokens(userId: string, role: UserRole): Promise<AuthTokens> {
    const jwtConfig = this.appConfig.getJwtConfig();

    const payload: TokenPayload = { userId, role };

    const accessToken = jwt.sign(payload, jwtConfig.accessSecret!, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    const jwtConfig = this.appConfig.getJwtConfig();

    try {
      return jwt.verify(token, jwtConfig.accessSecret!) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.phoneOtp.deleteMany({
      where: { phone: dto.phone, verifiedAt: null },
    });

    await this.prisma.phoneOtp.create({
      data: {
        phone: dto.phone,
        code,
        expiresAt,
      },
    });

    console.log(`\n========================================`);
    console.log(`📱 OTP for ${dto.phone}: ${code}`);
    console.log(`========================================\n`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    const otp = await this.prisma.phoneOtp.findFirst({
      where: {
        phone: dto.phone,
        code: dto.code,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { verifiedAt: new Date() },
    });

    return { verified: true };
  }
}
