import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuditLog,
  AvailabilityResult,
  Bill,
  MenuAvailabilityOverride,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  StockItem,
  StockMovement,
  StockReservation,
} from '../types';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_STOCK_ITEMS,
  INITIAL_TABLES,
  MORNING_OPENING_STOCK,
  OUTLET_CONFIG,
  getSeedInitialState,
} from '../data/seedData';
import { StockService } from '../services/stockService';
import { BillService } from '../services/billService';

export interface AppContextType {
  // Master Data
  menuItems: MenuItem[];
  stockItems: StockItem[];
  tables: string[];
  businessDate: string;
  outletConfig: typeof OUTLET_CONFIG;

  // Realtime App State
  orders: Order[];
  bills: Bill[];
  payments: Payment[];
  stockMovements: StockMovement[];
  stockReservations: StockReservation[];
  manualOverrides: MenuAvailabilityOverride[];
  auditLogs: AuditLog[];

  // Environment & Demo Controls
  currentTime: string;
  setCurrentTime: (time: string) => void;
  kitchenFlag: boolean;
  setKitchenFlag: (flag: boolean) => void;
  isReconnecting: boolean;
  setIsReconnecting: (reconn: boolean) => void;
  activeScenarioStep: number;
  customerTable: string;
  setCustomerTable: (table: string) => void;

  // Stock operations
  getAvailability: (menuItemId: string) => AvailabilityResult;
  setDailyStock: (stockMap: Record<string, number>, authorizedBy?: string) => { ok: boolean; message: string };
  toggleManualSoldOut: (menuItemId: string, authorizedBy?: string) => void;
  recordWaste: (stockItemId: string, qty: number, reason: string, note?: string, authorizedBy?: string) => { ok: boolean; message?: string };
  recordAdjustment: (stockItemId: string, qty: number, reason: string, note?: string, authorizedBy?: string) => { ok: boolean; message?: string };

  // Billing & Order operations
  createOrder: (params: {
    source: 'customer_qr' | 'walk_in';
    tableId: string | null;
    customerName?: string;
    items: { menuItemId: string; qty: number; note?: string }[];
    note?: string;
    customTime?: string;
  }) => { ok: boolean; orderId?: string; error?: string };

  confirmManualQris: (params: {
    billId: string;
    verifiedBy: string;
    note?: string;
    customTime?: string;
  }) => { ok: boolean; error?: string };

  triggerSandboxWebhook: (params: {
    billId: string;
    isDuplicateTest?: boolean;
    customTime?: string;
  }) => { ok: boolean; error?: string; message: string };

  cancelOrderBeforePayment: (params: {
    orderId: string;
    actorId: string;
    reason: string;
  }) => { ok: boolean; error?: string };

  voidPaidOrder: (params: {
    orderId: string;
    reason: string;
    pin: string;
    authorizedBy: string;
    customTime?: string;
  }) => { ok: boolean; error?: string };

  // Demo / Testing Scenarios
  runScenarioStep: (stepNumber: number) => { ok: boolean; message: string };
  runAllScenarios: () => void;
  resetToInitialState: () => void;
  loadFullLampiranAData: () => void;
  loadSeedData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [stockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);
  const [tables] = useState<string[]>(INITIAL_TABLES);
  const [businessDate] = useState<string>(OUTLET_CONFIG.businessDate);

