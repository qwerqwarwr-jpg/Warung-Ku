import {
  AvailabilityResult,
  MenuItem,
  MenuAvailabilityOverride,
  MovementType,
  StockMovement,
  StockReservation,
} from '../types';

export class StockService {
  /**
   * One single source of truth for menu item availability across Kasir, Customer, and Logistik.
   * Invarian: tersedia = stok awal + penyesuaian - terjual - terbuang - reservasi aktif
   */
  static getAvailability(
    menuItemId: string,
    businessDate: string,
    movements: StockMovement[],
    reservations: StockReservation[],
    overrides: MenuAvailabilityOverride[],
    menuItems: MenuItem[]
  ): AvailabilityResult {
    const item = menuItems.find((m) => m.id === menuItemId);
    if (!item) {
      return {
        menuItemId,
        status: 'HABIS',
        tersedia: 0,
        alasan: 'HABIS_STOK',
        breakdown: {
          stokAwal: 0,
          terjual: 0,
          tertahan: 0,
          koreksi: 0,
          terbuang: 0,
          isManualSoldOut: false,
          isTracked: false,
        },
      };
    }

    const isManualSoldOut = !!overrides.find(
      (o) => o.menuItemId === menuItemId && o.isSoldOutManual
    );

    // If item is not tracked by portion ledger (e.g. Es Teh, Kopi Hitam, Tahu Tempe)
    if (!item.stockItemId) {
      if (isManualSoldOut) {
        return {
          menuItemId,
          status: 'HABIS',
          tersedia: 0,
          alasan: 'HABIS_MANUAL',
          breakdown: {
            stokAwal: 0,
            terjual: 0,
            tertahan: 0,
            koreksi: 0,
            terbuang: 0,
            isManualSoldOut: true,
            isTracked: false,
          },
        };
      }
      return {
        menuItemId,
        status: 'AVAILABLE',
        tersedia: 999, // unlimited untracked
        alasan: 'TIDAK_DILACAK',
        breakdown: {
          stokAwal: 0,
          terjual: 0,
          tertahan: 0,
          koreksi: 0,
          terbuang: 0,
          isManualSoldOut: false,
          isTracked: false,
        },
      };
    }

    const stockItemId = item.stockItemId;

    // Filter movements for this stock item and business date
    const itemMovements = movements.filter(
      (m) => m.stockItemId === stockItemId && m.businessDate === businessDate
    );

    let stokAwal = 0;
    let terjual = 0;
    let terbuang = 0;
    let koreksi = 0;

    for (const m of itemMovements) {
      switch (m.type) {
        case 'opening':
          stokAwal += m.qty;
          break;
        case 'sale':
          terjual += Math.abs(m.qty);
          break;
        case 'waste':
          terbuang += Math.abs(m.qty);
          break;
        case 'adjustment':
          koreksi += m.qty;
          break;
        case 'reversal':
          // Reversal adds back stock from voided sales
          koreksi += m.qty;
          break;
      }
    }

    // Active reservations for this item
    const activeReservations = reservations.filter(
      (r) => r.stockItemId === stockItemId && r.status === 'active'
    );
    const tertahan = activeReservations.reduce((sum, r) => sum + r.qty, 0);

    // Physical balance = awal + koreksi - terjual - terbuang
    const physicalBalance = stokAwal + koreksi - terjual - terbuang;
    // Available to order = physical balance - tertahan
    const rawTersedia = physicalBalance - tertahan;
    const tersedia = Math.max(0, rawTersedia);

    if (isManualSoldOut) {
      return {
        menuItemId,
        status: 'HABIS',
        tersedia: 0,
        alasan: 'HABIS_MANUAL',
        breakdown: {
          stokAwal,
          terjual,
          tertahan,
          koreksi,
          terbuang,
          isManualSoldOut: true,
          isTracked: true,
        },
      };
    }

    if (tersedia <= 0) {
      return {
        menuItemId,
        status: 'HABIS',
        tersedia: 0,
        alasan: 'HABIS_STOK',
        breakdown: {
          stokAwal,
          terjual,
          tertahan,
          koreksi,
          terbuang,
          isManualSoldOut: false,
          isTracked: true,
        },
      };
    }

    return {
      menuItemId,
      status: 'AVAILABLE',
      tersedia,
      alasan: 'TERSEDIA',
      breakdown: {
        stokAwal,
        terjual,
        tertahan,
        koreksi,
        terbuang,
        isManualSoldOut: false,
        isTracked: true,
      },
    };
  }

