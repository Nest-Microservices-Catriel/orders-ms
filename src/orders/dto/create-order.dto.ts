import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  // @IsNumber()
  // @IsPositive()
  // totalAmount: number;

  // @IsNumber()
  // @IsPositive()
  // totalItems: number;

  // @IsEnum(OrderStatus, {
  //   message: `Possible status values are: ${OrderStatus.CANCELLED}, ${OrderStatus.PENDING} ${OrderStatus.DELIVERED}`,
  // })
  // @IsOptional()
  // status: OrderStatus = OrderStatus.PENDING;

  // @IsOptional()
  // @IsBoolean()
  // paid: boolean = false;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
