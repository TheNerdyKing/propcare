import { IsNotEmpty, IsString } from 'class-validator';

export class VerifySetupDto {
    @IsString()
    @IsNotEmpty()
    secret: string;
}