  /**
   * Atomic reservation check: all items must be available, otherwise entire order rejected!
   */
  static reserveForOrder(
    orderId: string,
    outletId: string,
    items: { menuItemId: string; qty: number }[],
    ttlMinutes: number,
    currentTime: string,
    businessDate: string,
    movements: StockMovement[],
    reservations: StockReservation[],
    overrides: MenuAvailabilityOverride[],
    menuItems: MenuItem[]
  ): {
    ok: boolean;
    ditolak?: string[];
    rejectedItemNames?: string[];
    newReservations?: StockReservation[];
    errorReason?: string;
  } {
    // 1. Group required qty by stock item
    const requiredStock: Record<string, { qty: number; menuItemIds: string[] }> = {};

    for (const item of items) {
      const menu = menuItems.find((m) => m.id === item.menuItemId);
      if (!menu) continue;

      // Check manual sold out directly
      const isManualSoldOut = overrides.some(
        (o) => o.menuItemId === item.menuItemId && o.isSoldOutManual
      );
      if (isManualSoldOut) {
        return {
          ok: false,
          ditolak: [item.menuItemId],
          rejectedItemNames: [menu.name],
          errorReason: `Menu habis: ${menu.name} (ditandai habis manual)`,
        };
      }

      if (menu.stockItemId) {
        if (!requiredStock[menu.stockItemId]) {
          requiredStock[menu.stockItemId] = { qty: 0, menuItemIds: [] };
        }
        requiredStock[menu.stockItemId].qty += item.qty;
        requiredStock[menu.stockItemId].menuItemIds.push(item.menuItemId);
      }
    }

    // 2. Validate availability for every tracked stock item
    const rejectedItemIds: string[] = [];
    const rejectedNames: string[] = [];

    for (const stockItemId in requiredStock) {
      const req = requiredStock[stockItemId];
      // Find a menuItem referencing this stockItemId
      const sampleMenuItem = menuItems.find((m) => m.stockItemId === stockItemId);
      if (!sampleMenuItem) continue;

      const avail = this.getAvailability(
        sampleMenuItem.id,
        businessDate,
        movements,
        reservations,
        overrides,
        menuItems
      );

      if (avail.status === 'HABIS' || avail.tersedia < req.qty) {
        rejectedItemIds.push(...req.menuItemIds);
        const name = sampleMenuItem.name;
        if (!rejectedNames.includes(name)) rejectedNames.push(name);
      }
    }

    if (rejectedItemIds.length > 0) {
      const reasonMsg =
        rejectedNames.length === 1
          ? `Pesanan ditolak karena menu habis: ${rejectedNames[0]}`
          : `Pesanan ditolak karena ada menu yang habis: ${rejectedNames.join(', ')}`;
      return {
        ok: false,
        ditolak: rejectedItemIds,
        rejectedItemNames: rejectedNames,
        errorReason: reasonMsg,
      };
    }

    // 3. Create reservation records
    const newReservations: StockReservation[] = [];
    const expiresAt = this.addMinutes(currentTime, ttlMinutes);

    for (const stockItemId in requiredStock) {
      newReservations.push({
        id: `RS-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
        outletId,
        orderId,
        stockItemId,
        qty: requiredStock[stockItemId].qty,
        status: 'active',
        createdAt: currentTime,
        expiresAt,
      });
    }

    return {
      ok: true,
      newReservations,
    };
  }

  /**
   * Helper to add minutes to HH:mm or HH:mm:ss format
   */
  static addMinutes(timeStr: string, minutesToAdd: number): string {
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    let mins = parseInt(parts[1], 10);
    let secs = parts[2] ? parts[2] : '00';

    mins += minutesToAdd;
    while (mins >= 60) {
      mins -= 60;
      hours = (hours + 1) % 24;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}:${secs}`;
  }
}
