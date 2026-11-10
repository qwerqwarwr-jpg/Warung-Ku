import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { X, ShieldAlert, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

interface VoidModalProps {
  order: Order;
  onClose: () => void;
}

export const VoidModal: React.FC<VoidModalProps> = ({ order, onClose }) => {
  const { voidPaidOrder, outletConfig } = useApp();

  const [pin, setPin] = useState<string>('');
  const [reason, setReason] = useState<string>('Pelanggan salah pesan dan kasir belum masak');
  const [authorizedBy, setAuthorizedBy] = useState<string>('pemilik_warung');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleVoid = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (pin !== outletConfig.ownerPin) {
      setErrorMsg('PIN Otorisasi Pemilik salah! (Hint demo: 8888)');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Alasan pembatalan (void) wajib diisi.');
      return;
    }

    const res = voidPaidOrder({
      orderId: order.id,
      reason,
      pin,
      authorizedBy,
    });

    if (res.ok) {
      setSuccessMsg('Pesanan berhasil dibatalkan (void). Movement reversal telah dicatat di ledger.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Gagal membatalkan pesanan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Void Pesanan Terbayar</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Otorisasi Khusus Pemilik / Admin (M3)</p>
            </div>
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
        <form onSubmit={handleVoid} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between items-center text-slate-700 font-semibold flex-wrap gap-1">
              <span>Nomor Order: {order.id}</span>
              <span className="font-mono text-slate-900 font-bold">Rp{order.total.toLocaleString('id-ID')}</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Pesanan ini sudah lunas. Membatalkan akan mencatat movement <code>reversal</code> positif pada ledger stok dan audit log. Baris sale asli tetap utuh.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-800 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PIN Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PIN Otorisasi Pemilik (Demo: 8888)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN pemilik"
                className="w-full px-3 py-2 pl-9 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] text-slate-900 font-mono tracking-widest focus:outline-slate-900"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Actor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pemberi Otorisasi
            </label>
            <input
              type="text"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] text-slate-900 focus:outline-slate-900"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan Pembatalan (Wajib Dicatat di Audit)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-slate-900"
              placeholder="Contoh: Salah pilih meja / pelanggan batalkan pesanan sebelum dimasak"
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 min-h-[44px] transition-colors shadow-xs"
            >
              Setujui & Batalkan Pesanan (Void)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
