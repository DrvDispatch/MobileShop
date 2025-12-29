import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma';
import { RegisterDto, LoginDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, ResendVerificationDto, MessageResponseDto } from './dto';
import { UserRole } from '../../generated/prisma/client.js';
import { EmailService } from '../email';
import { GoogleUser } from './strategies/google.strategy';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
    ) { }

    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Generate verification token
        const emailVerifyToken = randomBytes(32).toString('hex');

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
                phone: dto.phone,
                role: UserRole.CUSTOMER,
                emailVerifyToken,
            },
        });

        // Send verification email
        await this.emailService.sendVerificationEmail(user.email, emailVerifyToken, user.name);

        // Generate token
        const accessToken = this.generateToken(user.id, user.email, user.role);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                emailVerified: !!user.emailVerified,
                avatar: user.avatar || undefined,
            },
        };
    }

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        if (!user.passwordHash) {
            throw new UnauthorizedException('Please use Google to sign in');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if email is verified (security enhancement)
        if (!user.emailVerified) {
            throw new UnauthorizedException('Please verify your email before signing in. Check your inbox for a verification link.');
        }

        // Generate token
        const accessToken = this.generateToken(user.id, user.email, user.role);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                emailVerified: !!user.emailVerified,
                avatar: user.avatar || undefined,
            },
        };
    }

    // Super Admin credentials (owner)
    private readonly SUPER_ADMIN_CREDENTIALS = {
        username: 'Naderi',
        password: 'Naderi123!',
    };

    async adminLogin(username: string, password: string): Promise<AuthResponseDto> {
        // Check super admin credentials
        if (username !== this.SUPER_ADMIN_CREDENTIALS.username || password !== this.SUPER_ADMIN_CREDENTIALS.password) {
            throw new UnauthorizedException('Invalid admin credentials');
        }

        // Generate admin token with hardcoded super admin data
        const adminPayload = {
            sub: 'super-admin',
            email: 'admin@smartphoneservice.be',
            role: UserRole.ADMIN,
            isSuperAdmin: true,
        };
        const accessToken = this.jwtService.sign(adminPayload);

        return {
            accessToken,
            user: {
                id: 'super-admin',
                email: 'admin@smartphoneservice.be',
                name: 'Naderi',
                role: UserRole.ADMIN,
                emailVerified: true,
            },
        };
    }

    async verifyEmail(dto: VerifyEmailDto): Promise<MessageResponseDto> {
        const user = await this.prisma.user.findFirst({
            where: { emailVerifyToken: dto.token },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        // Mark email as verified
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                emailVerifyToken: null,
            },
        });

        // Send welcome email
        await this.emailService.sendWelcomeEmail(user.email, user.name);

        return {
            message: 'Email verified successfully',
            success: true,
        };
    }

    async resendVerification(dto: ResendVerificationDto): Promise<MessageResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            // Don't reveal if user exists
            return {
                message: 'If an account exists with this email, a verification link has been sent',
                success: true,
            };
        }

        if (user.emailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        // Generate new token
        const emailVerifyToken = randomBytes(32).toString('hex');

        await this.prisma.user.update({
            where: { id: user.id },
            data: { emailVerifyToken },
        });

        // Send verification email
        await this.emailService.sendVerificationEmail(user.email, emailVerifyToken, user.name);

        return {
            message: 'If an account exists with this email, a verification link has been sent',
            success: true,
        };
    }

    async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            // Don't reveal if user exists
            return {
                message: 'If an account exists with this email, a password reset link has been sent',
                success: true,
            };
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Send password reset email
        await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.name);

        return {
            message: 'If an account exists with this email, a password reset link has been sent',
            success: true,
        };
    }

    async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: dto.token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Update password and clear reset token
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return {
            message: 'Password reset successfully',
            success: true,
        };
    }

    async googleLogin(googleUser: GoogleUser): Promise<AuthResponseDto> {
        // Check if user exists with this Google ID
        let user = await this.prisma.user.findUnique({
            where: { googleId: googleUser.googleId },
        });

        if (!user) {
            // Check if user exists with this email
            user = await this.prisma.user.findUnique({
                where: { email: googleUser.email },
            });

            if (user) {
                // Link existing account with Google
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: googleUser.googleId,
                        avatar: user.avatar || googleUser.avatar,
                        emailVerified: user.emailVerified || new Date(),
                    },
                });
            } else {
                // Create new user
                user = await this.prisma.user.create({
                    data: {
                        email: googleUser.email,
                        name: googleUser.name,
                        googleId: googleUser.googleId,
                        avatar: googleUser.avatar,
                        role: UserRole.CUSTOMER,
                        emailVerified: new Date(),
                    },
                });

                // Send welcome email
                await this.emailService.sendWelcomeEmail(user.email, user.name);
            }
        }

        // Generate token
        const accessToken = this.generateToken(user.id, user.email, user.role);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                emailVerified: !!user.emailVerified,
                avatar: user.avatar || undefined,
            },
        };
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                emailVerified: true,
                avatar: true,
            },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return user;
    }

    private generateToken(userId: string, email: string, role: UserRole): string {
        const payload = { sub: userId, email, role };
        return this.jwtService.sign(payload);
    }
}
