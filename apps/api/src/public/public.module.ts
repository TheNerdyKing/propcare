import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../prisma/prisma.module';

import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({
            name: 'ai-processing',
        }),
    ],
    controllers: [PublicController],
    providers: [PublicService],
    exports: [PublicService],
})
export class PublicModule { }
