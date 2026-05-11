import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? 'missing',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? 'missing',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ??
        'http://localhost:3002/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Google account did not return an email'), undefined);
      }
      const fullName =
        profile.displayName ||
        [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
        email.split('@')[0];

      const user = await this.authService.findOrCreateGoogleUser({
        googleId: profile.id,
        email,
        fullName,
      });
      done(null, user);
    } catch (err) {
      this.logger.error('Google OAuth validation failed', err as Error);
      done(err as Error, undefined);
    }
  }
}
