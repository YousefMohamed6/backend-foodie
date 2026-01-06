/**
 * Security Headers Configuration
 * 
 * Enterprise-grade HTTP security headers following OWASP and industry best practices.
 * Inspired by Google, Uber, and other large-scale production systems.
 * 
 * Headers configured:
 * - Content-Security-Policy (CSP): Prevents XSS by controlling resource loading
 * - Strict-Transport-Security (HSTS): Forces HTTPS
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Referrer-Policy: Controls referer information
 * - Permissions-Policy: Controls browser features
 */

export const securityHeadersConfig = {
    // Content Security Policy - strictest configuration
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for AdminJS
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            mediaSrc: ["'self'", 'blob:', 'data:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },

    // HTTP Strict Transport Security - enforce HTTPS for 1 year
    strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },

    // X-Frame-Options - prevent clickjacking
    frameguard: {
        action: 'deny' as const,
    },

    // X-Content-Type-Options - prevent MIME sniffing
    noSniff: true,

    // X-Download-Options - IE8+ specific
    ieNoOpen: true,

    // X-DNS-Prefetch-Control
    dnsPrefetchControl: {
        allow: false,
    },

    // Referrer-Policy - control referer information
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin' as const,
    },

    // Permissions-Policy (formerly Feature-Policy)
    permissionsPolicy: {
        features: {
            camera: ["'none'"],
            microphone: ["'none'"],
            geolocation: ["'self'"],
            payment: ["'self'"],
            usb: ["'none'"],
            magnetometer: ["'none'"],
            gyroscope: ["'none'"],
        },
    },

    // Cross-Origin policies
    crossOriginEmbedderPolicy: false, // Set to true if needed
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' as const },
    crossOriginResourcePolicy: { policy: 'same-site' as const },

    // Hide X-Powered-By header
    hidePoweredBy: true,
} as const;
