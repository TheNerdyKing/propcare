import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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
