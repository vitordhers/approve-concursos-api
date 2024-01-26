import { PaymentMethod } from '../payment-method.enum';

export interface BaseOrder {
  providerId: string;
  paymentMethod: PaymentMethod;
  status: string;
  userId: string;
  chargeIds: string[];
  providerProductId: string;
  createdAt: number;
  updatedAt: number;
  subscription?: Subscription;
}

export interface Subscription {
  providerId: string;
  providerPlanId: string;
}

export interface Order extends BaseOrder {
  id: string;
}

export interface BaseCharge {
  userId: string;
  status: string;
  amount: number;
  providerOrderId: string;
  installments: number;
}

export interface Charge extends BaseCharge {
  id: string;
}
