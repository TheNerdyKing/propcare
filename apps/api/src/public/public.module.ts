import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../prisma/prisma.module';

// import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [
        PrismaModule,
        AiModule,
        /*
        BullModule.registerQueue({
            name: 'ai-processing',
        }),
        */
    ],
    controllers: [PublicController],
    providers: [PublicService],
    exports: [PublicService],
})
export class PublicModule { }
