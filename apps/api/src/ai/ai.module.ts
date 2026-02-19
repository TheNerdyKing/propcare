import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { AiProcessor } from './ai.processor';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'ai-processing',
        }),
    ],
    providers: [AiService, AiProcessor],
    exports: [AiService],
})
export class AiModule { }
