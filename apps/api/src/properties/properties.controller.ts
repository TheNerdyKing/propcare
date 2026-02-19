import { Controller, Get, Post, Patch, Delete, Param, Body, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
    constructor(private propertiesService: PropertiesService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.propertiesService.findAll(req.user.tenantId);
    }

    @Get(':id')
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.propertiesService.findOne(req.user.tenantId, id);
    }

    @Post()
    async create(@Request() req: any, @Body() data: any) {
        return this.propertiesService.create(req.user.tenantId, data);
    }

    @Patch(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.propertiesService.update(req.user.tenantId, id, data);
    }

    @Delete(':id')
    async remove(@Request() req: any, @Param('id') id: string) {
        return this.propertiesService.remove(req.user.tenantId, id);
    }

    @Post('import')
    async import(@Request() req: any, @Body('csv') csv: string) {
        return this.propertiesService.importFromCsv(req.user.tenantId, csv);
    }
}
