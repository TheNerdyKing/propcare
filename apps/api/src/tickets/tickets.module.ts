import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { MailsModule } from '../mails/mails.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        PrismaModule,
        MailsModule,
        BullModule.registerQueue({
            name: 'ai-processing',
        }),
    ],
    controllers: [TicketsController],
    providers: [TicketsService],
    exports: [TicketsService],
})
export class TicketsModule { }
