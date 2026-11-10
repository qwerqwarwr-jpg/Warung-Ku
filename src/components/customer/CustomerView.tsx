import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BillService } from '../../services/billService';
import {
  ShoppingBag,
  Plus,
  Minus,
  QrCode,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  CreditCard,
} from 'lucide-react';

export const CustomerView: React.FC = () => {
  const {
    menuItems,
    tables,
    customerTable,
    setCustomerTable,
    getAvailability,
    createOrder,
    orders,
    bills,
    confirmManualQris,
    cancelOrderBeforePayment,
  } = useApp();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Makanan' | 'Minuman' | 'Camilan'>('Semua');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [successOrderMsg, setSuccessOrderMsg] = useState<string | null>(null);

  // Find latest active order for this table
  const currentTableOrders = orders.filter((o) => o.tableId === customerTable);
  const activeOrder = currentTableOrders[0];
  const activeBill = activeOrder ? bills.find((b) => b.orderId === activeOrder.id) : null;

  const handleQtyChange = (menuId: string, delta: number) => {
    setOrderError(null);
    const current = cart[menuId] || 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
      const copy = { ...cart };
      delete copy[menuId];
      setCart(copy);
    } else {
      const avail = getAvailability(menuId);
      if (avail.breakdown.isTracked && next > avail.tersedia) {
        setOrderError(`Maksimal porsi tersedia untuk ${avail.menuItemId}: ${avail.tersedia}`);
        return;
      }
      setCart({ ...cart, [menuId]: next });
    }
  };

  const cartList = Object.entries(cart).map(([menuItemId, qty]) => ({
    menuItemId,
    qty,
  }));

  const calc = BillService.calculateTotals(cartList, menuItems);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    setSuccessOrderMsg(null);

    if (cartList.length === 0) {
      setOrderError('Pilih menu terlebih dahulu.');
      return;
    }

    const res = createOrder({
      source: 'customer_qr',
      tableId: customerTable,
      customerName: `Pelanggan ${customerTable}`,
      items: cartList,
    });

    if (!res.ok) {
      setOrderError(res.error || 'Pesanan ditolak server.');
    } else {
      setSuccessOrderMsg(`Pesanan ${res.orderId} berhasil dibuat! Stok telah direservasi 10 menit.`);
      setCart({});
    }
  };

  const handleSimulatePayment = () => {
    if (!activeBill) return;
    confirmManualQris({
      billId: activeBill.id,
      verifiedBy: 'kasir_demo',
      note: 'Pembayaran QRIS meja pelanggan',
    });
  };

  const handleCancelActiveOrder = () => {
    if (!activeOrder) return;
    cancelOrderBeforePayment({
      orderId: activeOrder.id,
      actorId: `customer_${customerTable}`,
      reason: 'Dibatalkan oleh pelanggan di meja',
    });
  };

  const filteredMenu = menuItems.filter((m) => {
    if (activeCategory === 'Semua') return true;
    return m.category === activeCategory;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Header & Table Selector (Scanned QR Simulation) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Simulasi Scan QR Meja
          </span>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">Menu & Pemesanan Mandiri Meja</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">Pilih Meja:</span>
          <div className="flex gap-1 flex-wrap">
            {tables.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setCustomerTable(t);
                  setCart({});
                  setOrderError(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  customerTable === t
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                aria-label={`Pilih meja ${t}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {orderError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{orderError}</span>
        </div>
      )}

      {successOrderMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successOrderMsg}</span>
        </div>
      )}

      {/* Active Order Status on This Table */}
      {activeOrder && (
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-emerald-400">{activeOrder.id}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-xs text-slate-300">Meja {activeOrder.tableId}</span>
            </div>

            <div>
              {activeOrder.status === 'awaiting_payment' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500 text-slate-950 rounded-md inline-block">
                  Menunggu Pembayaran (TTL 10 Menit)
                </span>
              )}
              {activeOrder.status === 'paid' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-md inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Lunas · Sedang Dimasak
                </span>
              )}
              {activeOrder.status === 'expired' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-700 text-slate-300 rounded-md inline-block">
                  Waktu Bayar Habis (Kedaluwarsa)
                </span>
              )}
              {activeOrder.status === 'void' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-rose-500 text-white rounded-md inline-block">
                  Pesanan Di-Void / Dibatalkan
                </span>
              )}
            </div>
          </div>

          {/* Items summary */}
          <div className="text-xs text-slate-300 space-y-1 border-t border-slate-800 pt-2">
            {activeOrder.items.map((it) => (
              <div key={it.id} className="flex justify-between items-center gap-2">
                <span className="truncate">
                  {it.name} <span className="font-mono text-slate-400">×{it.qty}</span>
                </span>
                <span className="font-mono tabular-nums text-slate-200 shrink-0">
                  Rp{it.lineTotal.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center text-sm font-bold text-white pt-1.5 border-t border-slate-800">
              <span>Total Tagihan Server</span>
              <span className="font-mono tabular-nums text-emerald-400">
                Rp{activeOrder.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Actions for active order */}
          {activeOrder.status === 'awaiting_payment' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-1">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="leading-tight">Bayar di kasir atau konfirmasi QRIS untuk melepas ke dapur.</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelActiveOrder}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold min-h-[44px]"
                >
                  Batalkan Pesanan
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 min-h-[44px] flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Simulasi Bayar QRIS</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['Semua', 'Makanan', 'Minuman', 'Camilan'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border min-h-[44px] whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filteredMenu.map((item) => {
          const avail = getAvailability(item.id);
          const isSoldOut = avail.status === 'HABIS';
          const isManual = avail.alasan === 'HABIS_MANUAL';
          const count = cart[item.id] || 0;

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                isSoldOut
                  ? 'border-slate-200 bg-slate-50/70 opacity-60'
                  : count > 0
                  ? 'border-slate-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">{item.name}</h3>
                  <span className="text-xs font-mono font-bold text-slate-900 tabular-nums shrink-0">
                    Rp{item.price.toLocaleString('id-ID')}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                )}

                {/* Availability Badge */}
                <div className="pt-1">
                  {isSoldOut ? (
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-block">
                      Habis {isManual ? '(Habis Hari Ini)' : '(Stok 0)'}
                    </span>
                  ) : avail.breakdown.isTracked ? (
                    <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                      Tersedia: {avail.tersedia} porsi
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Tersedia</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end">
                {isSoldOut ? (
                  <span className="px-3.5 py-2 bg-slate-200 text-slate-400 text-xs font-semibold rounded-lg min-h-[44px] flex items-center">
                    Habis
                  </span>
                ) : count > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, -1)}
                      className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px]"
                      aria-label="Kurangi porsi"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs tabular-nums">{count}</span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, 1)}
                      className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 min-h-[44px] min-w-[44px]"
                      aria-label="Tambah porsi"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item.id, 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors min-h-[44px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar (with mobile safe-area inset) */}
      {cartList.length > 0 && (
        <div className="sticky bottom-4 z-30 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Keranjang Meja {customerTable} ({cartList.length} Menu)
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tabular-nums">
              Rp{calc.total.toLocaleString('id-ID')}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 min-h-[44px] transition-colors shadow-md w-full sm:w-auto"
          >
            <span>Pesan Sekarang (Reservasi 10 Mnt)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
