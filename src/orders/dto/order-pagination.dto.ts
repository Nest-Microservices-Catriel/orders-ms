import { IsEnum, IsOptional, IsPositive } from 'class-validator';

import { OrderStatus } from '../enum/order-status.enum';
import { Type } from 'class-transformer';

export class OrderPaginationDto {
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: `Possible status values are: ${OrderStatus.CANCELLED}, ${OrderStatus.PENDING} ${OrderStatus.DELIVERED}`,
  })
  status: OrderStatus;
}
