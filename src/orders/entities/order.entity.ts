import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../enum/order-status.enum';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  totalAmount: number;
  @Column('int')
  totalItems: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column('bool', { default: false })
  paid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamp', default: new Date() })
  createdAt: Date;
  @Column({ type: 'timestamp', default: new Date() })
  updatedAt: Date;

  @BeforeUpdate()
  updatedAtUpdate() {
    this.updatedAt = new Date();
  }

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  orderItem: OrderItem[];
}
