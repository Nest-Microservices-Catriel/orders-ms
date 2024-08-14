import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatus } from '../enum/order-status.enum';

export class ChangeOrderStatusDto {
  @IsUUID(4)
  id: string;

  @IsEnum(OrderStatus, {
    message: `Possible status values are: ${OrderStatus.CANCELLED}, ${OrderStatus.PENDING} ${OrderStatus.DELIVERED}`,
  })
  status: OrderStatus;
}
