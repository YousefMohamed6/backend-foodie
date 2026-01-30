export class SecurityConstants {
    /// Throttler Defaults
    static readonly THROTTLER_TTL_PROD = 60000; // 1 minute
    static readonly THROTTLER_LIMIT_PROD = 60;
    static readonly THROTTLER_TTL_DEV = 1000; // 1 second
    static readonly THROTTLER_LIMIT_DEV = 200;

    /// Default Ports
    static readonly DEFAULT_PORT = 3000;

    /// CORS Defaults
    static readonly DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:4200'];

    /// Sensitive Fields to Mask
    static readonly SENSITIVE_FIELDS = [
        'password',
        'token',
        'secret',
        'authorization',
        'api_key',
        'apiKey',
        'jwt',
        'refresh_token',
        'refreshToken',
        'access_token',
        'accessToken',
        'credit_card',
        'creditCard',
        'card_number',
        'cardNumber',
        'cvv',
        'ssn',
        'pin',
    ];

    /// Security Messages
    static readonly MSG_UNAUTHORIZED_SHIELD = 'Invalid security token. Access denied.';
    static readonly MSG_SHIELD_DISABLED_WARN = 'SECURE_API_KEY is not set in development. Skipping shield check.';

    /// OAuth Strategy Fallbacks
    static readonly APPLE_CLIENT_ID_FALLBACK = 'com.foodie.placeholder';
    static readonly APPLE_TEAM_ID_FALLBACK = 'P8LCE8T6XX';
    static readonly APPLE_KEY_ID_FALLBACK = 'KEY8888888';
    static readonly APPLE_PRIVATE_KEY_FALLBACK = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...';
    static readonly GOOGLE_CLIENT_ID_FALLBACK = 'google-placeholder-client-id';
    static readonly GOOGLE_CLIENT_SECRET_FALLBACK = 'google-placeholder-secret';
}
