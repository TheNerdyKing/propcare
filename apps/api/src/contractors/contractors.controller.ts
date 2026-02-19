import { Controller, Get, Post, Patch, Delete, Param, Body, Request } from '@nestjs/common';
import { ContractorsService } from './contractors.service';

@Controller('contractors')
export class ContractorsController {
    constructor(private contractorsService: ContractorsService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.contractorsService.findAll(req.user.tenantId);
    }

    @Get(':id')
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.contractorsService.findOne(req.user.tenantId, id);
    }

    @Post()
    async create(@Request() req: any, @Body() data: any) {
        return this.contractorsService.create(req.user.tenantId, data);
    }

    @Patch(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.contractorsService.update(req.user.tenantId, id, data);
    }

    @Delete(':id')
    async remove(@Request() req: any, @Param('id') id: string) {
        return this.contractorsService.remove(req.user.tenantId, id);
    }
}
