import { Module } from '@nestjs/common';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicModule } from '../public/public.module';

@Module({
    imports: [PrismaModule, PublicModule],
    controllers: [ContractorsController],
    providers: [ContractorsService],
})
export class ContractorsModule { }
