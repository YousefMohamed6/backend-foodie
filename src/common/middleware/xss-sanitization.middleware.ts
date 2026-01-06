import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class XssSanitizationMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        if (req.body && typeof req.body === 'object') {
            const sanitizedBody = this.sanitizeObject(req.body);
            Object.keys(req.body).forEach(key => {
                req.body[key] = sanitizedBody[key];
            });
        }

        if (req.query && typeof req.query === 'object') {
            const sanitizedQuery = this.sanitizeObject(req.query);
            Object.keys(req.query).forEach(key => {
                (req.query as any)[key] = sanitizedQuery[key];
            });
        }

        if (req.params && typeof req.params === 'object') {
            const sanitizedParams = this.sanitizeObject(req.params);
            Object.keys(req.params).forEach(key => {
                (req.params as any)[key] = sanitizedParams[key];
            });
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
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    sanitized[key] = this.sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }

        return obj;
    }

    private sanitizeString(str: string): string {
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
