export enum KiwifyOrderStatus {
  paid = 'paid', //Pagamento aprovado
  waiting_payment = 'waiting_payment', //Boleto e pix aguardando pagamento
  refused = 'refused', //Pagamento recusado
  refunded = 'refunded', //	Reembolsado
  chargedback = 'chargedback', //	Chargeback
}
