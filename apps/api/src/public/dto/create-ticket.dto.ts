import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { TicketType, Urgency } from '@prisma/client';

export class CreateTicketDto {
    @IsEnum(TicketType)
    @IsOptional()
    type?: TicketType;

    @IsUUID()
    @IsOptional()
    propertyId?: string;

    @IsString()
    @IsOptional()
    unitLabel?: string;

    @IsEnum(Urgency)
    @IsOptional()
    urgency: Urgency = Urgency.NORMAL;

    @IsString()
    description!: string;

    @IsString()
    tenantName!: string;

    @IsEmail()
    tenantEmail!: string;

    @IsString()
    @IsOptional()
    tenantPhone?: string;

    @IsBoolean()
    @IsOptional()
    permissionToEnter: boolean = false;
}
