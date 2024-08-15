import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto, OrderItemDto, PaidOrderDto } from './dto';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config/services';
import { IProductMS } from 'src/types/product-ms.type';
import { OrderWithProducts } from './interfaces/order-with-products';
import { OrderStatus } from './enum/order-status.enum';
import { OrderReceipt } from './entities/order-receipt.entity';

@Injectable()
export class OrdersService {
  //3. Crear transaccion de base de datos

  constructor(
    @Inject(NATS_SERVICE) private natsClient: ClientProxy,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderReceipt)
    private readonly orderReceiptRepository: Repository<OrderReceipt>,

    private readonly dataSource: DataSource, // Inyecta DataSource para usar QueryRunner
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const ids = createOrderDto.items.map((item) => item.productId);
    try {
      const products = await this.getProductsMs(ids);
      const totalAmount = this.calculateTotalAmount(
        createOrderDto.items,
        products,
      );
      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      //3. Crear transaccion de base de datos
      const order = await this.createOrder(
        totalAmount,
        totalItems,
        createOrderDto,
        products,
      );
      const orderPopulate = await this.findOne(order.id);
      return orderPopulate;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalPages = await this.orderRepository.count({
      where: { status: orderPaginationDto.status },
    });
    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;
    return {
      data: await this.orderRepository.find({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPaginationDto.status,
        },
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItem'],
    });

    if (!order)
      throw new RpcException({
        message: `Order not found with id ${id}`,
        status: HttpStatus.NOT_FOUND,
      });
    const ids: number[] = order.orderItem.map(
      (orderItem) => orderItem.productId,
    );
    const products: IProductMS[] = await this.getProductsMs(ids);
    return this.orderItemWithName(order, products);
  }
  z;

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    const order = await this.findOne(id);

    if (order.status === status) {
      return order;
    }
    order.status = status;
    return this.orderRepository.save(order);
  }

  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession = await firstValueFrom(
      this.natsClient.send('create.payment.session', {
        orderId: order.id,
        currency: 'usd',
        items: order.orderItem.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    );
    return paymentSession;
  }

  //? Helpers

  private async getProductsMs(ids: number[]) {
    try {
      const products: IProductMS[] = await firstValueFrom(
        this.natsClient.send({ cmd: 'validate_products' }, ids),
      );
      return products;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private calculateTotalAmount(
    orderItem: OrderItemDto[],
    products: IProductMS[],
  ) {
    return orderItem.reduce((acc, orderTitem) => {
      const price = products.find(
        (product) => product.id === orderTitem.productId,
      ).price;
      return price * orderTitem.quantity;
    }, 0);
  }

  private async createOrder(
    totalAmount: number,
    totalItems: number,
    createOrderDto: CreateOrderDto,
    products: IProductMS[],
  ): Promise<Order> {
    try {
      const order = this.orderRepository.create({
        totalAmount,
        totalItems,
        orderItem: createOrderDto.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: products.find((product) => product.id === item.productId)
            .price,
        })),
      });
      return await this.orderRepository.save(order);
    } catch (error) {
      throw new InternalServerErrorException('INTERNAL SERVER ERROR');
    }
  }

  private orderItemWithName(order: Order, products: IProductMS[]) {
    return {
      ...order,
      orderItem: order.orderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name,
      })),
    };
  }

  async paidOrder(paidOrderDto: PaidOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.startTransaction();
    const order = await this.findOne(paidOrderDto.orderId);
    try {
      const orderUpdate = await queryRunner.manager
        .createQueryBuilder()
        .update(Order)
        .set({
          status: OrderStatus.PAID,
          paid: true,
          paidAt: new Date(),
          stripeChargeId: paidOrderDto.stripePaymentId,
        })
        .where('id = :id', { id: paidOrderDto.orderId })
        .execute();

      const orderReceipt = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(OrderReceipt)
        .values({
          receiptUrl: paidOrderDto.receiptUrl,
          order: order,
        })
        .execute();
      await queryRunner.commitTransaction();

      return {
        orderUpdate,
        orderReceipt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
