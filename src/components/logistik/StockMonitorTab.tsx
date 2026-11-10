import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  Lock,
} from 'lucide-react';

export const StockMonitorTab: React.FC = () => {
  const { menuItems, getAvailability, toggleManualSoldOut } = useApp();

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {(() => {
          let totalAwal = 0;
          let totalTerjual = 0;
          let totalTertahan = 0;
          let totalTersedia = 0;

          menuItems.forEach((m) => {
            const avail = getAvailability(m.id);
            if (avail.breakdown.isTracked) {
              totalAwal += avail.breakdown.stokAwal;
              totalTerjual += avail.breakdown.terjual;
              totalTertahan += avail.breakdown.tertahan;
              totalTersedia += avail.tersedia;
            }
          });

          return (
            <>
              <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Stok Awal
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {totalAwal} <span className="text-xs font-normal text-slate-400">porsi</span>
                </div>
              </div>
              <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Terjual (Lunas)
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{totalTerjual}</span> <span className="text-xs font-normal text-slate-400">porsi</span>
                </div>
              </div>
              <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tertahan (TTL)
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 mt-1 tabular-nums flex items-center gap-1">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{totalTertahan}</span> <span className="text-xs font-normal text-slate-400">porsi</span>
                </div>
              </div>
              <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Sisa Tersedia
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {totalTersedia} <span className="text-xs font-normal text-slate-400">porsi</span>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Main Stock Monitor Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Pantau Sisa Porsi & Ketersediaan Realtime (FR-7)
            </h2>
            <p className="text-xs text-slate-500">
              Satu-satunya sumber kebenaran (<code>getAvailability</code>) yang dibagikan identik ke Kasir & Customer.
            </p>
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-400">
            Sisa = Awal + Koreksi − Terjual − Reservasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3 text-right">Stok Awal</th>
                <th className="px-4 py-3 text-right">Terjual</th>
                <th className="px-4 py-3 text-right">Tertahan (TTL)</th>
                <th className="px-4 py-3 text-right">Koreksi / Void</th>
                <th className="px-4 py-3 text-right">Terbuang</th>
                <th className="px-4 py-3 text-right">Sisa Tersedia</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Toggle HABIS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menuItems.map((menu) => {
                const avail = getAvailability(menu.id);
                const isSoldOut = avail.status === 'HABIS';
                const isManual = avail.alasan === 'HABIS_MANUAL';
                const isTracked = avail.breakdown.isTracked;

                return (
                  <tr
                    key={menu.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSoldOut ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    {/* Menu Name */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{menu.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {menu.id} {menu.stockItemId ? `· ${menu.stockItemId}` : '· Tidak Dilacak'}
                      </div>
                    </td>

                    {/* Stok Awal */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                      {isTracked ? avail.breakdown.stokAwal : '-'}
                    </td>

                    {/* Terjual */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                      {isTracked ? (
                        avail.breakdown.terjual > 0 ? (
                          <span className="font-semibold text-slate-900">{avail.breakdown.terjual}</span>
                        ) : (
                          0
                        )
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Tertahan (Reservasi Aktif) */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {isTracked ? (
                        avail.breakdown.tertahan > 0 ? (
                          <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            {avail.breakdown.tertahan}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Koreksi / Pembalikan Void */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                      {isTracked ? (
                        avail.breakdown.koreksi !== 0 ? (
                          <span
                            className={
                              avail.breakdown.koreksi > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600'
                            }
                          >
                            {avail.breakdown.koreksi > 0 ? `+${avail.breakdown.koreksi}` : avail.breakdown.koreksi}
                          </span>
                        ) : (
                          0
                        )
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Terbuang */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                      {isTracked ? (
                        avail.breakdown.terbuang > 0 ? (
                          <span className="text-rose-600 font-semibold">-{avail.breakdown.terbuang}</span>
                        ) : (
                          0
                        )
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Sisa Tersedia */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {isTracked ? (
                        <span
                          className={`text-sm font-bold ${
                            avail.tersedia === 0
                              ? 'text-rose-600'
                              : avail.tersedia <= 3
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {avail.tersedia}
                        </span>
                      ) : (
                        <span className="text-slate-400">∞</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center">
                      {isSoldOut ? (
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 whitespace-nowrap">
                          HABIS {isManual ? '(MANUAL)' : '(STOK 0)'}
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 whitespace-nowrap">
                          AVAILABLE
                        </span>
                      )}
                    </td>

                    {/* Manual HABIS Toggle Button */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleManualSoldOut(menu.id, 'logistik_staff')}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg min-h-[44px] transition-colors ${
                          isManual
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title={isManual ? 'Cabut status HABIS manual' : 'Tandai menu HABIS secara manual'}
                      >
                        {isManual ? <ToggleRight className="w-4 h-4 text-rose-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                        <span className="text-[11px]">{isManual ? 'Habis Manual' : 'Normal'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
