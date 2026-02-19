import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from './ai.service';
import { Logger } from '@nestjs/common';

@Processor('ai-processing')
export class AiProcessor extends WorkerHost {
    private readonly logger = new Logger(AiProcessor.name);

    constructor(private aiService: AiService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing AI job ${job.id} for ticket ${job.data.ticketId}`);

        try {
            await this.aiService.processTicket(job.data.ticketId);
            this.logger.log(`Completed AI job ${job.id}`);
        } catch (error) {
            this.logger.error(`Failed AI job ${job.id}: ${error.message}`);
            throw error;
        }
    }
}
