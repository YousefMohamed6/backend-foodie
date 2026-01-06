import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const timeout = 30000; // 30 seconds

        const timer = setTimeout(() => {
            if (!res.headersSent) {
                res.status(503).json({
                    statusCode: 503,
                    message: 'Request timeout',
                    error: 'Service Unavailable',
                });
            }
        }, timeout);

        res.on('finish', () => clearTimeout(timer));
        res.on('close', () => clearTimeout(timer));

        next();
    }
}
