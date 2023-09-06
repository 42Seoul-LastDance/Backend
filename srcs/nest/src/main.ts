import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();

    const config = new DocumentBuilder()
        .setTitle('ft_transcendence API')
        .setDescription('API description for ft_transcendence')
        .setVersion('1.0.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    // Swagger UI에 대한 path를 연결함
    // .setup('swagger ui endpoint', app, swagger_document)
    SwaggerModule.setup('api', app, document);
    await app.listen(3000);
}
bootstrap();
