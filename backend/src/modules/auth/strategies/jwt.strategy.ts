import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
        private readonly prisma: PrismaService,
    ) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: JwtPayload) {
        // Handle hardcoded super admin login (super-admin token)
        if (payload.sub === 'super-admin' && payload.role === 'ADMIN') {
            return {
                id: 'super-admin',
                email: payload.email,
                role: 'ADMIN',
                name: 'Naderi',
                isSuperAdmin: true,
            };
        }

        // Also handle legacy admin-owner token format
        if (payload.sub === 'admin-owner' && payload.role === 'ADMIN') {
            return {
                id: 'admin-owner',
                email: payload.email,
                role: 'ADMIN',
                name: 'Admin',
            };
        }

        const user = await this.authService.validateUser(payload.sub);
        if (!user) {
            throw new UnauthorizedException();
        }

        // Update lastActiveAt for online status tracking (fire and forget)
        this.prisma.user.update({
            where: { id: payload.sub },
            data: { lastActiveAt: new Date() },
        }).catch(() => { }); // Silently ignore errors

        return user;
    }
}
