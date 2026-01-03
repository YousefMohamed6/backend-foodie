import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';

interface AppleTokenPayload {
  email: string;
  email_verified: boolean;
  sub: string; // Apple user ID (unique and stable)
  is_private_email?: boolean;
}

@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);
  private appleClientId: string;

  constructor(private configService: ConfigService) {
    this.appleClientId =
      this.configService.get<string>('APPLE_CLIENT_ID') || '';

    if (!this.appleClientId) {
      this.logger.warn(
        'APPLE_CLIENT_ID not configured. Apple Sign-In will not work.',
      );
    }
  }

  /**
   * Verifies an Apple identity token (JWT) and returns the verified payload
   * Apple tokens are JWTs signed by Apple's private keys
   * This method fetches Apple's public keys and validates the signature
   */
  async verifyIdentityToken(identityToken: string): Promise<AppleTokenPayload> {
    try {
      // Verify the token signature against Apple's public keys
      const payload = await appleSignin.verifyIdToken(identityToken, {
        audience: this.appleClientId,
        // Optional: You can specify nonce if you use it in the client
        // nonce: 'nonce_from_client',
        // Ignore expired tokens in development (remove in production)
        ignoreExpiration: false,
      });

      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException(
          'Invalid Apple token: missing required fields',
        );
      }

      this.logger.log(
        `Successfully verified Apple token for user: ${payload.email}`,
      );

      return {
        email: payload.email,
        email_verified:
          payload.email_verified === 'true' || payload.email_verified === true,
        sub: payload.sub,
        is_private_email:
          payload.is_private_email === 'true' ||
          payload.is_private_email === true,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Apple token verification failed: ${(error as Error).message}`,
      );
      throw new UnauthorizedException('Invalid Apple identity token');
    }
  }

  /**
   * Important note about Apple Sign-In:
   *
   * Apple only provides the user's name and email in the authorization response
   * on the FIRST sign-in. On subsequent sign-ins, only the identityToken is provided.
   *
   * The identityToken always contains:
   * - sub (unique user identifier)
   * - email (even if it's a private relay email)
   *
   * But it does NOT contain:
   * - firstName
   * - lastName
   *
   * Solution: Store the user's name in your database on first login.
   * For subsequent logins, rely on the email/sub from the token.
   */
}
