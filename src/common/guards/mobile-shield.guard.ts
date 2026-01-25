import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../constants/env-keys.constants';
import { SecurityConstants } from '../constants/security.constants';
import { NodeEnv } from '../enums/node-env.enum';

@Injectable()
export class MobileShieldGuard implements CanActivate {
    private readonly logger = new Logger(MobileShieldGuard.name);

    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const isProduction = process.env[EnvKeys.NODE_ENV] === NodeEnv.PRODUCTION;

        // In development, we can allow requests without API key for easier testing
        // but we log a warning.
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];
        const expectedApiKey = this.configService.get<string>(EnvKeys.SECURE_API_KEY);

        if (!isProduction && !expectedApiKey) {
            this.logger.warn(SecurityConstants.MSG_SHIELD_DISABLED_WARN);
            return true;
        }

        if (apiKey === expectedApiKey) {
            return true;
        }

        this.logger.error(`Unauthorized access attempt from IP: ${request.ip}. Invalid or missing X-API-Key.`);

        // Hard block in production
        throw new UnauthorizedException(SecurityConstants.MSG_UNAUTHORIZED_SHIELD);
    }
}
