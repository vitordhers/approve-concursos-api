import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { KiwifyOrderDto } from './kiwify/interfaces/kiwify-order.dto';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Payment } from './interface/payment.interface';
import { SerializationService } from 'src/serialization/serialization.service';
import { DbService } from 'src/db/db.service';
import { Charge, Order } from './interface/order.interface';
import { PaymentMethod } from './payment-method.enum';
import { KiwifyOrderStatus } from './kiwify/interfaces/enum/order-status.enum';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { inspect } from 'util';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Entity } from 'src/db/enums/entity.enum';
import { BaseUser } from 'src/users/interfaces/base-user.interface';

@Injectable()
export class KiwifyService {
  private logger = new Logger('KiwifyService');
  approvedToken = this.configService.get<string>('KIWIFY_WEBHOOK_TOKEN');

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly serializationService: SerializationService,
    private readonly dbService: DbService,
  ) {}

  checkKiwifySignatureIsValid(
    orderDto: KiwifyOrderDto,
    signature: string,
    secret: string,
  ) {
    const calculatedSignature = createHmac('sha1', secret)
      .update(JSON.stringify(orderDto))
      .digest('hex');
    console.log({ calculatedSignature, signature });
    return signature === calculatedSignature;
  }

  async handleKiwifyOrder(orderDto: KiwifyOrderDto, signature: string) {
    const isSignatureValid = this.checkKiwifySignatureIsValid(
      orderDto,
      signature,
      this.approvedToken,
    );

    if (!isSignatureValid) {
      throw new BadRequestException('Incorrect signature');
    }

    const {
      order_id: providerOrderId,
      payment_method: paymentMethod,
      order_status: orderStatus,
      Product: product,
      Subscription: subscription,
      Customer: customer,
      created_at: orderCreatedAt,
      updated_at: orderUpdatedAt,
      Commissions,
    } = orderDto;

    const { charge_amount } = Commissions;
    const { email, ip } = customer;

    const baseUser = await this.usersService.findOneByEmail(email);

    if (!baseUser) {
      throw new BadRequestException('User not found');
    }
    let query = `BEGIN TRANSACTION;`;
    // handle order creation/update first
    const { product_id: providerProductId } = product;
    const { charges, id: providerSubscriptionId, plan } = subscription;

    let order = await this.getOrderByProviderId(providerOrderId);
    // create / update charges
    const chargeIds: string[] = [];
    if (subscription && charges && charges.completed.length) {
      const chargesToBeUpdated =
        await this.getChargesByProviderOrderId(providerOrderId);

      if (chargesToBeUpdated && chargesToBeUpdated.length) {
        charges.completed.forEach((completedCharge, index) => {
          const chargeToBeUpdated = chargesToBeUpdated.find(
            (c) => c.providerOrderId === completedCharge.order_id,
          );
          if (chargeToBeUpdated) {
            chargeIds.push(`${chargeToBeUpdated.id}`);
            query += `INSERT INTO charges (id, userId, status, amount, providerOrderId, installments) VALUES ('${
              chargeToBeUpdated.id
            }', '${baseUser.id}', '${
              completedCharge.status
            }', ${this.centsToBrl(
              completedCharge.amount,
            )}, '${providerOrderId}', ${completedCharge.installments || 1});`;
            return;
          }
          chargeIds.push(`$charge_id_${index}`);
          query += `LET $charge_id_${index} = charges:rand();`;
          query += `INSERT INTO charges (id, userId, status, amount, providerOrderId, installments) VALUES ($charge_id_${index}, '${
            baseUser.id
          }', '${completedCharge.status}', ${this.centsToBrl(
            completedCharge.amount,
          )}, '${providerOrderId}', ${completedCharge.installments || 1});`;
        });
      } else {
        charges.completed.forEach((completedCharge, index) => {
          chargeIds.push(`$charge_id_${index}`);
          query += `LET $charge_id_${index} = charges:rand();`;
          query += `INSERT INTO charges (id, userId, status, amount, providerOrderId, installments) VALUES ($charge_id_${index}, '${
            baseUser.id
          }', '${completedCharge.status}', ${this.centsToBrl(
            completedCharge.amount,
          )}, '${providerOrderId}', ${completedCharge.installments || 1});`;
        });
      }
    } else {
      chargeIds.push(`$charge_id_0`);
      query += `LET $charge_id_0 = charges:rand();`;
      query += `INSERT INTO charges (id, userId, status, amount, providerOrderId, installments) VALUES ($charge_id_0, '${
        baseUser.id
      }', '${orderStatus}', ${this.centsToBrl(
        this.centsToBrl(charge_amount),
      )}, '${providerOrderId}', 1);`;
    }

    const orderId = order ? `'${order.id}'` : '$order_id';

    if (!order) {
      // insert order
      order = {
        id: orderId,
        providerId: providerOrderId,
        userId: baseUser.id,
        paymentMethod: paymentMethod as PaymentMethod,
        status: orderStatus,
        chargeIds,
        providerProductId,
        createdAt: new Date(orderCreatedAt).getTime(),
        updatedAt: new Date(orderUpdatedAt).getTime(),
        subscription:
          subscription && providerSubscriptionId && plan
            ? {
                providerId: providerSubscriptionId,
                providerPlanId: plan.id,
              }
            : undefined,
      };
      query += `LET $order_id = orders:rand();`;
    }

    // upsert order
    query += `INSERT INTO orders (id, providerId, paymentMethod, status, userId, chargeIds, providerProductId, createdAt, updatedAt, ${
      order.subscription ? 'subscription' : ''
    }) VALUES (${order.id}, '${order.providerId}', '${order.paymentMethod}', '${
      order.status
    }', '${baseUser.id}', [${chargeIds.join(', ')}], '${providerOrderId}', ${
      order.createdAt
    }, ${order.updatedAt}, ${
      subscription && providerSubscriptionId && plan
        ? JSON.stringify({
            providerId: providerSubscriptionId,
            providerPlanId: plan.id,
          })
        : ''
    });`;

    const currentTimestamp = Date.now();

    // change user role based on payment
    if (orderStatus === KiwifyOrderStatus.paid) {
      const paidAmount =
        subscription && charges && charges.completed.length
          ? charges.completed.reduce((prev, c) => {
              if (c.order_id === providerOrderId) {
                return prev + this.centsToBrl(c.amount);
              }
              return prev;
            }, 0)
          : this.centsToBrl(charge_amount);

      const payment: Payment = {
        amount: paidAmount,
        at: currentTimestamp,
        userId: baseUser.id,
        ip,
      };

      query += `RELATE ${baseUser.id}->paid->${orderId} SET at = ${payment.at}, amount = ${payment.amount};`;
      const currentDate = new Date();

      const futureDate = new Date();
      futureDate.setDate(currentDate.getDate() + 32);

      futureDate.setHours(0, 0, 0, 0);
      let nextDueDate = futureDate.getTime();
      if (charges.future) {
        const [nextChargeDate] = charges.future;
        nextDueDate = new Date(nextChargeDate.charge_date).getTime();
      }

      query += `UPDATE ${baseUser.id} SET role = ${
        nextDueDate > currentTimestamp
          ? UserRole.PAID_USER
          : UserRole.VALIDATED_USER
      }, nextDueDate = ${nextDueDate}, updatedAt = ${currentTimestamp};`;

      if (nextDueDate > currentTimestamp) {
        const serializedUserId =
          this.serializationService.surrealIdToRegularUid(baseUser.id);
        this.usersService.unsubscribeUserFromPaymentListener(serializedUserId);
      }
    }

    if (
      orderStatus === KiwifyOrderStatus.refunded ||
      orderStatus === KiwifyOrderStatus.chargedback
    ) {
      query += `UPDATE ${baseUser.id} SET role = ${UserRole.VALIDATED_USER}, nextDueDate = ${currentTimestamp}, updatedAt = ${currentTimestamp};`;
    }

    query += 'COMMIT TRANSACTION;';

    const result = await this.dbService.query(query);
    const loggedResults = result
      .filter((array) => !!array.length)
      .map(([firstValue]) =>
        'email' in firstValue
          ? this.serializationService.serializeUserResult(firstValue)
          : firstValue,
      );
    this.logger.log(
      `handleKiwifyOrder -> ${inspect({ loggedResults }, { depth: null })}`,
    );
  }

  centsToBrl(cents: string | number) {
    if (typeof cents === 'number') {
      return cents / 100;
    }
    return Number(cents) / 100;
  }

  async getOrderByProviderId(providerOrderId: string) {
    return await this.dbService.findOneWhere<Order | undefined>(
      'orders',
      `providerId = '${providerOrderId}'`,
    );
  }

  async getChargesByProviderOrderId(providerOrderId: string) {
    const whereClause = `providerOrderId = '${providerOrderId}'`;
    return await this.dbService.findWhere<Charge>('charges', whereClause);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkDueUsers() {
    const currentTimestamp = Date.now();

    const dueUsers = await this.dbService.findWhere<BaseUser>(
      Entity.USERS,
      `nextDueDate <= ${currentTimestamp} AND role = ${UserRole.PAID_USER}`,
    );

    if (!dueUsers || !dueUsers.length) return;

    let query = `BEGIN TRANSACTION;`;

    dueUsers.forEach((dueUser) => {
      query += `UPDATE ${dueUser.id} SET role = ${UserRole.NON_VALIDATED_USER};`;
    });

    query += 'COMMIT TRANSACTION;';

    const result = await this.dbService.query<BaseUser>(query);
    const parsedUsers = result.map((user) =>
      this.serializationService.serializeUserResult(user),
    );

    this.logger.log(
      `checkDueUsers => ${inspect({ parsedUsers }, { depth: null })}`,
    );
  }
}
