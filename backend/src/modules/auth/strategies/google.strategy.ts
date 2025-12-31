import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private configService: ConfigService) {
        const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL')!;

        console.log('[GoogleStrategy] Initializing with callback:', callbackURL);

        // Cast to any to allow additional options that Passport accepts
        // but TypeScript types don't include
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
            callbackURL,
            scope: ['email', 'profile'],
        } as StrategyOptions);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<void> {
        const { id, emails, displayName, photos } = profile;

        console.log('[GoogleStrategy] Validating user:', {
            googleId: id,
            email: emails?.[0]?.value
        });

        const user = {
            googleId: id,
            email: emails?.[0]?.value,
            name: displayName,
            avatar: photos?.[0]?.value,
            accessToken,
        };

        done(null, user);
    }
}

export interface GoogleUser {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
    accessToken?: string;  // Optional - not returned by GoogleOAuthService
}

