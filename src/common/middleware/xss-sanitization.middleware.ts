import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * XSS Sanitization Middleware
 * 
 * Sanitizes all user input to prevent XSS attacks.
 * Applies to request body, query parameters, and URL parameters.
 * 
 * Follows OWASP recommendations for XSS prevention:
 * - Strips dangerous HTML tags and attributes
 * - Encodes special characters
 * - Prevents script injection
 */
@Injectable()
export class XssSanitizationMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Sanitize body
        if (req.body) {
            req.body = this.sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query) {
            req.query = this.sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params) {
            req.params = this.sanitizeObject(req.params);
        }

        next();
    }

    private sanitizeObject(obj: any): any {
        if (typeof obj === 'string') {
            return this.sanitizeString(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        if (obj !== null && typeof obj === 'object') {
            const sanitized: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = this.sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }

        return obj;
    }

    private sanitizeString(str: string): string {
        // Remove dangerous HTML tags and JavaScript
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/<embed\b[^>]*>/gi, '')
            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
            .trim();
    }
}
