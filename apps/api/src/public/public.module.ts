import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../prisma/prisma.module';

import { AiModule } from '../ai/ai.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        PrismaModule,
        AiModule,
        EmailModule,
    ],
    controllers: [PublicController],
    providers: [PublicService],
    exports: [PublicService],
})
export class PublicModule { }
