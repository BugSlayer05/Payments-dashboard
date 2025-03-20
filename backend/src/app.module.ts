import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SummaryModule } from './summary/summary.module';
import { User } from './users/entities/user.entity';
import { Transaction } from './transactions/entities/transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Transaction],
        synchronize: true, // use migrations in production
        logging: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    TransactionsModule,
    SummaryModule,
  ],
})
export class AppModule {}
