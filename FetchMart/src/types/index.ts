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
  logoUrl?: string | null;
  isOpen: boolean;
  openingHours?: Record<string, string> | null;
  createdAt?: string;
  updatedAt?: string;
  distance?: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  stockQuantity: number;
  isAvailable: boolean;
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
  quantity: number;
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
  store?: Store;
  customer?: User;
  rider?: Rider;
  orderItems: OrderItem[];
}

export interface Rider {
  id: string;
  userId: string;
  isAvailable: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  lastPingAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface PaymentInitResponse {
  success: boolean;
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
