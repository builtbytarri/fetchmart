export interface DeliveryBreakdown {
  base: number;
  distanceFee: number;
  bulkyFee: number;
  nightSurcharge: number;
  extraStopFee: number;
}

export interface OrderQuote {
  distanceKm: number;
  subtotal: number;
  deliveryFee: number;
  deliveryBreakdown: DeliveryBreakdown;
  serviceFee: number;
  commissionAmount: number;
  storePayout: number;
  riderPayout: number;
  adminProfit: number;
  total: number;
}

export interface QuoteItem {
  productId: string;
  quantity: number;
}
