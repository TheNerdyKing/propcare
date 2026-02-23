import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { AiProcessor } from './ai.processor';
import { AiController } from './ai.controller';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'ai-processing',
        }),
    ],
    controllers: [AiController],
    providers: [AiService, AiProcessor],
    exports: [AiService],
})
export class AiModule { }
