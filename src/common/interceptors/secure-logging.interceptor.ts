import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { EnvKeys } from '../constants/env-keys.constants';
import { SecurityConstants } from '../constants/security.constants';
import { NodeEnv } from '../enums/node-env.enum';

@Injectable()
export class SecureLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  // Sensitive field patterns
  private readonly SENSITIVE_FIELDS = SecurityConstants.SENSITIVE_FIELDS;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body, query } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();
    const isDevelopment = process.env[EnvKeys.NODE_ENV] !== NodeEnv.PRODUCTION;

    const sanitizedBody = this.maskSensitiveData(body);
    const sanitizedQuery = this.maskSensitiveData(query);

    if (isDevelopment) {
      this.logger.log(
        `Incoming ${method} ${url} from ${ip} - User-Agent: ${userAgent}`,
      );

      if (Object.keys(body || {}).length > 0) {
        this.logger.debug(
          `Request Body (Full): ${JSON.stringify(body, null, 2)}`,
        );
      }

      if (Object.keys(sanitizedQuery || {}).length > 0) {
        this.logger.debug(`Query Params: ${JSON.stringify(sanitizedQuery)}`);
      }
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (isDevelopment) {
            const responseTime = Date.now() - now;
            this.logger.log(
              `Completed ${method} ${url} in ${responseTime}ms [SUCCESS]`,
            );
          }
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
      return obj.map((item) => this.maskSensitiveData(item));
    }

    if (typeof obj === 'object') {
      const masked: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
    return this.SENSITIVE_FIELDS.some((sensitive) =>
      lowerField.includes(sensitive),
    );
  }
}
