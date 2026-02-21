import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PublicModule } from '../public/public.module';

@Module({
    imports: [PublicModule],
    controllers: [AdminController],
})
export class AdminModule { }
