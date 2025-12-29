import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, Matches, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RepairType {
    SCREEN = 'SCREEN',
    BATTERY = 'BATTERY',
    BACKCOVER = 'BACKCOVER',
    CHARGING_PORT = 'CHARGING_PORT',
    WATER_DAMAGE = 'WATER_DAMAGE',
    OTHER = 'OTHER',
}

export enum AppointmentStatus {
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export enum AppointmentPriority {
    NORMAL = 'NORMAL',
    URGENT = 'URGENT',
    VIP = 'VIP',
}

export class CreateAppointmentDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    customerName: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    customerEmail: string;

    @ApiProperty({ example: '+32465638106' })
    @IsString()
    customerPhone: string;

    @ApiProperty({ example: 'Apple' })
    @IsString()
    deviceBrand: string;

    @ApiProperty({ example: 'iPhone 15 Pro Max' })
    @IsString()
    deviceModel: string;

    @ApiProperty({ enum: RepairType, example: RepairType.SCREEN })
    @IsEnum(RepairType)
    repairType: RepairType;

    @ApiPropertyOptional({ example: 'Screen is cracked in the corner' })
    @IsOptional()
    @IsString()
    problemDescription?: string;

    @ApiPropertyOptional({ example: 'https://images.example.com/damage.jpg' })
    @IsOptional()
    @IsString()
    damageImageUrl?: string;

    @ApiProperty({ example: '2024-12-25' })
    @IsDateString()
    appointmentDate: string;

    @ApiProperty({ example: '10:00' })
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'timeSlot must be in HH:MM format' })
    timeSlot: string;
}

export class UpdateAppointmentDto {
    @ApiPropertyOptional({ enum: AppointmentStatus })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @ApiPropertyOptional({ enum: AppointmentPriority })
    @IsOptional()
    @IsEnum(AppointmentPriority)
    priority?: AppointmentPriority;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    adminNotes?: string;

    @ApiPropertyOptional({ example: 45, description: 'Repair duration in minutes' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(480)
    repairDuration?: number;

    @ApiPropertyOptional({ example: '2024-12-26', description: 'New appointment date for rescheduling' })
    @IsOptional()
    @IsDateString()
    appointmentDate?: string;

    @ApiPropertyOptional({ example: '14:00', description: 'New time slot for rescheduling' })
    @IsOptional()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'timeSlot must be in HH:MM format' })
    timeSlot?: string;
}

export class GetAvailableSlotsDto {
    @ApiProperty({ example: '2024-12-25' })
    @IsDateString()
    date: string;
}

