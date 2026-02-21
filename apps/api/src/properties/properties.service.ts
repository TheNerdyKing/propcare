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
        if (!data.name || !data.addressLine1 || !data.zip || !data.city) {
            throw new BadRequestException('Missing required property fields (name, address, zip, city)');
        }

        return this.prisma.property.create({
            data: {
                name: data.name,
                addressLine1: data.addressLine1,
                zip: data.zip,
                city: data.city,
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
            const propertyData: any = {
                tenantId,
                zip: '', // Default to empty string if missing
                city: '',
            };

            headers.forEach((header, idx) => {
                const val = values[idx];
                if (!val) return;

                if (header === 'name') propertyData.name = val;
                if (header === 'address' || header === 'addressline1' || header === 'street') propertyData.addressLine1 = val;
                if (header === 'zip' || header === 'postcode') propertyData.zip = val;
                if (header === 'city') propertyData.city = val;
            });

            if (propertyData.name && propertyData.addressLine1) {
                // Ensure required fields exist even if not in CSV
                if (!propertyData.zip) propertyData.zip = '0000';
                if (!propertyData.city) propertyData.city = 'Unknown';

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
