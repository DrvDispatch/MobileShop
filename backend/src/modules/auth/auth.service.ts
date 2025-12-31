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
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
    ) { }

    /**
     * Get tenant domain URL and shop name for email links
     */
    private async getTenantEmailInfo(tenantId: string): Promise<{ domainUrl: string; shopName: string }> {
        try {
            const domainUrl = await this.tenantService.getFullDomainUrl(tenantId);
            const config = await this.tenantService.getPublicConfig(tenantId);
            return {
                domainUrl,
                shopName: config?.branding?.shopName || 'SmartphoneService',
            };
        } catch (error) {
            this.logger.warn(`Failed to get tenant info for ${tenantId}, using defaults`);
            return {
                domainUrl: this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
                shopName: 'SmartphoneService',
            };
        }
    }

    /**
     * Find tenant by domain (for OAuth callback)
     */
    async findTenantByDomain(domain: string): Promise<{ id: string } | null> {
        const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

        const tenantDomain = await this.prisma.tenantDomain.findFirst({
            where: { domain: normalizedDomain },
            include: { tenant: { select: { id: true, status: true } } },
        });

        if (!tenantDomain || tenantDomain.tenant.status !== 'ACTIVE') {
            return null;
        }

        return { id: tenantDomain.tenant.id };
    }

    async register(tenantId: string, dto: RegisterDto): Promise<AuthResponseDto> {
        // Check if user exists within this tenant
        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.email, tenantId },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Generate verification token
        const emailVerifyToken = randomBytes(32).toString('hex');

        // Create user with tenantId
        const user = await this.prisma.user.create({
            data: {
                tenantId,
                email: dto.email,
                name: dto.name,
                passwordHash,
                phone: dto.phone,
                role: UserRole.CUSTOMER,
                emailVerifyToken,
            },
        });

        // Send verification email with tenant domain
        const tenantInfo = await this.getTenantEmailInfo(tenantId);
        await this.emailService.sendVerificationEmail(
            user.email,
            emailVerifyToken,
            user.name,
            tenantInfo.domainUrl,
            tenantInfo.shopName
        );

        // Generate token with tenantId
        const accessToken = this.generateToken(user.id, user.email, user.role, tenantId);

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

    async login(tenantId: string, dto: LoginDto): Promise<AuthResponseDto> {
        // Find user within this tenant
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email, tenantId },
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

        // Generate token with tenantId
        const accessToken = this.generateToken(user.id, user.email, user.role, tenantId);

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
        // tenantId = null indicates platform-level (OWNER) access
        const adminPayload = {
            sub: 'super-admin',
            email: 'admin@smartphoneservice.be',
            role: UserRole.ADMIN,
            isSuperAdmin: true,
            tenantId: null,  // Platform-level access
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

    async ownerLogin(email: string, password: string): Promise<AuthResponseDto> {
        // Find OWNER user (tenantId should be null for platform owners)
        const user = await this.prisma.user.findFirst({
            where: {
                email,
                role: UserRole.OWNER,
                tenantId: null  // Platform-level owners have no tenant
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid owner credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        if (!user.passwordHash) {
            throw new UnauthorizedException('Invalid owner credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid owner credentials');
        }

        // Generate token with tenantId = null for platform-level access
        const accessToken = this.generateToken(user.id, user.email, user.role, null);

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

    async resendVerification(tenantId: string, dto: ResendVerificationDto): Promise<MessageResponseDto> {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email, tenantId },
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

        // Send verification email with tenant domain
        const tenantInfo = await this.getTenantEmailInfo(tenantId);
        await this.emailService.sendVerificationEmail(
            user.email,
            emailVerifyToken,
            user.name,
            tenantInfo.domainUrl,
            tenantInfo.shopName
        );

        return {
            message: 'If an account exists with this email, a verification link has been sent',
            success: true,
        };
    }

    async forgotPassword(tenantId: string, dto: ForgotPasswordDto): Promise<MessageResponseDto> {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email, tenantId },
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

        // Send password reset email with tenant domain
        const tenantInfo = await this.getTenantEmailInfo(tenantId);
        await this.emailService.sendPasswordResetEmail(
            user.email,
            resetToken,
            user.name,
            tenantInfo.domainUrl,
            tenantInfo.shopName
        );

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

    async googleLogin(tenantId: string, googleUser: GoogleUser): Promise<AuthResponseDto> {
        // Check if user exists with this Google ID within tenant
        let user = await this.prisma.user.findFirst({
            where: { googleId: googleUser.googleId, tenantId },
        });

        if (!user) {
            // Check if user exists with this email within tenant
            user = await this.prisma.user.findFirst({
                where: { email: googleUser.email, tenantId },
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
                // Create new user with tenantId
                user = await this.prisma.user.create({
                    data: {
                        tenantId,
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

        // Generate token with tenantId
        const accessToken = this.generateToken(user.id, user.email, user.role, tenantId);

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
                tenantId: true,
            },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return user;
    }

    /**
     * Create a one-time handoff code for OAuth cross-domain auth
     * TTL: 60 seconds, single use only
     */
    async createHandoffCode(userId: string, tenantId: string, returnPath: string): Promise<string> {
        // Generate cryptographically secure random code
        const code = randomBytes(32).toString('base64url');

        // Clean up expired codes periodically
        await this.prisma.oAuthHandoffCode.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });

        // Create the handoff code
        await this.prisma.oAuthHandoffCode.create({
            data: {
                code,
                userId,
                tenantId,
                returnPath,
                expiresAt: new Date(Date.now() + 60 * 1000), // 60 seconds
            },
        });

        return code;
    }

    /**
     * Exchange a handoff code for an auth token
     * Validates: code exists, not expired, not used, belongs to correct tenant
     */
    async exchangeHandoffCode(code: string, tenantId: string): Promise<{
        accessToken: string;
        returnPath: string;
        user: { id: string; email: string; name: string };
    } | null> {
        // Find the handoff code
        const handoff = await this.prisma.oAuthHandoffCode.findUnique({
            where: { code },
        });

        if (!handoff) {
            this.logger.warn('Handoff code not found');
            return null;
        }

        // Check if expired
        if (handoff.expiresAt < new Date()) {
            this.logger.warn('Handoff code expired');
            await this.prisma.oAuthHandoffCode.delete({ where: { id: handoff.id } });
            return null;
        }

        // Check if already used
        if (handoff.usedAt) {
            this.logger.warn('Handoff code already used - potential replay attack');
            return null;
        }

        // Check if tenant matches
        if (handoff.tenantId !== tenantId) {
            this.logger.warn('Handoff code tenant mismatch - potential attack');
            return null;
        }

        // Mark as used (atomic update)
        await this.prisma.oAuthHandoffCode.update({
            where: { id: handoff.id },
            data: { usedAt: new Date() },
        });

        // Get the user
        const user = await this.prisma.user.findUnique({
            where: { id: handoff.userId },
            select: { id: true, email: true, name: true, role: true },
        });

        if (!user) {
            this.logger.warn('Handoff code user not found');
            return null;
        }

        // Generate access token
        const accessToken = this.generateToken(user.id, user.email, user.role, tenantId);

        return {
            accessToken,
            returnPath: handoff.returnPath,
            user: { id: user.id, email: user.email, name: user.name },
        };
    }

    private generateToken(userId: string, email: string, role: UserRole, tenantId: string | null): string {
        const payload = { sub: userId, email, role, tenantId };
        return this.jwtService.sign(payload);
    }
}

