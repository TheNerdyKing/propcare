import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Set global prefix to avoid collisions with frontend routes
    app.setGlobalPrefix('api');

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    app.enableCors({
        origin: true, // Allow all origins in this mode
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    await app.listen(process.env.PORT || 3001);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
