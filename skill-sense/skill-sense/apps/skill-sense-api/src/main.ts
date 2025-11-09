import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('SkillSense API')
    .setDescription('AI-powered skill extraction and analysis platform')
    .setVersion('1.0')
    .addTag('profiles', 'User profile management')
    .addTag('extraction', 'Skill extraction from various sources')
    .addTag('search', 'Vector-based skill search')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 SkillSense API running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api`);
}
bootstrap();
