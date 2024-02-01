export interface KiwifySalesPaginationResponse {
  data: KiwifySaleData[];
  pagination: KiwifyPaginationData;
}

interface KiwifySaleData {
  created_at: string;
  customer: {
    email: string;
    id: string;
    name: string;
  };
  id: string;
  net_amount: number;
  payment_method: string;
  product: {
    id: string;
    name: string;
  };
  reference: string;
  status: string;
  type: string;
  updated_at: string;
}

interface KiwifyPaginationData {
  count: number;
  page_number: number;
  page_size: number;
}
