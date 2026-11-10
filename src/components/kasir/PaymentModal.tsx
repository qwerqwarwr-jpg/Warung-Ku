import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bill, Order } from '../../types';
import {
  X,
  AlertTriangle,
  CheckCircle,
  QrCode,
  Send,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  bill: Bill;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, bill, onClose }) => {
  const { confirmManualQris, triggerSandboxWebhook } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<'manual_qris' | 'sandbox'>('manual_qris');
  const [cashierName, setCashierName] = useState<string>('kasir_demo');
  const [referenceNote, setReferenceNote] = useState<string>('Mutasi QRIS Masuk Sesuai Nominal');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleManualConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = confirmManualQris({
      billId: bill.id,
      verifiedBy: cashierName,
      note: referenceNote,
    });

    setIsSubmitting(false);
    if (res.ok) {
      setStatusMessage({
        text: 'Pembayaran ManualQris berhasil dikonfirmasi! Order dilepas ke dapur.',
        type: 'success',
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMessage({ text: res.error || 'Gagal konfirmasi.', type: 'error' });
    }
  };

  const handleSandboxWebhook = (isDuplicate: boolean) => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = triggerSandboxWebhook({
      billId: bill.id,
      isDuplicateTest: isDuplicate,
    });

    setIsSubmitting(false);
    setStatusMessage({
      text: res.message,
      type: res.ok ? 'success' : 'error',
    });

    if (res.ok && !isDuplicate) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 truncate">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Konfirmasi Pembayaran</h3>
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 shrink-0">
                {order.id}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              {order.source === 'walk_in' ? 'Order Walk-in' : `Meja ${order.tableId || '-'}`} · Bill {bill.id}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Amount Due Card */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Tagihan Server
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                Rp{bill.total.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 shrink-0">
              <div>{order.items.length} item menu</div>
              <div className="font-mono text-[10px] sm:text-[11px] text-slate-400">pay_first</div>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('manual_qris')}
              className={`flex-1 py-2 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border min-h-[44px] flex items-center justify-center gap-1.5 transition-colors ${
                paymentMethod === 'manual_qris'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span className="truncate">ManualQris (Statis)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('sandbox')}
              className={`flex-1 py-2 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border min-h-[44px] flex items-center justify-center gap-1.5 transition-colors ${
                paymentMethod === 'sandbox'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">SandboxGateway</span>
            </button>
          </div>

          {/* Method 1: ManualQris */}
          {paymentMethod === 'manual_qris' && (
            <form onSubmit={handleManualConfirm} className="space-y-4">
              {/* Mandatory Cashier Warning Rule FR-8 */}
              <div className="p-3 sm:p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 leading-relaxed">
                  <div className="font-bold text-[11px] sm:text-xs">PERINGATAN ATURAN KASIR:</div>
                  <div>
                    Pastikan uang sudah masuk di mutasi atau notifikasi merchant,{' '}
                    <strong className="underline font-semibold">bukan dari screenshot pelanggan</strong>.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verifikator / Nama Kasir
                </label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] text-slate-900 focus:outline-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Verifikasi Mutasi (Opsional)
                </label>
                <input
                  type="text"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  placeholder="Contoh: Mutasi BCA nominal cocok"
                  className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded-lg min-h-[44px] text-slate-900 focus:outline-slate-900"
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
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 min-h-[44px] shadow-xs"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Konfirmasi Pembayaran Lunas</span>
                </button>
              </div>
            </form>
          )}

          {/* Method 2: SandboxGateway */}
          {paymentMethod === 'sandbox' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                SandboxGateway mensimulasikan QRIS dinamis otomatis via webhook.
                Gunakan tombol di bawah untuk menguji webhook pembayaran atau uji pengiriman ganda untuk membuktikan <strong>idempotensi</strong>.
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSandboxWebhook(false)}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 min-h-[44px] transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Webhook Pembayaran Sukses (Simulasi)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSandboxWebhook(true)}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-300 bg-white text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 min-h-[44px] transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span>Kirim Webhook Ganda (Uji Idempotensi)</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-mono text-center">
                Idempotency key per percobaan mencegah payment ganda dan potongan stok ganda.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
