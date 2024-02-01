export interface KiwifySaleDetail {
  approved_date: string;
  card_last_digits: string;
  card_type: string;
  created_at: string;
  customer: {
    cpf: string;
    email: string;
    id: string;
    mobile: string;
    name: string;
  };
  id: string;
  installments: number;
  is_one_click: boolean;
  net_amount: number;
  payment: {
    charge_amount: number;
    fee: number;
    net_amount: number;
    product_base_price: number;
  };
  payment_method: string;
  product: {
    id: string;
    name: string;
  };
  reference: string;
  sale_type: string;
  status: string;
  two_cards: boolean;
  type: string;
  updated_at: string;
}
