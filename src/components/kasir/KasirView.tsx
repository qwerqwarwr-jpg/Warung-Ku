import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, Bill } from '../../types';
import { WalkInOrderModal } from './WalkInOrderModal';
import { PaymentModal } from './PaymentModal';
import { VoidModal } from './VoidModal';
import {
  Plus,
  CreditCard,
  Ban,
  ChefHat,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Flame,
} from 'lucide-react';

export const KasirView: React.FC = () => {
  const {
    orders,
    bills,
    kitchenFlag,
    setKitchenFlag,
    cancelOrderBeforePayment,
    menuItems,
    getAvailability,
    toggleManualSoldOut,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting_payment' | 'paid' | 'void'>('all');
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<{ order: Order; bill: Bill } | null>(null);
  const [selectedOrderForVoid, setSelectedOrderForVoid] = useState<Order | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  // Kitchen tickets (orders released to kitchen)
  const kitchenTickets = orders.filter((o) => o.kitchenReleasedAt && o.status === 'paid');

  const handleCancelBeforePayment = (orderId: string) => {
    setCancelError(null);
    const res = cancelOrderBeforePayment({
      orderId,
      actorId: 'kasir_demo',
      reason: 'Dibatalkan oleh kasir sebelum bayar',
    });
    if (!res.ok) {
      setCancelError(res.error || 'Gagal membatalkan pesanan.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Kasir Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Layar Kasir (/kasir)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pesanan masuk (QR meja & walk-in), verifikasi mutasi QRIS, dan lepas pesanan ke dapur.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Kitchen Flag Toggle */}
          <button
            type="button"
            onClick={() => setKitchenFlag(!kitchenFlag)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors min-h-[44px] ${
              kitchenFlag
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="Jika flag dapur mati, tiket dapur tampil di layar kasir ini."
          >
            <ChefHat className="w-4 h-4 shrink-0" />
            <span className="truncate">Layar Dapur Terpisah: {kitchenFlag ? 'Aktif' : 'Nonaktif'}</span>
          </button>

          {/* Create Walk-in Order Button */}
          <button
            type="button"
            onClick={() => setShowWalkInModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Order Walk-In (FR-4)</span>
          </button>
        </div>
      </div>

      {cancelError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{cancelError}</span>
        </div>
      )}

      {/* Main Grid: Orders & Kitchen/Availability Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Order & Bill Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Segmented Filter */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl min-w-max">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[40px] ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('awaiting_payment')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[40px] ${
                  statusFilter === 'awaiting_payment'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Menunggu Bayar ({orders.filter((o) => o.status === 'awaiting_payment').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[40px] ${
                  statusFilter === 'paid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lunas ({orders.filter((o) => o.status === 'paid').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('void')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[40px] ${
                  statusFilter === 'void'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Void / Batal ({orders.filter((o) => o.status === 'void' || o.status === 'cancelled').length})
              </button>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 rounded-2xl text-center space-y-2 bg-slate-50/50">
              <p className="text-sm font-semibold text-slate-700">
                Belum ada pesanan. Pesanan baru akan muncul di sini.
              </p>
              <p className="text-xs text-slate-400">
                Gunakan tombol &quot;Order Walk-In&quot; atau buka tab &quot;Customer QR&quot; untuk membuat pesanan baru.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const bill = bills.find((b) => b.orderId === order.id) || bills[0];
                const isAwaiting = order.status === 'awaiting_payment';
                const isPaid = order.status === 'paid';
                const isVoid = order.status === 'void' || order.status === 'cancelled';
                const isExpired = order.status === 'expired';

                return (
                  <div
                    key={order.id}
                    className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Top Row: Order ID, Source, Timing, Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
                        <span className="font-mono font-bold text-sm text-slate-900">{order.id}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-semibold text-slate-700">
                          {order.source === 'walk_in' ? 'Walk-in Kasir' : `QR Meja ${order.tableId}`}
                        </span>
                        {order.customerName && (
                          <span className="text-slate-500 truncate max-w-[150px]">({order.customerName})</span>
                        )}
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          {order.createdAt}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="text-xs font-medium">
                        {isAwaiting && (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            Menunggu Pembayaran
                          </span>
                        )}
                        {isPaid && (
                          <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Lunas ({order.paidAt})
                          </span>
                        )}
                        {isVoid && (
                          <span className="text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            {order.status === 'void' ? 'Void / Dibatalkan' : 'Dibatalkan Kasir'}
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            TTL Habis (Kedaluwarsa)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Items & Notes */}
                    <div className="text-xs text-slate-700 space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <div className="font-semibold text-slate-500 text-[10px] sm:text-[11px] uppercase tracking-wider mb-1">
                        Daftar Menu:
                      </div>
                      {order.items.map((oi) => (
                        <div key={oi.id} className="flex justify-between items-center gap-2">
                          <span className="truncate">
                            {oi.name} <span className="font-mono font-semibold">×{oi.qty}</span>
                            {oi.note && <span className="text-slate-400 italic ml-1.5">({oi.note})</span>}
                          </span>
                          <span className="font-mono tabular-nums text-slate-800 shrink-0">
                            Rp{oi.lineTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                      {order.note && (
                        <div className="pt-1 text-slate-500 text-[11px] border-t border-slate-200/60 mt-1">
                          Catatan: {order.note}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Total & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                          Total Bill
                        </span>
                        <div className="text-base sm:text-lg font-bold font-mono text-slate-900 tabular-nums">
                          Rp{order.total.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Awaiting Payment Actions */}
                        {isAwaiting && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCancelBeforePayment(order.id)}
                              className="flex-1 sm:flex-none px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold min-h-[44px] transition-colors"
                            >
                              Batal Sebelum Bayar (FR-14)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForPayment({ order, bill })}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 min-h-[44px] transition-colors shadow-xs"
                            >
                              <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Konfirmasi Bayar</span>
                            </button>
                          </>
                        )}

                        {/* Paid Actions: Void / Refund (FR-23) */}
                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForVoid(order)}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold min-h-[44px] transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5 shrink-0" />
                            <span>Void / Refund (M3)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Kitchen Tickets & Quick Sold-Out Toggle */}
        <div className="space-y-6">
          {/* Kitchen Tickets in Kasir (when kitchenFlag = false) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Tiket Dapur di Kasir
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {kitchenFlag ? 'Flag dapur terpisah aktif' : 'Flag nonaktif: tiket tampil di sini (FR-13)'}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-800 shrink-0">
                {kitchenTickets.length} Tiket
              </span>
            </div>

            {kitchenTickets.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada tiket dapur yang dilepas. Order akan muncul setelah status lunas.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 sm:max-h-80 overflow-y-auto">
                {kitchenTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-950">
                      <span>{ticket.id} ({ticket.source === 'walk_in' ? 'Walk-in' : `Meja ${ticket.tableId}`})</span>
                      <span className="font-mono text-[11px] text-amber-700">{ticket.paidAt}</span>
                    </div>
                    <ul className="space-y-1 text-slate-800">
                      {ticket.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>
                            {item.name} <span className="font-mono font-bold">×{item.qty}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Menu Availability & Manual HABIS Toggle */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Toggle HABIS Manual (FR-20)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Satu Sumber</span>
            </div>

            <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto">
              {menuItems.map((m) => {
                const avail = getAvailability(m.id);
                const isSoldOut = avail.status === 'HABIS';
                const isManual = avail.alasan === 'HABIS_MANUAL';

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 text-xs gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{m.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        {avail.breakdown.isTracked ? (
                          <span className="font-mono">Tersedia: {avail.tersedia}</span>
                        ) : (
                          <span>Tidak dilacak</span>
                        )}
                        {isSoldOut && (
                          <span className="text-rose-600 font-semibold">
                            (HABIS {isManual ? 'Manual' : 'Stok'})
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleManualSoldOut(m.id, 'kasir_demo')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold min-h-[44px] flex items-center gap-1 transition-colors shrink-0 ${
                        isManual
                          ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={isManual ? 'Klik untuk cabut status HABIS manual' : 'Klik untuk tandai HABIS secara manual'}
                    >
                      {isManual ? <ToggleRight className="w-4 h-4 text-rose-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                      <span className="text-[11px]">{isManual ? 'Manual' : 'Otomatis'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWalkInModal && <WalkInOrderModal onClose={() => setShowWalkInModal(false)} />}
      {selectedOrderForPayment && (
        <PaymentModal
          order={selectedOrderForPayment.order}
          bill={selectedOrderForPayment.bill}
          onClose={() => setSelectedOrderForPayment(null)}
        />
      )}
      {selectedOrderForVoid && (
        <VoidModal
          order={selectedOrderForVoid}
          onClose={() => setSelectedOrderForVoid(null)}
        />
      )}
    </div>
  );
};
