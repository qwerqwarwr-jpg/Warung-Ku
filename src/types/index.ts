export type AvailabilityStatus = 'AVAILABLE' | 'HABIS';
export type AvailabilityReason = 'TERSEDIA' | 'HABIS_STOK' | 'HABIS_MANUAL' | 'TIDAK_DILACAK';

export type MovementType = 'opening' | 'adjustment' | 'sale' | 'waste' | 'reversal';
export type ReservationStatus = 'active' | 'committed' | 'released' | 'expired';

export type BillStatus = 'open' | 'awaiting_payment' | 'paid' | 'void';
export type OrderSource = 'customer_qr' | 'walk_in';
export type PaymentTiming = 'pay_first' | 'pay_after';
export type PaymentProvider = 'manual_qris' | 'sandbox' | 'cash';
export type PaymentStatus = 'succeeded' | 'failed' | 'pending';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  stockItemId: string | null;
  category: 'Makanan' | 'Minuman' | 'Camilan' | 'Lainnya';
  description?: string;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  type: 'portion' | 'ingredient';
}

export interface StockMovement {
  id: string;
  outletId: string;
  stockItemId: string;
  businessDate: string;
  type: MovementType;
  qty: number; // positive or negative signed integer
  reason: string;
  note?: string;
  orderId?: string;
  idempotencyKey: string;
  createdBy: string;
  createdAt: string; // ISO or HH:mm string
}

export interface StockReservation {
  id: string;
  outletId: string;
  orderId: string;
  stockItemId: string;
  qty: number;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface MenuAvailabilityOverride {
  menuItemId: string;
  isSoldOutManual: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  variant?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
}

export interface Order {
  id: string;
  billId: string;
  outletId: string;
  source: OrderSource;
  tableId: string | null;
  customerName?: string;
  status: 'awaiting_payment' | 'paid' | 'cancelled' | 'expired' | 'void';
  businessDate: string;
  note?: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  paidAt?: string;
  kitchenReleasedAt?: string;
  expiredAt?: string;
  voidAt?: string;
}

export interface Bill {
  id: string;
  orderId: string;
  outletId: string;
  tableId: string | null;
  paymentTiming: PaymentTiming;
  status: BillStatus;
  subtotal: number;
  discount: number;
  taxService: number;
  total: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  billId: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  idempotencyKey: string;
  verifiedBy: string;
  verifiedAt: string;
  providerRef?: string;
}

export interface AuditLog {
  id: string;
  outletId: string;
  actorId: string;
  action:
    | 'confirm_payment'
    | 'manual_sold_out_toggle'
    | 'void_order'
    | 'stock_opening'
    | 'stock_adjustment'
    | 'stock_waste'
    | 'cancel_order'
    | 'webhook_received'
    | 'ttl_expired';
  entity: string;
  entityId: string;
  before: any;
  after: any;
  createdAt: string;
}

export interface AvailabilityResult {
  menuItemId: string;
  status: AvailabilityStatus;
  tersedia: number;
  alasan: AvailabilityReason;
  breakdown: {
    stokAwal: number;
    terjual: number;
    tertahan: number;
    koreksi: number;
    terbuang: number;
    isManualSoldOut: boolean;
    isTracked: boolean;
  };
}
