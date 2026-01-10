import {
    Injectable,
    Logger,
    OnModuleInit,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface FirebaseDecodedToken {
    uid: string;
    phoneNumber?: string;
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
    photoURL?: string;
    signInProvider?: string;
}

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseAuthService.name);
    private firebaseApp: admin.app.App | null = null;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        const fcmConfig = this.configService.get('fcm');

        if (
            fcmConfig?.serviceAccount &&
            fcmConfig.serviceAccount.private_key &&
            fcmConfig.serviceAccount.project_id &&
            fcmConfig.serviceAccount.client_email
        ) {
            try {
                if (!admin.apps.length) {
                    this.firebaseApp = admin.initializeApp({
                        credential: admin.credential.cert(fcmConfig.serviceAccount),
                    });
                    this.logger.log('Firebase Admin SDK initialized for auth');
                } else {
                    this.firebaseApp = admin.app();
                    this.logger.log('Using existing Firebase Admin SDK instance');
                }
            } catch (error) {
                this.logger.error(
                    'Failed to initialize Firebase Admin SDK for auth:',
                    error,
                );
            }
        } else {
            this.logger.warn(
                'Firebase service account not configured. Phone auth verification will fail.',
            );
        }
    }

    async verifyIdToken(idToken: string): Promise<FirebaseDecodedToken> {
        if (!this.firebaseApp) {
            throw new UnauthorizedException('FIREBASE_NOT_CONFIGURED');
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);

            return {
                uid: decodedToken.uid,
                phoneNumber: decodedToken.phone_number,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified,
                displayName: decodedToken.name,
                photoURL: decodedToken.picture,
                signInProvider: decodedToken.firebase?.sign_in_provider,
            };
        } catch (error: any) {
            this.logger.error('Failed to verify Firebase ID token:', error.message);

            if (error.code === 'auth/id-token-expired') {
                throw new UnauthorizedException('FIREBASE_TOKEN_EXPIRED');
            }
            if (error.code === 'auth/id-token-revoked') {
                throw new UnauthorizedException('FIREBASE_TOKEN_REVOKED');
            }
            if (error.code === 'auth/argument-error') {
                throw new UnauthorizedException('FIREBASE_INVALID_TOKEN_FORMAT');
            }

            throw new UnauthorizedException('FIREBASE_INVALID_TOKEN');
        }
    }

    isConfigured(): boolean {
        return this.firebaseApp !== null;
    }
}
