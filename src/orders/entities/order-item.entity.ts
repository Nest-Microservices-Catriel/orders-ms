import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('int')
  productId: number;
  @Column('int')
  quantity: number;
  @Column('float')
  price: number;

  @ManyToOne(() => Order, (order) => order.orderItem)
  order: Order;
}
