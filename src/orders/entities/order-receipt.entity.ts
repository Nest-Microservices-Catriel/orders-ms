import {
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_receipt')
export class OrderReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Order, (order) => order.id)
  @JoinColumn()
  order: Order;

  @Column('text')
  receiptUrl: string;

  @Column({ type: 'timestamp', default: new Date() })
  createdAt: Date;
  @Column({ type: 'timestamp', default: new Date() })
  updatedAt: Date;

  @BeforeUpdate()
  updatedAtUpdate() {
    this.updatedAt = new Date();
  }
}
