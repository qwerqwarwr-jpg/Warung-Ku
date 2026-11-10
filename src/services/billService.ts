import {
  Bill,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  PaymentProvider,
  StockMovement,
  StockReservation,
} from '../types';

export class BillService {
  /**
   * Single server-side calculation for line items, subtotal, and total.
   * Integer Rupiah only.
   */
  static calculateTotals(
    items: { menuItemId: string; qty: number; note?: string }[],
    menuItems: MenuItem[]
  ): {
    subtotal: number;
    discount: number;
    taxService: number;
    total: number;
    orderItems: {
      menuItemId: string;
      name: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
      note?: string;
    }[];
  } {
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const menu = menuItems.find((m) => m.id === item.menuItemId);
      const unitPrice = menu ? Math.round(menu.price) : 0;
      const lineTotal = unitPrice * item.qty;
      subtotal += lineTotal;
      return {
        menuItemId: item.menuItemId,
        name: menu ? menu.name : 'Unknown Item',
        qty: item.qty,
        unitPrice,
        lineTotal,
        note: item.note,
      };
    });

    const discount = 0; // MVP default
    const taxService = 0; // MVP default
    const total = Math.round(subtotal - discount + taxService);

    return {
      subtotal,
      discount,
      taxService,
      total,
      orderItems,
    };
  }

  /**
   * Kitchen Gate rule FR-12:
   * Order dilepas ke dapur HANYA JIKA payment_timing = pay_after ATAU bill.status = paid.
   */
  static shouldReleaseToKitchen(paymentTiming: string, billStatus: string): boolean {
    if (paymentTiming === 'pay_after') return true;
    if (billStatus === 'paid') return true;
    return false;
  }
}
