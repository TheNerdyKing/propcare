import { Controller, Post, Body, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        try {
            return await this.authService.register(
                registerDto.tenantName,
                registerDto.name,
                registerDto.email,
                registerDto.password,
            );
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictException('A user with this email already exists in this tenant');
            }
            throw error;
        }
    }

    @Public()
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }
}
