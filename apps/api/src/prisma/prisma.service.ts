import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL || "postgresql://postgres:4ekoBBjE0ll3tS3I@db.dqdplijyftnfadufzsed.supabase.co:5432/postgres"
                }
            }
        });
    }

    async onModuleInit() {
        try {
            console.log('Attempting to connect to database...');
            await this.$connect();
            console.log('Successfully connected to database.');
        } catch (error) {
            console.error('Database connection failed:', error);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
