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
}
