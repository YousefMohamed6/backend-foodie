import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-apple';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID') || '',
      teamID: configService.get<string>('APPLE_TEAM_ID') || '',
      keyID: configService.get<string>('APPLE_KEY_ID') || '',
      privateKeyString: configService.get<string>('APPLE_PRIVATE_KEY') || '',
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL') || '/auth/apple/callback',
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      email: string;
      name?: { givenName?: string; familyName?: string };
      id: string;
    },
    done: VerifyCallback,
  ): Promise<void> {
    const user = {
      email: profile.email,
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      sub: profile.id,
      accessToken,
      provider: 'apple',
    };
    done(null, user);
  }
}

