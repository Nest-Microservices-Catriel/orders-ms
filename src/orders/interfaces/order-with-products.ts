import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enum/order-status.enum';

export interface OrderWithProducts {
  orderItem: {
    name: string;
    id: string;
    productId: number;
    quantity: number;
    price: number;
    // order: Order;
  }[];
  id: string;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  paid: boolean;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
