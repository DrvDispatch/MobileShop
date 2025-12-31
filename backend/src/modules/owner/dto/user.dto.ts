import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantUserDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiProperty({ enum: ['ADMIN', 'CUSTOMER'], default: 'CUSTOMER' })
    @IsEnum(['ADMIN', 'CUSTOMER'])
    @IsOptional()
    role: 'ADMIN' | 'CUSTOMER' = 'CUSTOMER';
}

export class ResetTenantUserPasswordDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;
}
