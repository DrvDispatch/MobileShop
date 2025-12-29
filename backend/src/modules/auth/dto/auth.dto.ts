import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/client.js';

export class RegisterDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @MinLength(2)
    name: string;

    @ApiProperty({ example: 'securePassword123', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    phone?: string;
}

export class LoginDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'securePassword123' })
    @IsString()
    password: string;
}

export class AuthResponseDto {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        emailVerified: boolean;
        avatar?: string;
    };
}

export class CreateUserDto extends RegisterDto {
    @ApiPropertyOptional({ enum: UserRole, default: UserRole.CUSTOMER })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'Reset token from email' })
    @IsString()
    token: string;

    @ApiProperty({ example: 'newSecurePassword123', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;
}

export class VerifyEmailDto {
    @ApiProperty({ description: 'Verification token from email' })
    @IsString()
    token: string;
}

export class ResendVerificationDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;
}

export class MessageResponseDto {
    @ApiProperty()
    message: string;

    @ApiProperty()
    success: boolean;
}
