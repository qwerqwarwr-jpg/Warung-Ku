import React, { useState } from 'react';
import { DailyStockTab } from './DailyStockTab';
import { StockMonitorTab } from './StockMonitorTab';
import { StockAdjustmentTab } from './StockAdjustmentTab';
import { EndOfDayRecapTab } from './EndOfDayRecapTab';
import { Sunrise, Activity, Sliders, CalendarCheck } from 'lucide-react';

export const LogistikView: React.FC = () => {
  const [subTab, setSubTab] = useState<'daily' | 'monitor' | 'adjust' | 'recap'>('monitor');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Subnav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Modul Logistik & Inventori Porsi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengisian stok pagi, pantauan sisa porsi, koreksi/terbuang, dan rekapitulasi ledger append-only.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors min-h-[36px] whitespace-nowrap ${
              subTab === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sunrise className="w-3.5 h-3.5 text-amber-500" />
            <span>Isi Stok Pagi (FR-1)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('monitor')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors min-h-[36px] whitespace-nowrap ${
              subTab === 'monitor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pantau Sisa (FR-7)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('adjust')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors min-h-[36px] whitespace-nowrap ${
              subTab === 'adjust'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Koreksi & Terbuang (FR-14)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('recap')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors min-h-[36px] whitespace-nowrap ${
              subTab === 'recap'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-700" />
            <span>Rekap Akhir Hari (FR-18)</span>
          </button>
        </div>
      </div>

      {/* Render Active Subtab */}
      {subTab === 'daily' && <DailyStockTab />}
      {subTab === 'monitor' && <StockMonitorTab />}
      {subTab === 'adjust' && <StockAdjustmentTab />}
      {subTab === 'recap' && <EndOfDayRecapTab />}
    </div>
  );
};
