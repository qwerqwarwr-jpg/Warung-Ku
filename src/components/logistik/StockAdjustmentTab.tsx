import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, SlidersHorizontal, CheckCircle, AlertCircle, History } from 'lucide-react';

export const StockAdjustmentTab: React.FC = () => {
  const { stockItems, recordWaste, recordAdjustment, stockMovements } = useApp();

  // Mode: waste vs adjust
  const [activeMode, setActiveMode] = useState<'waste' | 'adjust'>('waste');

  // Waste form
  const [wasteStockItem, setWasteStockItem] = useState<string>('SI-06');
  const [wasteQty, setWasteQty] = useState<number>(1);
  const [wasteReason, setWasteReason] = useState<string>('Basi');
  const [wasteNote, setWasteNote] = useState<string>('');

  // Adjust form
  const [adjStockItem, setAdjStockItem] = useState<string>('SI-01');
  const [adjQty, setAdjQty] = useState<number>(2);
  const [adjReason, setAdjReason] = useState<string>('Koreksi salah hitung fisik');
  const [adjNote, setAdjNote] = useState<string>('');

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleWasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = recordWaste(wasteStockItem, wasteQty, wasteReason, wasteNote, 'pemilik_warung');
    if (res.ok) {
      setFeedback({ text: res.message || 'Porsi terbuang tercatat di ledger.', type: 'success' });
      setWasteNote('');
    } else {
      setFeedback({ text: res.message || 'Gagal mencatat terbuang.', type: 'error' });
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = recordAdjustment(adjStockItem, adjQty, adjReason, adjNote, 'pemilik_warung');
    if (res.ok) {
      setFeedback({ text: res.message || 'Koreksi stok tercatat di ledger.', type: 'success' });
      setAdjNote('');
    } else {
      setFeedback({ text: res.message || 'Gagal mencatat koreksi.', type: 'error' });
    }
  };

  const recentAdjustments = stockMovements.filter(
    (m) => m.type === 'waste' || m.type === 'adjustment' || m.type === 'reversal'
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Mode Selector */}
      <div className="flex flex-col sm:flex-row gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveMode('waste')}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg min-h-[44px] transition-colors ${
            activeMode === 'waste'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Catat Terbuang (FR-15)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('adjust')}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg min-h-[44px] transition-colors ${
            activeMode === 'adjust'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Koreksi Stok (FR-14)</span>
        </button>
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

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Active Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          {activeMode === 'waste' ? (
            <form onSubmit={handleWasteSubmit} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Catat Porsi Terbuang (Waste)</h3>
                  <p className="text-xs text-slate-500">
                    Mengurangi saldo porsi dengan alasan tetap (basi, tumpah, salah masak).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Menu / Item Stok
                </label>
                <select
                  value={wasteStockItem}
                  onChange={(e) => setWasteStockItem(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] bg-white text-slate-900"
                >
                  {stockItems.map((si) => (
                    <option key={si.id} value={si.id}>
                      {si.name} ({si.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Terbuang (Porsi)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={wasteQty}
                    onChange={(e) => setWasteQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alasan Wajib (FR-15)
                  </label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] bg-white text-slate-900"
                  >
                    <option value="Basi">Basi</option>
                    <option value="Salah masak">Salah masak / gosong</option>
                    <option value="Tumpah">Tumpah / jatuh</option>
                    <option value="Kualitas buruk">Kualitas bahan menurun</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={wasteNote}
                  onChange={(e) => setWasteNote(e.target.value)}
                  placeholder="Keterangan kejadian..."
                  className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 min-h-[44px] transition-colors shadow-xs"
              >
                Simpan Terbuang ke Ledger
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700 shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Koreksi Stok (Adjustment)</h3>
                  <p className="text-xs text-slate-500">
                    Menambah (+) atau mengurangi (-) saldo porsi dengan alasan audit.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Menu / Item Stok
                </label>
                <select
                  value={adjStockItem}
                  onChange={(e) => setAdjStockItem(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] bg-white text-slate-900"
                >
                  {stockItems.map((si) => (
                    <option key={si.id} value={si.id}>
                      {si.name} ({si.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nilai Koreksi (Bertanda ±)
                  </label>
                  <input
                    type="number"
                    value={adjQty}
                    onChange={(e) => setAdjQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] font-mono font-bold"
                    required
                  />
                  <span className="text-[11px] text-slate-400">Gunakan tanda minus untuk kurang (mis. -2)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alasan Wajib (FR-14)
                  </label>
                  <select
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] bg-white text-slate-900"
                  >
                    <option value="Koreksi salah hitung fisik">Koreksi salah hitung fisik</option>
                    <option value="Restock tambahan siang">Restock tambahan siang hari</option>
                    <option value="Porsi bonus uji coba">Porsi bonus uji coba</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  placeholder="Keterangan koreksi..."
                  className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 min-h-[44px] transition-colors shadow-xs"
              >
                Simpan Koreksi ke Ledger
              </button>
            </form>
          )}
        </div>

        {/* History / Recent Adjustments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <History className="w-4 h-4 text-slate-500 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">Riwayat Mutasi Non-Penjualan</h3>
          </div>

          {recentAdjustments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada riwayat koreksi atau terbuang hari ini.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 sm:max-h-80 overflow-y-auto">
              {recentAdjustments.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1"
                >
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-900">
                      {m.stockItemId} · {m.type.toUpperCase()}
                    </span>
                    <span
                      className={`font-mono tabular-nums font-bold ${
                        m.qty > 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {m.qty > 0 ? `+${m.qty}` : m.qty} porsi
                    </span>
                  </div>
                  <div className="text-slate-600 flex justify-between flex-wrap gap-1">
                    <span>{m.reason}</span>
                    <span className="font-mono text-[11px] text-slate-400">{m.createdAt}</span>
                  </div>
                  {m.note && <div className="text-slate-400 italic text-[11px]">Note: {m.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
