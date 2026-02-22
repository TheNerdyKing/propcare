import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePropertyDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    addressLine1!: string;

    @IsString()
    @IsNotEmpty()
    zip!: string;

    @IsString()
    @IsNotEmpty()
    city!: string;
}
