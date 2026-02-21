import { Controller, Post, Request } from '@nestjs/common';
import { PublicService } from '../public/public.service';

@Controller('admin')
export class AdminController {
    constructor(private publicService: PublicService) { }

    @Post('seed-demo-data')
    async seedDemoData(@Request() req: any) {
        // Use the tenantId from the authenticated user's token
        return this.publicService.seedDemoDataForTenant(req.user.tenantId);
    }
}
