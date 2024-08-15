import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../enum/order-status.enum';
import { OrderItem } from './order-item.entity';
import { OrderReceipt } from './order-receipt.entity';

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

  @Column('text', { default: null })
  stripeChargeId: string | null;

  @OneToOne(() => OrderReceipt, (orderReceipt) => orderReceipt.order)
  orderReceipt: OrderReceipt;

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
