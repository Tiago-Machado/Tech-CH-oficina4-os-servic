import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdemServicoORM } from './infrastructure/database/entities/ordem-servico.orm-entity';
import { OrdemServicoRepository } from './infrastructure/database/repositories/ordem-servico.repository';
import { MessagingService } from './infrastructure/messaging/messaging.service';
import { SagaConsumer } from './infrastructure/messaging/saga.consumer';
import { OrdemServicoUseCases } from './application/use-cases/ordem-servico.use-cases';
import { OrdemServicoController } from './presentation/controllers/ordem-servico.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [OrdemServicoORM],
        synchronize: true, // só dev; em prod usar migrations
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([OrdemServicoORM]),
  ],
  controllers: [OrdemServicoController],
  providers: [
    OrdemServicoRepository,
    MessagingService,
    SagaConsumer,
    OrdemServicoUseCases,
  ],
})
export class AppModule {}
