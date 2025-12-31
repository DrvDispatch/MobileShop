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
    tenantId?: string | null;  // null = OWNER/platform, undefined = legacy token
    isImpersonating?: boolean;  // true if owner is impersonating a tenant user
    impersonatedBy?: string;    // owner ID who is impersonating
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
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (request) => {
                    // Also extract from cookie for cookie-based auth
                    const token = request?.cookies?.auth_token;
                    if (token) {
                        console.log('[JWT Strategy] Extracted token from cookie');
                    } else {
                        console.log('[JWT Strategy] No token in cookie, cookies:', Object.keys(request?.cookies || {}));
                    }
                    return token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: true, // Pass request to validate() for tenant verification
        });
    }

    async validate(request: any, payload: JwtPayload) {
        // Handle hardcoded super admin login (super-admin token)
        if (payload.sub === 'super-admin' && payload.role === 'ADMIN') {
            return {
                id: 'super-admin',
                email: payload.email,
                role: 'ADMIN',
                name: 'Naderi',
                isSuperAdmin: true,
                tenantId: null,  // Platform-level access
            };
        }

        // Also handle legacy admin-owner token format
        if (payload.sub === 'admin-owner' && payload.role === 'ADMIN') {
            return {
                id: 'admin-owner',
                email: payload.email,
                role: 'ADMIN',
                name: 'Admin',
                tenantId: null,  // Platform-level access
            };
        }

        // OWNER role has platform-level access (no tenant restriction)
        if (payload.role === 'OWNER') {
            const user = await this.authService.validateUser(payload.sub);
            if (!user) {
                throw new UnauthorizedException();
            }
            return {
                ...user,
                tenantId: null,  // Platform-level access
                isImpersonating: payload.isImpersonating || false,
                impersonatedBy: payload.impersonatedBy || null,
            };
        }

        const user = await this.authService.validateUser(payload.sub);
        if (!user) {
            throw new UnauthorizedException();
        }

        // CRITICAL: Validate that token's tenantId matches the request's tenantId
        // This prevents users logged into Tenant A from accessing Tenant B
        const requestTenantId = request?.tenantId;
        const tokenTenantId = payload.tenantId ?? user.tenantId;

        // Skip tenant validation if:
        // 1. Request has no tenantId (owner panel routes, etc.)
        // 2. User is impersonating (owner impersonation mode)
        if (requestTenantId && !payload.isImpersonating) {
            if (tokenTenantId !== requestTenantId) {
                console.log(`[JWT Strategy] Tenant mismatch: token=${tokenTenantId}, request=${requestTenantId}`);
                throw new UnauthorizedException('Session not valid for this tenant');
            }
        }

        // Update lastActiveAt for online status tracking (fire and forget)
        this.prisma.user.update({
            where: { id: payload.sub },
            data: { lastActiveAt: new Date() },
        }).catch(() => { }); // Silently ignore errors

        // Return user with tenantId from token (for validation purposes)
        // Include impersonation flags for audit/visibility
        return {
            ...user,
            tenantId: tokenTenantId ?? null,
            isImpersonating: payload.isImpersonating || false,
            impersonatedBy: payload.impersonatedBy || null,
        };
    }
}
