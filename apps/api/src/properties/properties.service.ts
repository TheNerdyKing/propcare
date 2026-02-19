import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertiesService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.property.findMany({
            where: { tenantId },
            include: {
                _count: { select: { units: true, tickets: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const property = await this.prisma.property.findFirst({
            where: { id, tenantId },
            include: {
                units: true,
            },
        });

        if (!property) {
            throw new NotFoundException('Property not found');
        }

        return property;
    }

    async create(tenantId: string, data: any) {
        return this.prisma.property.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async update(tenantId: string, id: string, data: any) {
        return this.prisma.property.update({
            where: { id, tenantId },
            data,
        });
    }

    async remove(tenantId: string, id: string) {
        // Check for existing tickets or dependencies
        const tickets = await this.prisma.ticket.count({ where: { propertyId: id } });
        if (tickets > 0) {
            throw new BadRequestException('Cannot delete property with existing tickets');
        }

        await this.prisma.unit.deleteMany({ where: { propertyId: id } });

        return this.prisma.property.delete({
            where: { id, tenantId },
        });
    }

    async importFromCsv(tenantId: string, csvData: string) {
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) throw new BadRequestException('Empty or invalid CSV');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const propertyData: any = { tenantId };

            headers.forEach((header, idx) => {
                if (header === 'name') propertyData.name = values[idx];
                if (header === 'address' || header === 'addressline1') propertyData.addressLine1 = values[idx];
                if (header === 'zip') propertyData.zip = values[idx];
                if (header === 'city') propertyData.city = values[idx];
            });

            if (propertyData.name && propertyData.addressLine1) {
                const prop = await this.prisma.property.create({ data: propertyData });
                results.push(prop);
            }
        }

        return {
            count: results.length,
            properties: results,
        };
    }
}
