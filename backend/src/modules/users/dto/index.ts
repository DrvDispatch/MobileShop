import { IsOptional, IsString, IsEnum, IsEmail } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    isActive?: boolean;
}

export class AdminResetPasswordDto {
    @IsString()
    newPassword: string;
}

export class CreateAdminDto {
    @IsString()
    username: string;

    @IsString()
    password: string;

    @IsString()
    name: string;

    @IsEnum(UserRole)
    role: UserRole;
}
