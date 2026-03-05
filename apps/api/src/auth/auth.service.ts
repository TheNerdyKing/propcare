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
            const { passwordHash, setupSecret, ...result } = user;
            return result;
        }
        return null;
    }

    async verifySetupSecret(secret: string) {
        // Special Case: Master Secret for Platform Initial Setup
        if (secret === 'KREATIVEROCKET2026') {
            const existingSuper = await this.prisma.user.findFirst({
                where: { role: 'SUPER_ADMIN' }
            });

            if (!existingSuper) {
                // Auto-create global tenant and super admin
                const tempEmail = 'admin@propcare.internal';
                const tempPass = `Root_${Math.random().toString(36).slice(-8)}!`;

                await this.register('PropCare Global', 'Initial Admin', tempEmail, tempPass, 'SUPER_ADMIN');

                // Set the initial setup secret to something so it can't be used again easily as a setup secret
                await this.prisma.user.update({
                    where: { email: tempEmail },
                    data: { setupSecret: 'INITIAL_CLAIMED' }
                });

                return { email: tempEmail, tempPass, role: 'SUPER_ADMIN' };
            }
        }

        const user = await this.prisma.user.findFirst({
            where: { setupSecret: secret, passwordResetRequired: true },
        });

        if (!user) return null;

        // Generate a fresh random temporary password
        const tempPass = `Tmp_${Math.random().toString(36).slice(-8)}!`;
        const hashedPass = await bcrypt.hash(tempPass, 10);

        // Update user's password to this temporary one
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPass }
        });

        return { email: user.email, tempPass, role: user.role };
    }

    async login(user: any) {
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            resetRequired: user.passwordResetRequired
        };

        const secret = this.configService.get<string>('JWT_SECRET') || 'your_jwt_secret_here';
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'your_refresh_secret_here';

        return {
            accessToken: jwt.sign(payload, secret, { expiresIn: '1h' }),
            refreshToken: jwt.sign(payload, refreshSecret, { expiresIn: '7d' }),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
                resetRequired: user.passwordResetRequired
            },
        };
    }
    async register(tenantName: string, name: string, email: string, pass: string, role: string = 'ADMIN') {
        try {
            console.log(`Starting registration for: ${email} (${tenantName}) as ${role}`);
            const passwordHash = await bcrypt.hash(pass, 10);

            return await this.prisma.$transaction(async (tx) => {
                console.log('Creating tenant...');
                const tenant = await tx.tenant.create({
                    data: {
                        name: tenantName,
                        subscriptionStatus: 'TRIAL',
                        subscriptionPlan: 'FREE'
                    },
                });
                console.log('Tenant created:', tenant.id);

                console.log('Creating admin user...');
                const user = await tx.user.create({
                    data: {
                        tenantId: tenant.id,
                        email,
                        name,
                        passwordHash,
                        role: role as any,
                        passwordResetRequired: true // Force first-time change
                    },
                });
                console.log('User created:', user.id);

                return this.login(user);
            });
        } catch (error) {
            console.error('Registration service error:', error);
            throw error;
        }
    }

    async updatePassword(userId: string, newPass: string) {
        const passwordHash = await bcrypt.hash(newPass, 10);
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                passwordResetRequired: false
            }
        });
    }
}
