import { IsString, IsNotEmpty, IsEmail, IsArray, IsOptional } from 'class-validator';

export class CreateContractorDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsEmail()
    email!: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tradeTypes?: string[];

    @IsString()
    @IsOptional()
    phone?: string;
}
