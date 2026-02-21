import { Controller, Post, Request } from '@nestjs/common';
import { PublicService } from '../public/public.service';

@Controller('admin')
export class AdminController {
    constructor(private publicService: PublicService) { }

    @Post('seed-demo-data')
    async seedDemoData(@Request() req: any) {
        console.log(`[Admin] Seeding demo data for tenant: ${req.user?.tenantId}`);
        try {
            const result = await this.publicService.seedDemoDataForTenant(req.user.tenantId);
            console.log(`[Admin] Seeding successful`);
            return result;
        } catch (error) {
            console.error(`[Admin] Seeding failed:`, error);
            throw error;
        }
    }
}
