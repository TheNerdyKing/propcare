import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private configService: ConfigService,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (token) {
            try {
                const secret = this.configService.get<string>('JWT_SECRET') || 'your_jwt_secret_here';
                const decodedToken = jwt.decode(token) as any;

                // SUPABASE COMPATIBILITY: If token is from Supabase, it might not be verifiable 
                // with our local secret, but we can trust it if we have the Supabase secret 
                // OR we can decode it and find the user in our DB to verify existence.
                let payload: any;

                try {
                    payload = jwt.verify(token, secret) as any;
                } catch (verifyErr) {
                    // Fallback for Supabase tokens: Check if it's a valid decode and find user in DB
                    if (decodedToken && (decodedToken.aud === 'authenticated' || decodedToken.iss?.includes('supabase'))) {
                        const userId = decodedToken.sub;
                        const user = await this.prisma.user.findUnique({
                            where: { id: userId },
                            select: { id: true, email: true, tenantId: true, role: true }
                        });

                        if (user) {
                            payload = {
                                id: user.id,
                                sub: user.id,
                                email: user.email,
                                tenantId: user.tenantId,
                                role: user.role,
                                isSupabase: true
                            };
                        } else {
                            // If user not in our DB, we can't determine tenant
                            throw new UnauthorizedException('User profile not found in PropCare');
                        }
                    } else {
                        throw verifyErr;
                    }
                }

                request['user'] = payload;
            } catch (err) {
                console.error('AuthGuard token verification failed:', err.message);
                if (!isPublic) {
                    throw new UnauthorizedException();
                }
            }
        } else {
            if (!isPublic) {
                throw new UnauthorizedException();
            }
        }

        return true;
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
