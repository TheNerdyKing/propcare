import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContractorsService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.contractor.findMany({
            where: { tenantId },
            include: {
                properties: {
                    include: { property: { select: { name: true } } },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const contractor = await this.prisma.contractor.findFirst({
            where: { id, tenantId },
            include: {
                properties: {
                    include: { property: { select: { name: true } } },
                },
            },
        });

        if (!contractor) {
            throw new NotFoundException('Contractor not found');
        }

        return contractor;
    }

    async create(tenantId: string, data: any) {
        const { propertyIds, ...contractorData } = data;

        return this.prisma.contractor.create({
            data: {
                ...contractorData,
                tenantId,
                properties: {
                    create: propertyIds?.map((propertyId: string) => ({
                        tenantId,
                        propertyId,
                    })) || [],
                },
            },
        });
    }

    async update(tenantId: string, id: string, data: any) {
        const { propertyIds, ...contractorData } = data;

        // Delete existing mappings if propertyIds is provided
        if (propertyIds) {
            await this.prisma.contractorProperty.deleteMany({
                where: { contractorId: id, tenantId },
            });
        }

        return this.prisma.contractor.update({
            where: { id, tenantId },
            data: {
                ...contractorData,
                properties: propertyIds ? {
                    create: propertyIds.map((propertyId: string) => ({
                        tenantId,
                        propertyId,
                    })),
                } : undefined,
            },
        });
    }

    async remove(tenantId: string, id: string) {
        // Delete mappings first
        await this.prisma.contractorProperty.deleteMany({
            where: { contractorId: id, tenantId },
        });

        return this.prisma.contractor.delete({
            where: { id, tenantId },
        });
    }
}
