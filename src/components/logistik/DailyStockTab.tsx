import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MORNING_OPENING_STOCK } from '../../data/seedData';
import {
  Save,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const DailyStockTab: React.FC = () => {
  const { menuItems, stockItems, setDailyStock, stockMovements } = useApp();

  const [stockInputs, setStockInputs] = useState<Record<string, number>>(MORNING_OPENING_STOCK);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Check if opening already filled today
  const existingOpening = stockMovements.filter((m) => m.type === 'opening');

  const handleInputChange = (stockItemId: string, val: string) => {
    setFeedback(null);
    const num = parseInt(val, 10);
    setStockInputs((prev) => ({
      ...prev,
      [stockItemId]: isNaN(num) ? 0 : Math.max(0, Math.min(9999, num)),
    }));
  };

  const handleQuickAdd = (stockItemId: string, amount: number) => {
    setFeedback(null);
    setStockInputs((prev) => ({
      ...prev,
      [stockItemId]: Math.max(0, Math.min(9999, (prev[stockItemId] || 0) + amount)),
    }));
  };

  const handleCopyYesterday = () => {
    setStockInputs({ ...MORNING_OPENING_STOCK });
    setIsCopied(true);
    setFeedback({
      text: 'Nilai stok awal kemarin berhasil disalin ke isian. Anda dapat menyesuaikannya sebelum menyimpan.',
      type: 'success',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = setDailyStock(stockInputs, 'pemilik_warung');
    if (res.ok) {
      setFeedback({ text: res.message, type: 'success' });
    } else {
      setFeedback({ text: 'Gagal menyimpan stok pagi.', type: 'error' });
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900">
              Isi Stok Pagi Menu Aktif (FR-1 & FR-3)
            </h2>
            <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold font-mono">
              Target T3: &lt;3 Menit
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Isi jumlah porsi siap jual di pagi hari. Menu tanpa stok otomatis tidak dilacak.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyYesterday}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 min-h-[44px] transition-colors shadow-xs"
          >
            <Copy className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{isCopied ? 'Tersalin!' : 'Salin Stok Kemarin (FR-2)'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{feedback.text}</span>
        </div>
      )}

      {existingOpening.length > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Stok pagi hari ini sudah pernah diisi ({existingOpening.length} menu tercatat).</span>
          </div>
          <span className="font-semibold text-indigo-700 text-[11px] sm:text-xs">
            Simpan ulang akan menulis movement koreksi (FR-4)
          </span>
        </div>
      )}

      {/* Stock Input Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Mobile View (< sm): Adaptive Card List */}
        <div className="sm:hidden space-y-3">
          {menuItems.map((menu) => {
            const stockItem = stockItems.find((s) => s.id === menu.stockItemId);
            const isTracked = !!stockItem;
            const currentVal = stockItem ? stockInputs[stockItem.id] ?? 0 : null;

            return (
              <div
                key={menu.id}
                className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{menu.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {menu.id} {stockItem ? `→ ${stockItem.id}` : '· Tidak Dilacak'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-xs text-slate-900">
                      Rp{menu.price.toLocaleString('id-ID')}
                    </span>
                    <div className="text-[10px] text-slate-500">{menu.category}</div>
                  </div>
                </div>

                {isTracked && stockItem ? (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="9999"
                        value={currentVal ?? 0}
                        onChange={(e) => handleInputChange(stockItem.id, e.target.value)}
                        className="w-20 px-2 py-2 border border-slate-300 rounded-lg font-mono text-base font-bold text-slate-900 text-center min-h-[44px] focus:outline-slate-900"
                        aria-label={`Porsi stok pagi untuk ${menu.name}`}
                      />
                      <span className="text-xs text-slate-500 font-mono">porsi</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(stockItem.id, 5)}
                        className="px-3 py-2 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg min-h-[44px]"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(stockItem.id, 10)}
                        className="px-3 py-2 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg min-h-[44px]"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(stockItem.id, -5)}
                        className="px-2.5 py-2 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg min-h-[44px]"
                      >
                        -5
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
                    Menu ini tidak memiliki stok porsi (selalu tersedia).
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop View (sm+): Full High-Density Table */}
        <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Menu & Item Stok</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga Porsi</th>
                  <th className="px-4 py-3 w-60">Porsi Stok Pagi (0-9999)</th>
                  <th className="px-4 py-3 text-right">Tombol Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menuItems.map((menu) => {
                  const stockItem = stockItems.find((s) => s.id === menu.stockItemId);
                  const isTracked = !!stockItem;
                  const currentVal = stockItem ? stockInputs[stockItem.id] ?? 0 : null;

                  return (
                    <tr key={menu.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{menu.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {menu.id} {stockItem ? `→ ${stockItem.id}` : '· Tidak Dilacak'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{menu.category}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        Rp{menu.price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        {isTracked && stockItem ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="9999"
                              value={currentVal ?? 0}
                              onChange={(e) => handleInputChange(stockItem.id, e.target.value)}
                              className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900 text-center min-h-[44px] focus:outline-slate-900"
                            />
                            <span className="text-slate-500 font-mono">porsi</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Tidak dilacak (Selalu ada)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isTracked && stockItem ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(stockItem.id, 5)}
                              className="px-2.5 py-1.5 text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md min-h-[36px]"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(stockItem.id, 10)}
                              className="px-2.5 py-1.5 text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md min-h-[36px]"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(stockItem.id, -5)}
                              className="px-2 py-1.5 text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md min-h-[36px]"
                            >
                              -5
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500 order-2 sm:order-1">
            Semua movement opening disimpan dalam satu transaksi atomik.
          </p>
          <button
            type="submit"
            className="order-1 sm:order-2 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Stok Pagi (FR-3)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
