import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SecureLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    // Sensitive field patterns
    private readonly SENSITIVE_FIELDS = [
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

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, ip, body, query } = request;
        const userAgent = request.get('user-agent') || '';
        const now = Date.now();

        // Sanitize and log request
        const sanitizedBody = this.maskSensitiveData(body);
        const sanitizedQuery = this.maskSensitiveData(query);

        this.logger.log(
            `Incoming ${method} ${url} from ${ip} - User-Agent: ${userAgent}`,
        );

        if (Object.keys(sanitizedBody || {}).length > 0) {
            this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
        }

        if (Object.keys(sanitizedQuery || {}).length > 0) {
            this.logger.debug(`Query Params: ${JSON.stringify(sanitizedQuery)}`);
        }

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const responseTime = Date.now() - now;
                    this.logger.log(
                        `Completed ${method} ${url} in ${responseTime}ms [SUCCESS]`,
                    );
                },
                error: (error) => {
                    const responseTime = Date.now() - now;
                    const safeError = this.maskSensitiveData(error);
                    this.logger.error(
                        `Failed ${method} ${url} in ${responseTime}ms [ERROR]: ${safeError?.message || 'Unknown error'}`,
                    );
                },
            }),
        );
    }

    /**
     * Recursively mask sensitive data in objects
     */
    private maskSensitiveData(obj: any): any {
        if (!obj) return obj;

        if (typeof obj === 'string') {
            // Don't mask strings directly, only in object fields
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.maskSensitiveData(item));
        }

        if (typeof obj === 'object') {
            const masked: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (this.isSensitiveField(key)) {
                        masked[key] = '***REDACTED***';
                    } else if (typeof obj[key] === 'object') {
                        masked[key] = this.maskSensitiveData(obj[key]);
                    } else {
                        masked[key] = obj[key];
                    }
                }
            }
            return masked;
        }

        return obj;
    }

    /**
     * Check if field name indicates sensitive data
     */
    private isSensitiveField(fieldName: string): boolean {
        const lowerField = fieldName.toLowerCase();
        return this.SENSITIVE_FIELDS.some(sensitive =>
            lowerField.includes(sensitive),
        );
    }
}
