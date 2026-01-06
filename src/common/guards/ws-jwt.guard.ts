import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(private readonly jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient<Socket>();
            const token = this.extractToken(client);

            if (!token) {
                throw new WsException('UNAUTHORIZED');
            }

            const payload = await this.jwtService.verifyAsync(token);

            // Attach user to client for later use in handlers
            client.data.user = payload;

            return true;
        } catch (err) {
            this.logger.error(`WS Authentication failed: ${err.message}`);
            throw new WsException('UNAUTHORIZED');
        }
    }

    private extractToken(client: Socket): string | null {
        // Try handshake auth first
        const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
        if (authHeader) {
            return authHeader.split(' ')[1] || authHeader;
        }

        // Try query parameter as fallback
        const queryToken = client.handshake.query?.token;
        if (queryToken) {
            return Array.isArray(queryToken) ? queryToken[0] : queryToken;
        }

        return null;
    }
}
