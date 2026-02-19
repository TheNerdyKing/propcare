import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async validateUser(email: string, pass: string) {
        const user = await this.prisma.user.findFirst({
            where: { email },
        });

        if (user && await bcrypt.compare(pass, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role
        };

        const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret';

        return {
            accessToken: jwt.sign(payload, secret, { expiresIn: '1h' }),
            refreshToken: jwt.sign(payload, refreshSecret, { expiresIn: '7d' }),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
            },
        };
    }
    async register(tenantName: string, name: string, email: string, pass: string) {
        const passwordHash = await bcrypt.hash(pass, 10);

        return this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: { name: tenantName },
            });

            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email,
                    name,
                    passwordHash,
                    role: 'ADMIN',
                },
            });

            return this.login(user);
        });
    }
}
