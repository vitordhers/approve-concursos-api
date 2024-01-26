import { KiwifyOrderStatus } from './enum/order-status.enum';

export interface KiwifyOrderDto {
  order_id: string;
  order_ref: string;
  order_status: KiwifyOrderStatus;
  product_type: string; // 'membership';
  payment_method: string; // 'credit_card';
  store_id: string;
  payment_merchant_id: string;
  installments: number;
  card_type: string; // 'mastercard'
  card_last4digits: string;
  card_rejection_reason: string | null;
  boleto_URL: string | null;
  boleto_barcode: string | null;
  boleto_expiry_date: string | null;
  pix_code: string | null;
  pix_expiration: string | null;
  sale_type: string; //'producer'
  created_at: string;
  updated_at: string;
  approved_date: string;
  refunded_at: string | null;
  Product: KiwifyProduct;
  Customer: KiwifyCustomer;
  Commissions: KiwifyComissions;
  TrackingParameters: {
    src: null;
    sck: null;
    utm_source: null;
    utm_medium: null;
    utm_campaign: null;
    utm_content: null;
    utm_term: null;
  };
  Subscription: KiwifySubscription | null;
  subscription_id: string; // '85b55857-0485-4447-aa34-be1310a0d921'
  access_url: string | null;
}

interface KiwifyProduct {
  product_id: string;
  product_name: string;
}

interface KiwifyCustomer {
  full_name: string;
  email: string;
  mobile: string | null;
  CPF: string; //'11001109965'
  ip: string | null; //'98ea:6b6f:dc82:3992:6c52:4d07:56f5:474f'
}

interface KiwifyComissions {
  charge_amount: string; // cents as int '9613'
  product_base_price: string; // cents as int '9613'
  kiwify_fee: string; // cents as int'1057'
  commissioned_stores: KiwifyComissionedStore[];
  my_commission: string;
  funds_status: string | null;
  estimated_deposit_date: string | null;
  deposit_date: string | null;
}

interface KiwifyComissionedStore {
  id: string; //'32f474c9-59b4-42a2-a647-ce0c42476a9d';
  type: string; //'producer'
  custom_name: string; // 'Example store'
  email: string; //'example@store.domain'
  value: string; // '8556'
}

interface KiwifySubscription {
  id: string; //'85b55857-0485-4447-aa34-be1310a0d921'
  start_date: string; //'2024-01-08T22:35:27.669Z'
  next_payment: string; // '2024-01-15T22:35:27.669Z'
  status: string; // 'active', 'waiting_payment'
  plan: KiwifySubscriptionPlan;
  charges: KiwifySubscriptionCharges;
}

interface KiwifySubscriptionPlan {
  id: string; //'1d7c5d6d-02dc-44ff-8409-4ec41f11975b'
  name: string; //'Example plan'
  frequency: string; //'weekly'
  qty_charges: number; // 0
}

interface KiwifySubscriptionCharges {
  completed: KiwifyCompletedSubscriptionCharge[];
  future: KiwifyFutureSubscriptionCharge[];
}

interface KiwifyCompletedSubscriptionCharge {
  order_id: string; // '1dacc67e-bac2-4026-bb07-4370eb6f3b56'
  amount: number; // cents as int 8556
  status: string; // 'paid'
  installments: number; // 1
  card_type: string | null; // 'mastercard'
  card_last_digits: string | null; // '6780'
  card_first_digits: string | null; // '181010'
  created_at: string; // '2024-01-08T22:35:27.669Z'
}

interface KiwifyFutureSubscriptionCharge {
  charge_date: string; // '2024-01-15T22:35:27.669Z'
}
