import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import {
    RegisterDto,
    LoginDto,
    AuthResponseDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    VerifyEmailDto,
    ResendVerificationDto,
    MessageResponseDto
} from './dto';
import { CurrentUser } from './decorators';
import { signOAuthState, verifyOAuthState } from './guards/google-auth.guard';
import { GoogleOAuthService } from './services/google-oauth.service';
import { TenantId } from '../tenant/tenant.decorator';
import { OwnerService } from '../owner/owner.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly googleOAuthService: GoogleOAuthService,
        private readonly jwtService: JwtService,
        private readonly ownerService: OwnerService,
    ) { }

    @Post('register')
    @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 attempts per hour
    @ApiOperation({ summary: 'Register a new customer account' })
    @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    async register(
        @TenantId() tenantId: string,
        @Body() dto: RegisterDto
    ): Promise<AuthResponseDto> {
        return this.authService.register(tenantId, dto);
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @TenantId() tenantId: string,
        @Body() dto: LoginDto
    ): Promise<AuthResponseDto> {
        return this.authService.login(tenantId, dto);
    }

    @Post('admin-login')
    @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 attempts per 15 minutes
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Admin login with username and password' })
    @ApiResponse({ status: 200, description: 'Admin login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid admin credentials' })
    async adminLogin(@Body() body: { username: string; password: string }): Promise<AuthResponseDto> {
        // Super admin login is platform-level, uses tenantId: null in token
        return this.authService.adminLogin(body.username, body.password);
    }

    @Post('owner-login')
    @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 attempts per 15 minutes
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Owner login with email and password' })
    @ApiResponse({ status: 200, description: 'Owner login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid owner credentials' })
    async ownerLogin(
        @Body() body: { email: string; password: string },
        @Res({ passthrough: true }) res: Response
    ): Promise<AuthResponseDto> {
        // Owner login is platform-level, uses tenantId: null in token
        const result = await this.authService.ownerLogin(body.email, body.password);

        // Set HttpOnly cookie for secure token storage
        res.cookie('auth_token', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return result;
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout and clear auth cookie' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('auth_token', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
        return { message: 'Logged out successfully' };
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email with token' })
    @ApiResponse({ status: 200, description: 'Email verified successfully', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async verifyEmail(@Body() dto: VerifyEmailDto): Promise<MessageResponseDto> {
        // Token lookup is global (token is globally unique)
        return this.authService.verifyEmail(dto);
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend email verification link' })
    @ApiResponse({ status: 200, description: 'Verification email sent', type: MessageResponseDto })
    async resendVerification(
        @TenantId() tenantId: string,
        @Body() dto: ResendVerificationDto
    ): Promise<MessageResponseDto> {
        return this.authService.resendVerification(tenantId, dto);
    }

    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 attempts per hour
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset email' })
    @ApiResponse({ status: 200, description: 'Password reset email sent', type: MessageResponseDto })
    async forgotPassword(
        @TenantId() tenantId: string,
        @Body() dto: ForgotPasswordDto
    ): Promise<MessageResponseDto> {
        return this.authService.forgotPassword(tenantId, dto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({ status: 200, description: 'Password reset successfully', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
        // Token lookup is global (token is globally unique)
        return this.authService.resetPassword(dto);
    }

    @Get('google')
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    async googleAuth(
        @Query('tenant') tenant: string,
        @Query('returnUrl') returnUrl: string = '/',
        @Res() res: Response
    ) {
        // Get tenant domain
        const tenantDomain = (tenant || '').split(':')[0].toLowerCase();

        // Build absolute return URL
        const isLocalhost = tenantDomain.includes('localhost');
        const protocol = isLocalhost ? 'http' : 'https';
        const absoluteReturnUrl = returnUrl.startsWith('http')
            ? returnUrl
            : `${protocol}://${tenantDomain}${returnUrl}`;

        // Create simple state token (server-side storage)
        const state = this.googleOAuthService.createOAuthState(tenantDomain, absoluteReturnUrl);

        // Generate auth URL manually (NOT using google-auth-library)
        const authUrl = this.googleOAuthService.generateAuthUrl(state);

        // Log FULL URL for debugging
        console.log('[OAuth] FULL Auth URL:', authUrl);
        console.log('[OAuth] State:', state);

        // Redirect to Google
        res.redirect(authUrl);
    }

    @Get('google/callback')
    @ApiOperation({ summary: 'Handle Google OAuth callback' })
    async googleAuthCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Res() res: Response
    ) {
        try {
            // Get state data from server-side storage
            const stateData = this.googleOAuthService.getStateData(state);
            if (!stateData) {
                console.warn('OAuth callback: Invalid or expired state:', state);
                const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
                return res.redirect(`${frontendUrl}/auth/error?message=invalid_state`);
            }

            const { tenantDomain, returnUrl } = stateData;
            console.log('[OAuth] Callback for tenant:', tenantDomain);

            // Exchange code for user info using google-auth-library
            const googleUser = await this.googleOAuthService.handleCallback(code);

            // Lookup tenant by domain
            const tenant = await this.authService.findTenantByDomain(tenantDomain);
            if (!tenant) {
                console.warn('OAuth callback: No tenant found for domain:', tenantDomain);
                const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
                return res.redirect(`${frontendUrl}/auth/error?message=tenant_not_found`);
            }

            // Create/find user
            const userResult = await this.authService.googleLogin(tenant.id, googleUser);

            // Generate one-time handoff code (valid for 60 seconds)
            const handoffCode = await this.authService.createHandoffCode(
                userResult.user.id,
                tenant.id,
                returnUrl,
            );
            console.log(`[OAuth] Created handoff code: ${handoffCode.substring(0, 8)}... for user ${userResult.user.email} in tenant ${tenant.id}`);

            // Redirect to tenant domain with one-time code
            const isLocalhost = tenantDomain.includes('localhost');
            const protocol = isLocalhost ? 'http' : 'https';
            const redirectUrl = `${protocol}://${tenantDomain}/auth/callback?code=${handoffCode}`;

            console.log('[OAuth] Redirecting to tenant:', redirectUrl);
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('[OAuth] Callback error:', error);
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/auth/error?message=oauth_failed`);
        }
    }

    @Post('exchange')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Exchange one-time OAuth handoff code for auth cookie' })
    @ApiResponse({ status: 200, description: 'Successfully exchanged code for session' })
    @ApiResponse({ status: 400, description: 'Invalid or expired code' })
    async exchangeHandoffCode(
        @TenantId() tenantId: string,
        @Body() body: { code: string },
        @Res({ passthrough: true }) res: Response
    ) {
        console.log(`[OAuth Exchange] Received code: ${body.code?.substring(0, 8)}... for tenant: ${tenantId}`);

        // Validate and consume the handoff code
        const result = await this.authService.exchangeHandoffCode(body.code, tenantId);

        if (!result) {
            console.log(`[OAuth Exchange] Failed - code invalid or expired`);
            throw new UnauthorizedException('Invalid or expired authentication code');
        }

        // Set HttpOnly cookie with correct settings
        // - secure: true because we're behind Cloudflare tunnel (HTTPS)
        // - sameSite: 'lax' allows same-site navigation
        // - path: '/' ensures cookie is sent for all requests
        res.cookie('auth_token', result.accessToken, {
            httpOnly: true,
            secure: true,  // Always secure since we use HTTPS via tunnel
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        console.log(`[OAuth Exchange] SUCCESS - Cookie set for user ${result.user.email}`);

        return {
            success: true,
            returnPath: result.returnPath,
            user: result.user,
        };
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current authenticated user' })
    @ApiResponse({ status: 200, description: 'Current user data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async me(@CurrentUser() user: any) {
        return user;
    }

    // ===== IMPERSONATION EXCHANGE =====

    @Post('impersonate/exchange')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Exchange impersonation handoff code for session' })
    @ApiResponse({ status: 200, description: 'Session established' })
    @ApiResponse({ status: 401, description: 'Invalid or expired code' })
    async exchangeImpersonationCode(
        @Body() body: { code: string },
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @TenantId() tenantId: string
    ) {
        // Get handoff data (one-time use, validates expiry)
        const handoffData = this.ownerService.getImpersonationHandoff(body.code);

        if (!handoffData) {
            throw new UnauthorizedException('Invalid or expired impersonation code');
        }

        // Verify tenant matches (prevent cross-tenant impersonation)
        if (handoffData.tenantId !== tenantId) {
            throw new UnauthorizedException('Impersonation code not valid for this tenant');
        }

        // Generate JWT with impersonation flags
        const payload = {
            sub: handoffData.userId,
            email: handoffData.userEmail,
            role: handoffData.userRole,
            tenantId: handoffData.tenantId,
            isImpersonating: true,
            impersonatedBy: handoffData.ownerId,
        };

        const accessToken = this.jwtService.sign(payload);

        // Set HttpOnly cookie (same-origin)
        res.cookie('auth_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        console.log(`[Impersonation] Session established for ${handoffData.userEmail} by owner ${handoffData.ownerId}`);

        return {
            success: true,
            user: {
                id: handoffData.userId,
                email: handoffData.userEmail,
                name: handoffData.userName,
                role: handoffData.userRole,
            },
            isImpersonating: true,
        };
    }
}
