import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
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
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleUser } from './strategies/google.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    @Post('register')
    @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 attempts per hour
    @ApiOperation({ summary: 'Register a new customer account' })
    @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(dto);
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @Post('admin-login')
    @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 attempts per 15 minutes
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Admin login with username and password' })
    @ApiResponse({ status: 200, description: 'Admin login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid admin credentials' })
    async adminLogin(@Body() body: { username: string; password: string }): Promise<AuthResponseDto> {
        return this.authService.adminLogin(body.username, body.password);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email with token' })
    @ApiResponse({ status: 200, description: 'Email verified successfully', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async verifyEmail(@Body() dto: VerifyEmailDto): Promise<MessageResponseDto> {
        return this.authService.verifyEmail(dto);
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend email verification link' })
    @ApiResponse({ status: 200, description: 'Verification email sent', type: MessageResponseDto })
    async resendVerification(@Body() dto: ResendVerificationDto): Promise<MessageResponseDto> {
        return this.authService.resendVerification(dto);
    }

    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 attempts per hour
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset email' })
    @ApiResponse({ status: 200, description: 'Password reset email sent', type: MessageResponseDto })
    async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<MessageResponseDto> {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({ status: 200, description: 'Password reset successfully', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
        return this.authService.resetPassword(dto);
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Handle Google OAuth callback' })
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        const googleUser = req.user as GoogleUser;
        const result = await this.authService.googleLogin(googleUser);

        // Redirect to frontend with token
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
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
}