  // Initialize with rich seed data out of the box
  const initialSeed = getSeedInitialState();
  const [orders, setOrders] = useState<Order[]>(initialSeed.orders);
  const [bills, setBills] = useState<Bill[]>(initialSeed.bills);
  const [payments, setPayments] = useState<Payment[]>(initialSeed.payments);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialSeed.stockMovements);
  const [stockReservations, setStockReservations] = useState<StockReservation[]>(initialSeed.stockReservations);
  const [manualOverrides, setManualOverrides] = useState<MenuAvailabilityOverride[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialSeed.auditLogs);

  const [currentTime, setCurrentTime] = useState<string>(initialSeed.currentTime);
  const [kitchenFlag, setKitchenFlag] = useState<boolean>(OUTLET_CONFIG.kitchenFlag);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [activeScenarioStep, setActiveScenarioStep] = useState<number>(4);
  const [customerTable, setCustomerTable] = useState<string>('M01');

  // Automatic TTL expiration checker against simulated currentTime
  useEffect(() => {
    // Check expired reservations
    setStockReservations((prevRes) => {
      let changed = false;
      const updated = prevRes.map((r) => {
        if (r.status === 'active' && r.expiresAt <= currentTime) {
          changed = true;
          return { ...r, status: 'expired' as const };
        }
        return r;
      });
      return changed ? updated : prevRes;
    });

    // Also mark unpaid order expired if reservation expired
    setOrders((prevOrders) => {
      let changed = false;
      const updated = prevOrders.map((ord) => {
        if (ord.status === 'awaiting_payment') {
          // Check if its reservation is expired
          const hasExpiredRes = stockReservations.some(
            (r) => r.orderId === ord.id && r.status === 'expired'
          );
          if (hasExpiredRes) {
            changed = true;
            return { ...ord, status: 'expired' as const, expiredAt: currentTime };
          }
        }
        return ord;
      });
      return changed ? updated : prevOrders;
    });
  }, [currentTime, stockReservations]);

  // Helper to add audit log
  const logAudit = (
    action: AuditLog['action'],
    entity: string,
    entityId: string,
    actorId: string,
    before: any,
    after: any,
    timestamp = currentTime
  ) => {
    const entry: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      outletId: OUTLET_CONFIG.id,
      actorId,
      action,
      entity,
      entityId,
      before,
      after,
      createdAt: timestamp,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Availability Single Source of Truth
  const getAvailability = (menuItemId: string): AvailabilityResult => {
    return StockService.getAvailability(
      menuItemId,
      businessDate,
      stockMovements,
      stockReservations,
      manualOverrides,
      menuItems
    );
  };

  // Logistik: Isi Stok Pagi (setDailyStock)
  const setDailyStock = (
    stockMap: Record<string, number>,
    authorizedBy = 'pemilik_warung'
  ): { ok: boolean; message: string } => {
    const existingOpening = stockMovements.filter(
      (m) => m.type === 'opening' && m.businessDate === businessDate
    );

    const newMovements: StockMovement[] = [];
    const nowTime = currentTime;

    if (existingOpening.length === 0) {
      // First morning entry of the day
      for (const stockItemId in stockMap) {
        const qty = stockMap[stockItemId];
        if (qty > 0) {
          newMovements.push({
            id: `MV-00${newMovements.length + 1}`,
            outletId: OUTLET_CONFIG.id,
            stockItemId,
            businessDate,
            type: 'opening',
            qty,
            reason: 'Stok pagi hari',
            idempotencyKey: `demo-open-${stockItemId.toLowerCase().replace('-', '')}`,
            createdBy: authorizedBy,
            createdAt: nowTime,
          });
        }
      }

      setStockMovements((prev) => [...prev, ...newMovements]);
      logAudit('stock_opening', 'stock_movement', 'bulk_opening', authorizedBy, null, stockMap, nowTime);
      return { ok: true, message: `Stok pagi 6 menu berhasil disimpan secara atomik.` };
    } else {
      // Re-entry on same day: calculate difference and write adjustments
      for (const stockItemId in stockMap) {
        const currentOpening = existingOpening.find((m) => m.stockItemId === stockItemId)?.qty || 0;
        const target = stockMap[stockItemId];
        const diff = target - currentOpening;
        if (diff !== 0) {
          newMovements.push({
            id: `MV-${Date.now().toString().slice(-4)}-${stockItemId}`,
            outletId: OUTLET_CONFIG.id,
            stockItemId,
            businessDate,
            type: 'adjustment',
            qty: diff,
            reason: 'Koreksi pengisian stok pagi ulang',
            idempotencyKey: `adj-reopen-${stockItemId}-${Date.now()}`,
            createdBy: authorizedBy,
            createdAt: nowTime,
          });
        }
      }
      setStockMovements((prev) => [...prev, ...newMovements]);
      logAudit('stock_adjustment', 'stock_movement', 'bulk_adjustment', authorizedBy, null, stockMap, nowTime);
      return { ok: true, message: `Koreksi stok pagi tersimpan melalui movement adjustment.` };
    }
  };

  // Toggle HABIS manual per menu
  const toggleManualSoldOut = (menuItemId: string, authorizedBy = 'kasir_demo') => {
    const current = manualOverrides.find((o) => o.menuItemId === menuItemId);
    const newState = !current?.isSoldOutManual;

    setManualOverrides((prev) => {
      const filtered = prev.filter((o) => o.menuItemId !== menuItemId);
      return [
        ...filtered,
        {
          menuItemId,
          isSoldOutManual: newState,
          updatedBy: authorizedBy,
          updatedAt: currentTime,
        },
      ];
    });

    logAudit(
      'manual_sold_out_toggle',
      'menu_availability_override',
      menuItemId,
      authorizedBy,
      { isSoldOutManual: current?.isSoldOutManual || false },
      { isSoldOutManual: newState },
      currentTime
    );
  };

  // Record Waste (Terbuang)
  const recordWaste = (
    stockItemId: string,
    qty: number,
    reason: string,
    note?: string,
    authorizedBy = 'pemilik_warung'
  ) => {
    if (qty <= 0) return { ok: false, message: 'Jumlah porsi terbuang harus > 0' };

    // Check available physical balance
    const item = menuItems.find((m) => m.stockItemId === stockItemId);
    if (item) {
      const avail = getAvailability(item.id);
      if (avail.tersedia < qty) {
        return { ok: false, message: `Jumlah terbuang (${qty}) melebihi saldo tersedia (${avail.tersedia})` };
      }
    }

    const newMv: StockMovement = {
      id: `MV-W-${Date.now().toString().slice(-4)}`,
      outletId: OUTLET_CONFIG.id,
      stockItemId,
      businessDate,
      type: 'waste',
      qty: -Math.abs(qty),
      reason,
      note,
      idempotencyKey: `waste-${stockItemId}-${Date.now()}`,
      createdBy: authorizedBy,
      createdAt: currentTime,
    };

    setStockMovements((prev) => [...prev, newMv]);
    logAudit('stock_waste', 'stock_movement', newMv.id, authorizedBy, null, newMv, currentTime);
    return { ok: true, message: `Porsi terbuang (${qty}) berhasil dicatat.` };
  };

  // Record Adjustment (Koreksi)
  const recordAdjustment = (
    stockItemId: string,
    qty: number,
    reason: string,
    note?: string,
    authorizedBy = 'pemilik_warung'
  ) => {
    if (qty === 0) return { ok: false, message: 'Jumlah penyesuaian tidak boleh 0' };

    const newMv: StockMovement = {
      id: `MV-ADJ-${Date.now().toString().slice(-4)}`,
      outletId: OUTLET_CONFIG.id,
      stockItemId,
      businessDate,
      type: 'adjustment',
      qty,
      reason,
      note,
      idempotencyKey: `adj-${stockItemId}-${Date.now()}`,
      createdBy: authorizedBy,
      createdAt: currentTime,
    };

    setStockMovements((prev) => [...prev, newMv]);
    logAudit('stock_adjustment', 'stock_movement', newMv.id, authorizedBy, null, newMv, currentTime);
    return { ok: true, message: `Koreksi stok (${qty > 0 ? '+' : ''}${qty}) berhasil dicatat.` };
  };

  // Create Order (Walk-in or Customer QR)
  const createOrder = ({
    source,
    tableId,
    customerName,
    items,
    note,
    customTime,
  }: {
    source: 'customer_qr' | 'walk_in';
    tableId: string | null;
    customerName?: string;
    items: { menuItemId: string; qty: number; note?: string }[];
    note?: string;
    customTime?: string;
  }): { ok: boolean; orderId?: string; error?: string } => {
    const timeUsed = customTime || currentTime;

    // Direct server-side total calculation
    const calc = BillService.calculateTotals(items, menuItems);
    if (calc.orderItems.length === 0) {
      return { ok: false, error: 'Pilih minimal satu menu untuk membuat pesanan.' };
    }

    const orderId = `ORD-00${orders.length + 1}`;
    const billId = `BILL-${orderId.replace('ORD-', '')}`;

    // 1. Atomic reservation via StockService
    const resResult = StockService.reserveForOrder(
      orderId,
      OUTLET_CONFIG.id,
      items,
      OUTLET_CONFIG.reservationTtlMinutes,
      timeUsed,
      businessDate,
      stockMovements,
      stockReservations,
      manualOverrides,
      menuItems
    );

    if (!resResult.ok) {
      return { ok: false, error: resResult.errorReason || 'Menu habis.' };
    }

    // 2. Build Order & Bill
    const newOrderItems: OrderItem[] = calc.orderItems.map((oi, idx) => ({
      id: `OI-${orderId}-${idx + 1}`,
      orderId,
      menuItemId: oi.menuItemId,
      name: oi.name,
      qty: oi.qty,
      unitPrice: oi.unitPrice,
      lineTotal: oi.lineTotal,
      note: oi.note,
    }));

    const newOrder: Order = {
      id: orderId,
      billId,
      outletId: OUTLET_CONFIG.id,
      source,
      tableId,
      customerName,
      status: 'awaiting_payment',
      businessDate,
      note,
      items: newOrderItems,
      total: calc.total,
      createdAt: timeUsed,
    };

    const newBill: Bill = {
      id: billId,
      orderId,
      outletId: OUTLET_CONFIG.id,
      tableId,
      paymentTiming: 'pay_first',
      status: 'awaiting_payment',
      subtotal: calc.subtotal,
      discount: calc.discount,
      taxService: calc.taxService,
      total: calc.total,
      createdAt: timeUsed,
    };

    if (resResult.newReservations) {
      setStockReservations((prev) => [...prev, ...resResult.newReservations!]);
    }

    setOrders((prev) => [newOrder, ...prev]);
    setBills((prev) => [newBill, ...prev]);

    return { ok: true, orderId };
  };

  // Confirm ManualQris Payment
  const confirmManualQris = ({
    billId,
    verifiedBy,
    note,
    customTime,
  }: {
    billId: string;
    verifiedBy: string;
    note?: string;
    customTime?: string;
  }): { ok: boolean; error?: string } => {
    const timeUsed = customTime || currentTime;
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return { ok: false, error: 'Bill tidak ditemukan.' };

    if (bill.status === 'paid') {
      return { ok: true }; // Idempotent: already paid
    }

    const order = orders.find((o) => o.billId === billId);
    if (!order) return { ok: false, error: 'Order tidak ditemukan.' };

    // Idempotency check: don't create duplicate payment
    const existingPayment = payments.find((p) => p.billId === billId && p.status === 'succeeded');
    if (existingPayment) {
      return { ok: true };
    }

    // 1. Commit reservations to sale movements (idempotent)
    const orderReservations = stockReservations.filter(
      (r) => r.orderId === order.id && r.status === 'active'
    );

    const newSales: StockMovement[] = [];
    for (const res of orderReservations) {
      const idempotencyKey = `demo-sale-${order.id.toLowerCase()}-${res.stockItemId.toLowerCase().replace('-', '')}`;
      // Prevent duplicate movement if already exists
      const duplicateMovement = stockMovements.some((m) => m.idempotencyKey === idempotencyKey);
      if (!duplicateMovement) {
        newSales.push({
          id: `MV-${Date.now().toString().slice(-4)}-${res.stockItemId}`,
          outletId: OUTLET_CONFIG.id,
          stockItemId: res.stockItemId,
          businessDate,
          type: 'sale',
          qty: -Math.abs(res.qty),
          reason: `Penjualan ${order.id}`,
          orderId: order.id,
          idempotencyKey,
          createdBy: verifiedBy,
          createdAt: timeUsed,
        });
      }
    }

    // Update reservation status to committed
    setStockReservations((prev) =>
      prev.map((r) => (r.orderId === order.id ? { ...r, status: 'committed' as const } : r))
    );

    if (newSales.length > 0) {
      setStockMovements((prev) => [...prev, ...newSales]);
    }

    // 2. Create Payment record
    const paymentId = `PAY-${order.id}`;
    const newPayment: Payment = {
      id: paymentId,
      billId,
      orderId: order.id,
      provider: 'manual_qris',
      status: 'succeeded',
      amount: bill.total,
      idempotencyKey: `qris-${billId}-${timeUsed}`,
      verifiedBy,
      verifiedAt: timeUsed,
      providerRef: note || 'Mutasi BCA / QRIS Merchant',
    };

    setPayments((prev) => [newPayment, ...prev]);

    // 3. Update Bill and Order status to paid, trigger Kitchen Gate
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, status: 'paid' as const } : b))
    );

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'paid' as const,
              paidAt: timeUsed,
              kitchenReleasedAt: timeUsed, // Released to kitchen upon payment!
            }
          : o
      )
    );

    logAudit(
      'confirm_payment',
      'payment',
      paymentId,
      verifiedBy,
      { status: 'awaiting_payment' },
      { status: 'paid', amount: bill.total },
      timeUsed
    );

    return { ok: true };
  };

  // Trigger SandboxGateway Webhook (with duplicate webhook idempotency test!)
  const triggerSandboxWebhook = ({
    billId,
    isDuplicateTest = false,
    customTime,
  }: {
    billId: string;
    isDuplicateTest?: boolean;
    customTime?: string;
  }): { ok: boolean; error?: string; message: string } => {
    const timeUsed = customTime || currentTime;
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return { ok: false, error: 'Bill tidak ditemukan.', message: 'Bill tidak ditemukan.' };

    const order = orders.find((o) => o.billId === billId);
    if (!order) return { ok: false, error: 'Order tidak ditemukan.', message: 'Order tidak ditemukan.' };

    // Idempotency check for payment
    const existingPayment = payments.find(
      (p) => p.billId === billId && p.provider === 'sandbox' && p.status === 'succeeded'
    );

    if (existingPayment) {
      // Idempotency: Webhook already processed!
      logAudit(
        'webhook_received',
        'payment',
        existingPayment.id,
        'sandbox_webhook_gateway',
        { attempt: isDuplicateTest ? 'duplicate_call' : 'retry' },
        { result: 'ignored_idempotent_duplicate' },
        timeUsed
      );
      return {
        ok: true,
        message: 'Idempotensi Lolos: Webhook kedua diterima namun diabaikan. Tidak ada payment ganda dan tidak ada pengurangan stok ganda!',
      };
    }

    // First time receiving webhook
    const orderReservations = stockReservations.filter(
      (r) => r.orderId === order.id && r.status === 'active'
    );

    const newSales: StockMovement[] = [];
    for (const res of orderReservations) {
      const idempotencyKey = `demo-sale-${order.id.toLowerCase()}-${res.stockItemId.toLowerCase().replace('-', '')}`;
      newSales.push({
        id: `MV-${Date.now().toString().slice(-4)}-${res.stockItemId}`,
        outletId: OUTLET_CONFIG.id,
        stockItemId: res.stockItemId,
        businessDate,
        type: 'sale',
        qty: -Math.abs(res.qty),
        reason: `Penjualan ${order.id} (SandboxGateway)`,
        orderId: order.id,
        idempotencyKey,
        createdBy: 'sandbox_webhook_gateway',
        createdAt: timeUsed,
      });
    }

    setStockReservations((prev) =>
      prev.map((r) => (r.orderId === order.id ? { ...r, status: 'committed' as const } : r))
    );

    if (newSales.length > 0) {
      setStockMovements((prev) => [...prev, ...newSales]);
    }

    const paymentId = `PAY-SANDBOX-${order.id}`;
    const newPayment: Payment = {
      id: paymentId,
      billId,
      orderId: order.id,
      provider: 'sandbox',
      status: 'succeeded',
      amount: bill.total,
      idempotencyKey: `sandbox-wh-${order.id}`,
      verifiedBy: 'sandbox_webhook_gateway',
      verifiedAt: timeUsed,
      providerRef: `WH-REF-${Date.now().toString().slice(-6)}`,
    };

    setPayments((prev) => [newPayment, ...prev]);

    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, status: 'paid' as const } : b))
    );

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'paid' as const,
              paidAt: timeUsed,
              kitchenReleasedAt: timeUsed,
            }
          : o
      )
    );

    logAudit(
      'webhook_received',
      'payment',
      paymentId,
      'sandbox_webhook_gateway',
      { status: 'awaiting_payment' },
      { status: 'paid', amount: bill.total },
      timeUsed
    );

    return {
      ok: true,
      message: 'Pembayaran SandboxGateway terkonfirmasi via webhook. Tiket dapur terlepas.',
    };
  };

  // Cancel order before payment
  const cancelOrderBeforePayment = ({
    orderId,
    actorId,
    reason,
  }: {
    orderId: string;
    actorId: string;
    reason: string;
  }) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: 'Pesanan tidak ditemukan.' };

    if (order.status === 'paid') {
      return {
        ok: false,
        error: 'Pesanan sudah dibayar tidak bisa dibatalkan lewat fitur ini; harus lewat Void/Refund.',
      };
    }

    // Release active reservations
    setStockReservations((prev) =>
      prev.map((r) => (r.orderId === orderId && r.status === 'active' ? { ...r, status: 'released' as const } : r))
    );

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o))
    );

    setBills((prev) =>
      prev.map((b) => (b.orderId === orderId ? { ...b, status: 'void' as const } : b))
    );

    logAudit('cancel_order', 'order', orderId, actorId, { status: order.status }, { status: 'cancelled', reason }, currentTime);

    return { ok: true };
  };

  // Void Paid Order (M3) with Owner PIN authorization
  const voidPaidOrder = ({
    orderId,
    reason,
    pin,
    authorizedBy,
    customTime,
  }: {
    orderId: string;
    reason: string;
    pin: string;
    authorizedBy: string;
    customTime?: string;
  }) => {
    const timeUsed = customTime || currentTime;

    if (pin !== OUTLET_CONFIG.ownerPin) {
      return { ok: false, error: 'PIN Otorisasi Pemilik salah! Butuh persetujuan pemilik untuk void pesanan lunas.' };
    }

    if (!reason || reason.trim() === '') {
      return { ok: false, error: 'Alasan pembatalan (void) wajib diisi!' };
    }

    const order = orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: 'Pesanan tidak ditemukan.' };

    if (order.status === 'void') {
      return { ok: false, error: 'Pesanan ini sudah dibatalkan (void) sebelumnya.' };
    }

    // Check sales movements of this order
    const salesMovements = stockMovements.filter(
      (m) => m.orderId === orderId && m.type === 'sale'
    );

    const reversalMovements: StockMovement[] = [];
    for (const sale of salesMovements) {
      const idempotencyKey = `demo-rev-${order.id.toLowerCase()}-${sale.stockItemId.toLowerCase().replace('-', '')}`;
      // Prevent duplicate reversal
      const alreadyReversed = stockMovements.some((m) => m.idempotencyKey === idempotencyKey);
      if (!alreadyReversed) {
        reversalMovements.push({
          id: `MV-REV-${Date.now().toString().slice(-4)}-${sale.stockItemId}`,
          outletId: OUTLET_CONFIG.id,
          stockItemId: sale.stockItemId,
          businessDate,
          type: 'reversal',
          qty: Math.abs(sale.qty), // Positive reversal
          reason: `Pembalikan penjualan void order ${order.id}: ${reason}`,
          orderId: order.id,
          idempotencyKey,
          createdBy: authorizedBy,
          createdAt: timeUsed,
        });
      }
    }

    if (reversalMovements.length > 0) {
      setStockMovements((prev) => [...prev, ...reversalMovements]);
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'void' as const, voidAt: timeUsed } : o))
    );

    setBills((prev) =>
      prev.map((b) => (b.orderId === orderId ? { ...b, status: 'void' as const } : b))
    );

    logAudit(
      'void_order',
      'order',
      orderId,
      authorizedBy,
      { status: order.status, total: order.total },
      { status: 'void', reason, pinVerified: true },
      timeUsed
    );

    return { ok: true };
  };

  // Reset to initial empty state before S1
  const resetToInitialState = () => {
    setOrders([]);
    setBills([]);
    setPayments([]);
    setStockMovements([]);
    setStockReservations([]);
    setManualOverrides([]);
    setAuditLogs([]);
    setCurrentTime('07:30');
    setActiveScenarioStep(0);
  };

  // Run specific scenario step S1 to S11
  const runScenarioStep = (stepNumber: number): { ok: boolean; message: string } => {
    switch (stepNumber) {
      case 1: {
        // S1: 07:30 Pemilik isi stok pagi 6 menu
        setCurrentTime('07:30');
        const res = setDailyStock(MORNING_OPENING_STOCK, 'pemilik_warung');
        setActiveScenarioStep(1);
        return {
          ok: true,
          message: 'S1 (07:30): 6 movement opening atomik tersimpan. Menu terlacak tampil tersedia di kasir & customer.',
        };
      }
      case 2: {
        // S2: 10:05 ORD-001 (QR M01): Gado-gado ×3, Es Jeruk ×3 = Rp60.000. Bayar 10:08
        setCurrentTime('10:05');
        const ord1 = createOrder({
          source: 'customer_qr',
          tableId: 'M01',
          items: [
            { menuItemId: 'MN-06', qty: 3 }, // Gado-gado
            { menuItemId: 'MN-09', qty: 3 }, // Es Jeruk
          ],
          customTime: '10:05',
        });
        if (ord1.orderId) {
          // Immediately simulate payment at 10:08
          setCurrentTime('10:08');
          confirmManualQris({
            billId: `BILL-001`,
            verifiedBy: 'kasir_demo',
            note: 'Mutasi BCA Masuk Rp60.000',
            customTime: '10:08',
          });
        }
        setActiveScenarioStep(2);
        return {
          ok: true,
          message: 'S2 (10:05-10:08): ORD-001 dibuat & dibayar ManualQris Rp60.000. Stok Gado-gado 8 -> 5, tiket dapur terlepas.',
        };
      }
      case 3: {
        // S3: 10:40 ORD-002 (Walk-in takeaway): Gado-gado ×4, Kopi Hitam ×1 = Rp61.000. Bayar 10:43
        setCurrentTime('10:40');
        const ord2 = createOrder({
          source: 'walk_in',
          tableId: null,
          customerName: 'Bpk. Hendra (Takeaway)',
          items: [
            { menuItemId: 'MN-06', qty: 4 }, // Gado-gado
            { menuItemId: 'MN-10', qty: 1 }, // Kopi Hitam
          ],
          customTime: '10:40',
        });
        if (ord2.orderId) {
          setCurrentTime('10:43');
          confirmManualQris({
            billId: `BILL-002`,
            verifiedBy: 'kasir_demo',
            note: 'QRIS Statis Masuk Rp61.000',
            customTime: '10:43',
          });
        }
        setActiveScenarioStep(3);
        return {
          ok: true,
          message: 'S3 (10:40-10:43): ORD-002 walk-in dibuat & dibayar Rp61.000. Stok Gado-gado tinggal 1!',
        };
      }
      case 4: {
        // S4: 11:15 ORD-003 (QR M02): Ayam Goreng ×2, Es Teh ×1 = Rp40.000. Webhook ganda 11:18
        setCurrentTime('11:15');
        const ord3 = createOrder({
          source: 'customer_qr',
          tableId: 'M02',
          items: [
            { menuItemId: 'MN-01', qty: 2 }, // Ayam Goreng
            { menuItemId: 'MN-08', qty: 1 }, // Es Teh
          ],
          customTime: '11:15',
        });
        if (ord3.orderId) {
          setCurrentTime('11:18');
          // Webhook 1st delivery
          triggerSandboxWebhook({
            billId: 'BILL-003',
            isDuplicateTest: false,
            customTime: '11:18',
          });
          // Webhook 2nd delivery (Simulate duplicate network delivery)
          triggerSandboxWebhook({
            billId: 'BILL-003',
            isDuplicateTest: true,
            customTime: '11:18',
          });
        }
        setActiveScenarioStep(4);
        return {
          ok: true,
          message: 'S4 (11:15-11:18): ORD-003 diproses via SandboxGateway. Webhook dikirim 2x dan lolos uji idempotensi (1 payment, 1 sale movement).',
        };
      }
      case 5: {
        // S5: 11:42:10 ORD-004 (M03) & Permintaan B (M04) balapan memesan Gado-gado ×1 (tersisa 1 porsi!)
        setCurrentTime('11:42:10');
        // ORD-004 arrives at 11:42:10.120
        const ord4 = createOrder({
          source: 'customer_qr',
          tableId: 'M03',
          items: [{ menuItemId: 'MN-06', qty: 1 }],
          customTime: '11:42:10',
        });

        // Request B arrives at 11:42:10.135 (15 ms later)
        const reqB = createOrder({
          source: 'customer_qr',
          tableId: 'M04',
          items: [{ menuItemId: 'MN-06', qty: 1 }],
          customTime: '11:42:10',
        });

        setActiveScenarioStep(5);
        return {
          ok: true,
          message: `S5 (11:42:10 Race Condition Demo): ORD-004 berhasil mereservasi 1 porsi terakhir. Permintaan B ditolak server (${reqB.error}). Gado-gado HABIS di semua layar!`,
        };
      }
      case 6: {
        // S6: 11:52:10 ORD-004 tidak dibayar, TTL 10 menit habis -> reservasi expired!
        setCurrentTime('11:52:10');
        // Manually trigger expiration of ORD-004 reservation
        setStockReservations((prev) =>
          prev.map((r) =>
            r.orderId === 'ORD-004' && r.status === 'active'
              ? { ...r, status: 'expired' as const }
              : r
          )
        );
        setOrders((prev) =>
          prev.map((o) =>
            o.id === 'ORD-004' ? { ...o, status: 'expired' as const, expiredAt: '11:52:10' } : o
          )
        );
        logAudit('ttl_expired', 'order', 'ORD-004', 'system_ttl_worker', { status: 'awaiting_payment' }, { status: 'expired', stockRestored: 1 }, '11:52:10');
        setActiveScenarioStep(6);
        return {
          ok: true,
          message: 'S6 (11:52:10 TTL Habis): Reservasi RS-004 kedaluwarsa. Gado-gado kembali tersedia 1 porsi (status AVAILABLE kembali).',
        };
      }
      case 7: {
        // S7: 11:55 ORD-005 (QR M04): Gado-gado ×1 = Rp14.000. Bayar 11:57
        setCurrentTime('11:55');
        const ord5 = createOrder({
          source: 'customer_qr',
          tableId: 'M04',
          items: [{ menuItemId: 'MN-06', qty: 1 }],
          customTime: '11:55',
        });
        if (ord5.orderId) {
          setCurrentTime('11:57');
          confirmManualQris({
            billId: 'BILL-005',
            verifiedBy: 'kasir_demo',
            note: 'ManualQris Rp14.000',
            customTime: '11:57',
          });
        }
        setActiveScenarioStep(7);
        return {
          ok: true,
          message: 'S7 (11:55-11:57): ORD-005 memesan porsi Gado-gado yang baru kembali dan membayar. Sisa Gado-gado = 0 dan HABIS permanen hari ini.',
        };
      }
      case 8: {
        // S8: 12:10 ORD-006 (QR M05): Soto ×1, Pecel ×1 = Rp28.000. Bayar 12:13
        setCurrentTime('12:10');
        const ord6 = createOrder({
          source: 'customer_qr',
          tableId: 'M05',
          items: [
            { menuItemId: 'MN-03', qty: 1 }, // Soto Ayam
            { menuItemId: 'MN-04', qty: 1 }, // Nasi Pecel
          ],
          customTime: '12:10',
        });
        if (ord6.orderId) {
          setCurrentTime('12:13');
          confirmManualQris({
            billId: 'BILL-006',
            verifiedBy: 'kasir_demo',
            note: 'ManualQris Rp28.000',
            customTime: '12:13',
          });
        }
        setActiveScenarioStep(8);
        return {
          ok: true,
          message: 'S8 (12:10-12:13): ORD-006 (Soto + Pecel) dibayar Rp28.000. Dua movement sale tercatat di ledger.',
        };
      }
      case 9: {
        // S9: 12:20 Kasir toggle HABIS manual Nasi Rawon (stok tercatat 15)
        setCurrentTime('12:20');
        toggleManualSoldOut('MN-02', 'kasir_demo');
        setActiveScenarioStep(9);
        return {
          ok: true,
          message: 'S9 (12:20): Kasir mengaktifkan toggle HABIS manual untuk Nasi Rawon. Status berubah HABIS di 3 layar walau stok fisik masih 15.',
        };
      }
      case 10: {
        // S10: 12:21 Permintaan API langsung memesan Rawon -> Ditolak server
        setCurrentTime('12:21');
        const attempt = createOrder({
          source: 'customer_qr',
          tableId: 'M01',
          items: [{ menuItemId: 'MN-02', qty: 1 }],
          customTime: '12:21',
        });
        setActiveScenarioStep(10);
        return {
          ok: true,
          message: `S10 (12:21 Uji Proteksi Server): Permintaan order langsung ke menu Rawon berhasil ditolak server (${attempt.error}) sesuai FR-21.`,
        };
      }
      case 11: {
        // S11: 12:30 Void ORD-006 dengan otorisasi pemilik PIN 8888
        setCurrentTime('12:30');
        const resVoid = voidPaidOrder({
          orderId: 'ORD-006',
          reason: 'Pelanggan salah pesan dan kasir belum masak',
          pin: '8888',
          authorizedBy: 'pemilik_warung',
          customTime: '12:30',
        });
        setActiveScenarioStep(11);
        return {
          ok: resVoid.ok,
          message: `S11 (12:30 Void dengan Otorisasi): ORD-006 di-void. 2 movement reversal (+1 Soto, +1 Pecel) tercatat di ledger, omzet terkoreksi dari Rp203.000 menjadi Rp175.000.`,
        };
      }
      default:
        return { ok: false, message: 'Langkah skenario tidak valid.' };
    }
  };

  // Run all 11 scenarios sequentially
  const runAllScenarios = () => {
    resetToInitialState();
    for (let i = 1; i <= 11; i++) {
      runScenarioStep(i);
    }
  };

  // Load complete pre-calculated state of Lampiran A
  const loadFullLampiranAData = () => {
    runAllScenarios();
  };

  // Dedicated Seed Data loader function
  const loadSeedData = () => {
    const seed = getSeedInitialState();
    setOrders(seed.orders);
    setBills(seed.bills);
    setPayments(seed.payments);
    setStockMovements(seed.stockMovements);
    setStockReservations(seed.stockReservations);
    setManualOverrides([]);
    setAuditLogs(seed.auditLogs);
    setCurrentTime(seed.currentTime);
    setActiveScenarioStep(4);
  };

  return (
    <AppContext.Provider
      value={{
        menuItems,
        stockItems,
        tables,
        businessDate,
        outletConfig: OUTLET_CONFIG,
        orders,
        bills,
        payments,
        stockMovements,
        stockReservations,
        manualOverrides,
        auditLogs,
        currentTime,
        setCurrentTime,
        kitchenFlag,
        setKitchenFlag,
        isReconnecting,
        setIsReconnecting,
        activeScenarioStep,
        customerTable,
        setCustomerTable,
        getAvailability,
        setDailyStock,
        toggleManualSoldOut,
        recordWaste,
        recordAdjustment,
        createOrder,
        confirmManualQris,
        triggerSandboxWebhook,
        cancelOrderBeforePayment,
        voidPaidOrder,
        runScenarioStep,
        runAllScenarios,
        resetToInitialState,
        loadFullLampiranAData,
        loadSeedData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
