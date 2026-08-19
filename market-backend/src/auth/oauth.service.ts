import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import { AppConfigService } from '../config';

/**
 * Output of a successful provider token verification.
 *
 * SECURITY NOTE: every field here has been independently validated against the
 * provider's signed token. Callers MUST NOT accept these fields from untrusted
 * client input — the whole point of OAuth is that we trust the provider, not
 * the device sitting in front of it.
 */
export interface VerifiedIdentity {
  /** Stable user identifier issued by the provider. Never changes. */
  providerUid: string;
  /** Email reported by the provider (lower-cased). */
  email: string;
  /** True only if the provider attests the email has been verified. */
  emailVerified: boolean;
  /** Optional display name (Google sometimes provides this; Apple does not). */
  name?: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly appleJwks: JwksClient;

  constructor(private readonly appConfig: AppConfigService) {
    this.googleClient = new OAuth2Client();
    this.appleJwks = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours — Apple rotates keys infrequently
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  /**
   * Verify a Google ID token end-to-end.
   *
   * google-auth-library performs:
   *  - Signature verification against Google's published JWKs
   *  - `iss` check (accounts.google.com / https://accounts.google.com)
   *  - `aud` check against our list of accepted client IDs (one per platform)
   *  - `exp` / `iat` checks
   *
   * If any of those fail it throws — we surface that as 401.
   */
  async verifyGoogleIdToken(idToken: string): Promise<VerifiedIdentity> {
    const { iosClientId, androidClientId, webClientId } = this.appConfig.getGoogleOAuthConfig();
    const audiences = [iosClientId, androidClientId, webClientId].filter(
      (v): v is string => Boolean(v),
    );

    if (audiences.length === 0) {
      this.logger.error('No Google OAuth client IDs configured — refusing to verify token');
      throw new UnauthorizedException('Google sign-in is not configured');
    }

    let payload: import('google-auth-library').TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audiences,
      });
      payload = ticket.getPayload();
    } catch (err) {
      this.logger.warn(`Google token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload) throw new UnauthorizedException('Invalid Google token payload');
    if (!payload.sub) throw new UnauthorizedException('Google token missing subject');
    if (!payload.email) throw new UnauthorizedException('Google token missing email');

    return {
      providerUid: payload.sub,
      email: payload.email.toLowerCase(),
      // Google sets email_verified to true for any account they've checked.
      // Default to false if absent — never silently treat it as verified.
      emailVerified: payload.email_verified === true,
      name: payload.name,
    };
  }

  /**
   * Verify an Apple identity token (the JWT returned to the iOS client).
   *
   * We verify:
   *  - Signature against Apple's JWKs (RS256)
   *  - `iss` is exactly `https://appleid.apple.com`
   *  - `aud` matches our configured bundle ID (the iOS app's bundle ID)
   *  - `exp` (handled by jsonwebtoken)
   */
  async verifyAppleIdentityToken(token: string): Promise<VerifiedIdentity> {
    const { bundleId } = this.appConfig.getAppleOAuthConfig();
    if (!bundleId) {
      this.logger.error('APPLE_BUNDLE_ID is not configured — refusing to verify token');
      throw new UnauthorizedException('Apple sign-in is not configured');
    }

    // First decode (without verification) to read the kid header so we can fetch the right key.
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid Apple token format');
    }
    const kid = decoded.header.kid;
    if (!kid) throw new UnauthorizedException('Apple token missing key id');

    let publicKey: string;
    try {
      const key = await this.appleJwks.getSigningKey(kid);
      publicKey = key.getPublicKey();
    } catch (err) {
      this.logger.warn(`Failed to load Apple signing key: ${(err as Error).message}`);
      throw new UnauthorizedException('Could not verify Apple token');
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: bundleId,
        issuer: 'https://appleid.apple.com',
      }) as jwt.JwtPayload;
    } catch (err) {
      this.logger.warn(`Apple token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid Apple token');
    }

    if (!payload.sub) throw new UnauthorizedException('Apple token missing subject');

    // Apple sometimes sends email_verified as the string 'true'. Treat anything else as unverified.
    const emailVerified =
      payload.email_verified === true || payload.email_verified === 'true';

    // Apple may omit email entirely after the first sign-in (the user can also choose to hide it).
    // When that happens the only stable identifier we have is `sub` — synthesize a placeholder
    // address so downstream code has something to put in the `email` column.
    const email = (payload.email as string | undefined)?.toLowerCase()
      ?? `${payload.sub}@privaterelay.appleid.com`;

    return {
      providerUid: payload.sub,
      email,
      emailVerified,
    };
  }
}
