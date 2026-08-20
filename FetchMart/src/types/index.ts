export type UserRole = 'CUSTOMER' | 'STORE' | 'RIDER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type OrderStatus = 
  | 'CREATED'
  | 'PAID'
  | 'STORE_ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Store {
  id: string;
  ownerUserId?: string;
  name: string;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  isOpen: boolean;
  isVerified?: boolean;
  openingHours?: Record<string, string> | null;
  createdAt?: string;
  updatedAt?: string;
  distance?: number;
}

export type ProductUnit = 'PIECE' | 'KG' | 'MUDU' | 'BAG' | 'LITRE' | 'PACK';
export type StockMode = 'COUNTED' | 'IN_STOCK';

/** Short suffix shown next to a price or quantity, e.g. "₦2,500 / mudu". */
export const UNIT_LABEL: Record<ProductUnit, string> = {
  PIECE: '',
  KG: 'kg',
  MUDU: 'mudu',
  BAG: 'bag',
  LITRE: 'L',
  PACK: 'pack',
};

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  /** Unit of sale. PIECE behaves as a plain countable item. */
  unit: ProductUnit;
  /** Smallest purchasable increment — 0.5 for a mudu sold in halves. */
  stepSize: number;
  /** IN_STOCK products show an availability badge instead of a count. */
  stockMode: StockMode;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  stockQuantity: number;
  isAvailable: boolean;
  isSuggested: boolean;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  /** May be fractional for measured goods. */
  quantity: number;
  /** Unit as it was at order time. */
  unit?: ProductUnit;
}

export interface OrderRiderInfo {
  id: string;
  name: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  lastPingAt: string | null;
}

export interface Order {
  id: string;
  customerUserId: string;
  storeId: string;
  riderId: string | null;
  status: OrderStatus;
  totalAmount: number;
  paymentReference: string | null;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  customer?: User;
  rider?: OrderRiderInfo | null;
  deliveryLocation?: { latitude: number | null; longitude: number | null };
  orderItems: OrderItem[];
}

export interface Rider {
  id: string;
  userId: string;
  isAvailable: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  lastPingAt: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  vehicleColor?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface PaymentInitResponse {
  success: boolean;
  /** Our tx_ref: ORDER-{orderId}-{timestamp} */
  reference: string;
  /** Flutterwave hosted checkout URL — data.link from /v3/payments */
  authorizationUrl: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  /** Present on success — use for navigation to OrderDetails */
  orderId?: string;
  message?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

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

export type WalletOwnerType = 'STORE' | 'RIDER';
export type LedgerEntryType = 'CREDIT' | 'DEBIT' | 'FEE';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface LedgerEntry {
  id: string;
  walletId: string;
  orderId: string | null;
  type: LedgerEntryType;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface WithdrawalRecord {
  id: string;
  amount: number;
  fee: number;
  status: WithdrawalStatus;
  reference: string;
  accountName: string;
  accountNumber: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankCode: string;
  bankName: string | null;
  accountNumber: string;
  accountName: string;
}

export interface WalletSummary {
  /** Withdrawable right now. */
  balance: number;
  /** Earned but held until the related orders are delivered. */
  pendingBalance: number;
  ownerType: WalletOwnerType;
  ledger: LedgerEntry[];
  withdrawals: WithdrawalRecord[];
  bankAccount: BankAccount | null;
}

export interface BankInfo {
  code: string;
  name: string;
}
