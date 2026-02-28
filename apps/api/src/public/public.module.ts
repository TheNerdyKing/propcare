import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../prisma/prisma.module';

// import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        PrismaModule,
        AiModule,
        EmailModule,
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
