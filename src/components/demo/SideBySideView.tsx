import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KasirView } from '../kasir/KasirView';
import { CustomerView } from '../customer/CustomerView';
import { LogistikView } from '../logistik/LogistikView';
import { Store, Smartphone, Boxes, Info, Layers, Eye, Table } from 'lucide-react';

export const SideBySideView: React.FC = () => {
  const { getAvailability } = useApp();

  // On screens < xl, allow switching between individual view tabs or stacked view
  const [mobileActiveScreen, setMobileActiveScreen] = useState<'all' | 'kasir' | 'customer' | 'logistik'>('all');
  const [showTableA7, setShowTableA7] = useState<boolean>(true);

  const gadoGadoAvail = getAvailability('MN-06');
  const rawonAvail = getAvailability('MN-02');
  const ayamAvail = getAvailability('MN-01');

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Synchronization Banner & Invariant I-1 Proof Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Simulasi 3 Layar Simultan (Satu Sumber Kebenaran: getAvailability)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Sesuai Lampiran A.11: Bandingkan angka ketersediaan menu di Kasir, Customer Meja, dan Logistik.
              </p>
            </div>
          </div>

          {/* Quick Realtime Comparison Badges */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-700/80 overflow-x-auto w-full md:w-auto">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-slate-400">Gado-gado:</span>
              <span className="font-mono font-bold text-emerald-400">
                {gadoGadoAvail.status === 'HABIS' ? 'HABIS' : `${gadoGadoAvail.tersedia} porsi`}
              </span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-slate-400">Rawon:</span>
              <span className="font-mono font-bold text-amber-400">
                {rawonAvail.status === 'HABIS' ? `HABIS (${rawonAvail.alasan})` : `${rawonAvail.tersedia} porsi`}
              </span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-slate-400">Ayam:</span>
              <span className="font-mono font-bold text-white">
                {ayamAvail.tersedia} porsi
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Controls (Adaptive on mobile / tablet < xl) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 font-semibold mr-1 hidden sm:inline">Tampilan Layar:</span>
            <button
              type="button"
              onClick={() => setMobileActiveScreen('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold min-h-[38px] transition-colors whitespace-nowrap ${
                mobileActiveScreen === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Semua Layar ({typeof window !== 'undefined' && window.innerWidth >= 1280 ? '3 Kolom' : 'Tumpuk'})
            </button>
            <button
              type="button"
              onClick={() => setMobileActiveScreen('kasir')}
              className={`px-3 py-1.5 rounded-lg font-semibold min-h-[38px] transition-colors whitespace-nowrap ${
                mobileActiveScreen === 'kasir'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Fokus Kasir
            </button>
            <button
              type="button"
              onClick={() => setMobileActiveScreen('customer')}
              className={`px-3 py-1.5 rounded-lg font-semibold min-h-[38px] transition-colors whitespace-nowrap ${
                mobileActiveScreen === 'customer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Fokus Customer
            </button>
            <button
              type="button"
              onClick={() => setMobileActiveScreen('logistik')}
              className={`px-3 py-1.5 rounded-lg font-semibold min-h-[38px] transition-colors whitespace-nowrap ${
                mobileActiveScreen === 'logistik'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Fokus Logistik
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTableA7(!showTableA7)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-800 min-h-[38px] self-start sm:self-auto"
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showTableA7 ? 'Sembunyikan' : 'Lihat'} Tabel Jejak A.7</span>
          </button>
        </div>
      </div>

      {/* Table A.7 Reference Card: Jejak Ketersediaan Gado-gado */}
      {showTableA7 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Tabel A.7: Jejak Ketersediaan Gado-gado (SI-06) di Tiga Layar
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Kolom Kasir, Customer, & Logistik Wajib Identik
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 font-mono text-[11px]">
                  <th className="px-3 py-2.5">Waktu</th>
                  <th className="px-3 py-2.5">Peristiwa</th>
                  <th className="px-3 py-2.5 text-right">Awal</th>
                  <th className="px-3 py-2.5 text-right">Terjual</th>
                  <th className="px-3 py-2.5 text-right">Tertahan</th>
                  <th className="px-3 py-2.5 text-right">Tersedia</th>
                  <th className="px-3 py-2.5 text-center">Status (3 Layar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">07:30</td>
                  <td className="px-3 py-2 text-slate-800">Stok pagi diisi (S1)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">0</td>
                  <td className="px-3 py-2 text-right">0</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">8</td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-bold">AVAILABLE</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">10:05</td>
                  <td className="px-3 py-2 text-slate-800">ORD-001 dibuat (S2)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">0</td>
                  <td className="px-3 py-2 text-right text-amber-600 font-bold">3</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">5</td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-bold">AVAILABLE</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">10:08</td>
                  <td className="px-3 py-2 text-slate-800">ORD-001 dibayar (S2)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">3</td>
                  <td className="px-3 py-2 text-right">0</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">5</td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-bold">AVAILABLE</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">10:40</td>
                  <td className="px-3 py-2 text-slate-800">ORD-002 dibuat (S3)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">3</td>
                  <td className="px-3 py-2 text-right text-amber-600 font-bold">4</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">1</td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-bold">AVAILABLE</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">10:43</td>
                  <td className="px-3 py-2 text-slate-800">ORD-002 dibayar (S3)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">7</td>
                  <td className="px-3 py-2 text-right">0</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">1</td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-bold">AVAILABLE</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">11:42:10</td>
                  <td className="px-3 py-2 text-slate-800">ORD-004 dibuat / Permintaan B ditolak (S5)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">7</td>
                  <td className="px-3 py-2 text-right text-amber-600 font-bold">1</td>
                  <td className="px-3 py-2 text-right font-bold text-rose-600">0</td>
                  <td className="px-3 py-2 text-center text-rose-700 font-bold bg-rose-50/60">HABIS</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">11:52:10</td>
                  <td className="px-3 py-2 text-slate-800">ORD-004 kedaluwarsa TTL (S6)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">7</td>
                  <td className="px-3 py-2 text-right">0</td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-600">1</td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-bold">AVAILABLE</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">11:55</td>
                  <td className="px-3 py-2 text-slate-800">ORD-005 dibuat (S7)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">7</td>
                  <td className="px-3 py-2 text-right text-amber-600 font-bold">1</td>
                  <td className="px-3 py-2 text-right font-bold text-rose-600">0</td>
                  <td className="px-3 py-2 text-center text-rose-700 font-bold bg-rose-50/60">HABIS</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">11:57</td>
                  <td className="px-3 py-2 text-slate-800">ORD-005 dibayar (S7)</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">8</td>
                  <td className="px-3 py-2 text-right">0</td>
                  <td className="px-3 py-2 text-right font-bold text-rose-600">0</td>
                  <td className="px-3 py-2 text-center text-rose-700 font-bold bg-rose-50/60">HABIS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Multi-Screen Grid / Tabs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Column 1: Kasir Screen */}
        {(mobileActiveScreen === 'all' || mobileActiveScreen === 'kasir') && (
          <div className="bg-slate-50/60 border border-slate-300 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Layar 1: Kasir</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Walk-in & Bayar</span>
            </div>
            <div className="p-2 sm:p-3 overflow-y-auto max-h-[85dvh]">
              <KasirView />
            </div>
          </div>
        )}

        {/* Column 2: Customer Meja Screen */}
        {(mobileActiveScreen === 'all' || mobileActiveScreen === 'customer') && (
          <div className="bg-slate-50/60 border border-slate-300 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Layar 2: Customer QR</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Pesan Meja Mandiri</span>
            </div>
            <div className="p-2 sm:p-3 overflow-y-auto max-h-[85dvh]">
              <CustomerView />
            </div>
          </div>
        )}

        {/* Column 3: Logistik Screen */}
        {(mobileActiveScreen === 'all' || mobileActiveScreen === 'logistik') && (
          <div className="bg-slate-50/60 border border-slate-300 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Layar 3: Logistik</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Stok Pagi & Pantau</span>
            </div>
            <div className="p-2 sm:p-3 overflow-y-auto max-h-[85dvh]">
              <LogistikView />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
