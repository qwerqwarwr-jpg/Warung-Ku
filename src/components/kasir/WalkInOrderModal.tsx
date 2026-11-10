import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BillService } from '../../services/billService';
import { X, Plus, Minus, ShoppingBag, AlertCircle } from 'lucide-react';

interface WalkInOrderModalProps {
  onClose: () => void;
}

export const WalkInOrderModal: React.FC<WalkInOrderModalProps> = ({ onClose }) => {
  const { menuItems, tables, getAvailability, createOrder } = useApp();

  const [customerType, setCustomerType] = useState<'takeaway' | 'dine_in'>('takeaway');
  const [selectedTable, setSelectedTable] = useState<string>('M01');
  const [customerName, setCustomerName] = useState<string>('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [orderNote, setOrderNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQtyChange = (menuId: string, delta: number) => {
    setErrorMessage(null);
    const current = cart[menuId] || 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
      const copy = { ...cart };
      delete copy[menuId];
      setCart(copy);
    } else {
      const avail = getAvailability(menuId);
      if (avail.breakdown.isTracked && next > avail.tersedia) {
        setErrorMessage(`Maksimal porsi tersedia untuk ${avail.menuItemId}: ${avail.tersedia}`);
        return;
      }
      setCart({ ...cart, [menuId]: next });
    }
  };

  const cartItemsList = Object.entries(cart).map(([menuItemId, qty]) => ({
    menuItemId,
    qty,
    note: itemNotes[menuItemId],
  }));

  const calc = BillService.calculateTotals(cartItemsList, menuItems);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItemsList.length === 0) {
      setErrorMessage('Pilih minimal satu menu untuk membuat order.');
      return;
    }

    const tableId = customerType === 'dine_in' ? selectedTable : null;
    const finalName = customerName.trim()
      ? customerName.trim()
      : customerType === 'takeaway'
      ? 'Pelanggan Takeaway'
      : `Pelanggan Meja ${selectedTable}`;

    const res = createOrder({
      source: 'walk_in',
      tableId,
      customerName: finalName,
      items: cartItemsList,
      note: orderNote.trim() || undefined,
    });

    if (!res.ok) {
      setErrorMessage(res.error || 'Gagal membuat order walk-in.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Buat Order Walk-In Kasir</h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Pilih menu, varian, dan meja untuk pelanggan walk-in (FR-4 & FR-6).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer & Dining Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipe Layanan
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerType('takeaway')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border min-h-[44px] transition-colors ${
                    customerType === 'takeaway'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Bungkus (Takeaway)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('dine_in')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border min-h-[44px] transition-colors ${
                    customerType === 'dine_in'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Makan di Tempat
                </button>
              </div>
            </div>

            <div>
              {customerType === 'dine_in' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pilih Nomor Meja
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg bg-white min-h-[44px] text-slate-900 focus:outline-slate-900"
                  >
                    {tables.map((t) => (
                      <option key={t} value={t}>
                        Meja {t}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Pelanggan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Bpk. Hendra"
                    className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] text-slate-900 focus:outline-slate-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Menu Selection List with Live Availability */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Daftar Menu & Ketersediaan (Satu Sumber Kebenaran)
            </label>
            <div className="space-y-2 border border-slate-200 rounded-xl p-2 max-h-60 sm:max-h-72 overflow-y-auto">
              {menuItems.map((item) => {
                const avail = getAvailability(item.id);
                const isSoldOut = avail.status === 'HABIS';
                const count = cart[item.id] || 0;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      isSoldOut
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : count > 0
                        ? 'bg-slate-50 border-slate-900/30'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex-1 mr-2 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold text-slate-900 truncate">{item.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">[{item.id}]</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-mono tabular-nums font-semibold text-slate-800">
                          Rp{item.price.toLocaleString('id-ID')}
                        </span>
                        <span aria-hidden="true">·</span>
                        {isSoldOut ? (
                          <span className="text-rose-600 font-semibold text-[11px]">
                            Habis {avail.alasan === 'HABIS_MANUAL' ? '(Manual)' : ''}
                          </span>
                        ) : avail.breakdown.isTracked ? (
                          <span className="text-emerald-700 font-mono tabular-nums text-[11px]">
                            Sisa: {avail.tersedia}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Ada</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    {isSoldOut ? (
                      <span className="text-xs font-medium text-slate-400 px-2.5 py-1.5 bg-slate-200/60 rounded shrink-0">
                        Habis
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, -1)}
                          disabled={count === 0}
                          className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent min-h-[36px] min-w-[36px]"
                          aria-label="Kurangi kuantitas"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold tabular-nums">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, 1)}
                          className="w-8 h-8 rounded border border-slate-900 bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 min-h-[36px] min-w-[36px]"
                          aria-label="Tambah kuantitas"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Order (Opsional)
            </label>
            <input
              type="text"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Contoh: Sambal dipisah, es sedikit"
              className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] text-slate-900 focus:outline-slate-900"
            />
          </div>
        </form>

        {/* Footer with Server Total */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Total Dihitung Server
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-slate-900 tabular-nums">
              Rp{calc.total.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={cartItemsList.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 min-h-[44px]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Simpan Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
