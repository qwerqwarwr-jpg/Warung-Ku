import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Play,
  RotateCcw,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ScenarioDef {
  step: number;
  time: string;
  title: string;
  action: string;
  outcome: string;
  tags: string[];
}

const SCENARIOS: ScenarioDef[] = [
  {
    step: 1,
    time: '07:30',
    title: 'S1: Pengisian Stok Pagi 6 Menu',
    action: 'Pemilik warung mengisi 6 menu via setDailyStock secara atomik.',
    outcome: '6 movement opening tersimpan. Ketersediaan menu terlacak aktif di kasir dan customer.',
    tags: ['Logistik', 'Opening', 'Atomik'],
  },
  {
    step: 2,
    time: '10:05',
    title: 'S2: ORD-001 (QR M01) & Bayar ManualQris',
    action: 'Pelanggan pesan Gado-gado ×3, Es Jeruk ×3 (Rp60.000). Kasir konfirmasi bayar 10:08.',
    outcome: 'Reservasi 3 → tersedia Gado-gado 8 → 5; bayar → commit sale −3, tiket tampil di kasir.',
    tags: ['Kasir', 'ManualQris', 'Gerbang Dapur'],
  },
  {
    step: 3,
    time: '10:40',
    title: 'S3: ORD-002 (Walk-in Kasir)',
    action: 'Kasir buat order walk-in takeaway: Gado-gado ×4, Kopi Hitam ×1 = Rp61.000. Bayar 10:43.',
    outcome: 'Reservasi 4 → commit sale −4. Stok Gado-gado tersisa 1 porsi!',
    tags: ['Walk-in', 'Stok Menipis'],
  },
  {
    step: 4,
    time: '11:15',
    title: 'S4: ORD-003 & Webhook Ganda (SandboxGateway)',
    action: 'ORD-003 Ayam Goreng ×2, Es Teh ×1 (Rp40.000). Webhook simulasi terkirim 2 kali.',
    outcome: 'Idempotensi lolos: Tepat 1 payment & 1 movement sale. Tidak ada potongan ganda.',
    tags: ['Sandbox', 'Idempotensi', 'Webhook'],
  },
  {
    step: 5,
    time: '11:42:10',
    title: 'S5: Race Condition (15 ms) Porsi Terakhir',
    action: 'ORD-004 (M03) & Permintaan B (M04) memesan Gado-gado ×1 hampir bersamaan.',
    outcome: 'Hanya 1 reservasi berhasil; permintaan lain ditolak "Menu habis". Sisa saldo tidak pernah minus!',
    tags: ['Anti-Oversell', 'Konkurensi', 'Atomik'],
  },
  {
    step: 6,
    time: '11:52:10',
    title: 'S6: TTL 10 Menit Habis (Order Expired)',
    action: 'ORD-004 tidak dibayar dalam 10 menit.',
    outcome: 'Reservasi expired, Gado-gado otomatis kembali tersedia 1 porsi di ketiga layar!',
    tags: ['TTL Expiry', 'Stock Restored'],
  },
  {
    step: 7,
    time: '11:55',
    title: 'S7: ORD-005 (M04) Mengambil Porsi Pulih',
    action: 'Pelanggan Meja M04 memesan Gado-gado ×1 yang baru kembali dan bayar 11:57.',
    outcome: 'Commit sale −1; Gado-gado sisa 0 dan berstatus HABIS permanen hari ini.',
    tags: ['Sale Commit', 'Stok Habis'],
  },
  {
    step: 8,
    time: '12:10',
    title: 'S8: ORD-006 (QR M05) Multi-Item',
    action: 'ORD-006 memesan Soto Ayam ×1, Nasi Pecel ×1 (Rp28.000). Bayar 12:13.',
    outcome: 'Dua movement sale tercatat (-1 Soto, -1 Pecel).',
    tags: ['Multi-Item', 'ManualQris'],
  },
  {
    step: 9,
    time: '12:20',
    title: 'S9: Toggle HABIS Manual Nasi Rawon',
    action: 'Kasir toggle HABIS manual Nasi Rawon (stok tercatat masih 15 porsi).',
    outcome: 'Nasi Rawon langsung berstatus HABIS di Kasir, Customer, dan Logistik.',
    tags: ['Toggle Manual', 'Single Source'],
  },
  {
    step: 10,
    time: '12:21',
    title: 'S10: Uji Proteksi Server Permintaan Direct',
    action: 'Permintaan langsung memesan Nasi Rawon yang sedang manual sold-out.',
    outcome: 'Server menolak transaksi (FR-21): "Menu habis (manual)".',
    tags: ['Proteksi Server', 'FR-21'],
  },
  {
    step: 11,
    time: '12:30',
    title: 'S11: Void ORD-006 dengan Otorisasi Pemilik (M3)',
    action: 'Kasir void ORD-006 dengan otorisasi PIN pemilik (8888) dan alasan wajib.',
    outcome: 'Movement reversal (+1 Soto, +1 Pecel) tercatat, omzet berkurang dari Rp203.000 ke Rp175.000.',
    tags: ['Void/Refund', 'Reversal Ledger', 'Audit'],
  },
];

export const ScenarioPlayer: React.FC = () => {
  const {
    activeScenarioStep,
    runScenarioStep,
    runAllScenarios,
    resetToInitialState,
    currentTime,
  } = useApp();

  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const handleStepClick = (stepNum: number) => {
    const res = runScenarioStep(stepNum);
    setLastMessage(res.message);
  };

  const handleRunAll = () => {
    runAllScenarios();
    setLastMessage('Seluruh skenario S1 s/d S11 berhasil dijalankan berurutan secara otomatis!');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pemutar Skenario Demo Lampiran A (S1 s/d S11)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Jalankan skenario kronologis berurutan untuk mendemonstrasikan ledger append-only, anti-oversell, webhook ganda, dan void.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={resetToInitialState}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 min-h-[44px] transition-colors"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Reset 07:30</span>
          </button>

          <button
            type="button"
            onClick={handleRunAll}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs min-h-[44px] transition-colors shadow-sm"
          >
            <Zap className="w-4 h-4 fill-slate-950 shrink-0" />
            <span>Jalankan Semua (S1-S11)</span>
          </button>
        </div>
      </div>

      {lastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-start gap-2.5 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{lastMessage}</span>
        </div>
      )}

      {/* Scenario Timeline Cards */}
      <div className="space-y-3">
        {SCENARIOS.map((sc) => {
          const isCompleted = activeScenarioStep >= sc.step;
          const isCurrent = activeScenarioStep === sc.step - 1;

          return (
            <div
              key={sc.step}
              className={`p-4 bg-white border rounded-xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCompleted
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : isCurrent
                  ? 'border-slate-900 ring-2 ring-slate-900/10'
                  : 'border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                {/* Step badge */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-slate-900 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : `S${sc.step}`}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {sc.time}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <h3 className="text-sm font-bold text-slate-900">{sc.title}</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{sc.action}</p>

                  <div className="text-[11px] text-slate-500 pt-0.5">
                    <strong className="text-slate-700">Hasil:</strong> {sc.outcome}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    {sc.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center justify-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => handleStepClick(sc.step)}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold min-h-[44px] w-full md:w-auto transition-colors ${
                    isCompleted
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : isCurrent
                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>{isCompleted ? 'Jalankan Ulang' : `Jalankan S${sc.step}`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
