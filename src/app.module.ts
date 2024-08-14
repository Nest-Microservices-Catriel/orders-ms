import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config/envs';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.postgresHost,
      port: envs.postgresPort,
      username: envs.postgresUser,
      password: envs.postgresPassword,
      database: envs.postgresDb,
      synchronize: true,
      entities: [Order, OrderItem],
      autoLoadEntities: true,
    }),
    OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
