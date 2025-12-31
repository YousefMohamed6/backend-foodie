import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../../shared/services/redis.service';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private redisService: RedisService,
  ) {
    const secret = configService.get<string>('app.jwtSecret');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'temporary_fallback_secret',
    });
  }

  async validate(payload: JwtPayload) {
    const cacheKey = `user:${payload.sub}`;

    // Try to get user from cache first
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // Cache miss - fetch from database
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Cache user data with TTL matching JWT expiration (15 minutes default)
    const ttl = 15 * 60; // 15 minutes in seconds
    await this.redisService.set(cacheKey, JSON.stringify(user), ttl);

    return user;
  }
}
