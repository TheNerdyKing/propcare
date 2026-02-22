import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { MailsModule } from '../mails/mails.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { PublicModule } from '../public/public.module';

@Module({
    imports: [
        PrismaModule,
        MailsModule,
        PublicModule,
        BullModule.registerQueue({
            name: 'ai-processing',
        }),
    ],
    controllers: [TicketsController],
    providers: [TicketsService],
    exports: [TicketsService],
})
export class TicketsModule { }
