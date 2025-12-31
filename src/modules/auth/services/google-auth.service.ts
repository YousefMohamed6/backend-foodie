import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

interface GoogleTokenPayload {
    email: string;
    email_verified: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    sub: string; // Google user ID
}

@Injectable()
export class GoogleAuthService {
    private readonly logger = new Logger(GoogleAuthService.name);
    private googleClient: OAuth2Client;
    private googleClientId: string;
    private googleIosClientId: string;

    constructor(private configService: ConfigService) {
        this.googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID') || '';
        this.googleIosClientId = this.configService.get<string>('GOOGLE_IOS_CLIENT_ID') || this.googleClientId;

        if (!this.googleClientId) {
            this.logger.warn('GOOGLE_CLIENT_ID not configured. Google Sign-In will not work.');
        }

        this.googleClient = new OAuth2Client();
    }

    /**
     * Verifies a Google ID token and returns the verified payload
     * This ensures the token is authentic and issued by Google
     */
    async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                // Accept both Android and iOS client IDs
                audience: [this.googleClientId, this.googleIosClientId],
            });

            const payload = ticket.getPayload();

            if (!payload) {
                throw new UnauthorizedException('Invalid Google token: no payload');
            }

            if (!payload.email_verified) {
                throw new UnauthorizedException('Google email not verified');
            }

            this.logger.log(`Successfully verified Google token for user: ${payload.email}`);

            return {
                email: payload.email!,
                email_verified: payload.email_verified,
                name: payload.name,
                given_name: payload.given_name,
                family_name: payload.family_name,
                picture: payload.picture,
                sub: payload.sub,
            };
        } catch (error: unknown) {
            this.logger.error(`Google token verification failed: ${(error as Error).message}`);
            throw new UnauthorizedException('Invalid Google ID token');
        }
    }
}
