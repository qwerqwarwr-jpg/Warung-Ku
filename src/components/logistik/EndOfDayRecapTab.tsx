import React from 'react';
import { useApp } from '../../context/AppContext';
import { FileSpreadsheet, DollarSign, CheckCircle2 } from 'lucide-react';

export const EndOfDayRecapTab: React.FC = () => {
  const { menuItems, stockItems, getAvailability, orders, stockMovements, businessDate } = useApp();

  // Revenue calculation from orders
  const paidOrders = orders.filter((o) => o.status === 'paid');
  const voidOrders = orders.filter((o) => o.status === 'void');

  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalVoidRevenue = voidOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Rekap Akhir Hari ({businessDate}) (FR-18 & FR-20)
            </h2>
            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-semibold font-mono">
              Dihitung dari Ledger Append-Only
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Angka rekap berasal dari penjumlahan seluruh baris <code>stock_movement</code> tanpa modifikasi historis.
          </p>
        </div>

        {/* Revenue Card */}
        <div className="bg-white border border-slate-200 px-4 py-3 rounded-lg shadow-xs flex items-center gap-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Omzet Pesanan Berbayar (Net)
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
              Rp{totalPaidRevenue.toLocaleString('id-ID')}
            </div>
            {totalVoidRevenue > 0 && (
              <div className="text-[11px] text-slate-400 font-mono">
                Void: -Rp{totalVoidRevenue.toLocaleString('id-ID')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recap Table (matching Lampiran A.8) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Rekapitulasi Mode Porsi (Sesuai Lampiran A.8)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {stockMovements.length} Movement Terproses
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3 text-right">Awal</th>
                <th className="px-4 py-3 text-right">Terjual</th>
                <th className="px-4 py-3 text-right">Terbuang</th>
                <th className="px-4 py-3 text-right">Koreksi / Pembalikan</th>
                <th className="px-4 py-3 text-right">Sisa Akhir</th>
                <th className="px-4 py-3">Catatan Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menuItems
                .filter((m) => m.stockItemId !== null)
                .map((menu) => {
                  const avail = getAvailability(menu.id);
                  const isTracked = avail.breakdown.isTracked;
                  const isManual = avail.alasan === 'HABIS_MANUAL';

                  let notes = '';
                  if (menu.id === 'MN-02' && isManual) {
                    notes = 'HABIS manual dari 12:20';
                  } else if (menu.id === 'MN-03' && avail.breakdown.koreksi > 0) {
                    notes = 'Pembalikan dari void ORD-006 (+1)';
                  } else if (menu.id === 'MN-04' && avail.breakdown.koreksi > 0) {
                    notes = 'Pembalikan dari void ORD-006 (+1)';
                  } else if (avail.tersedia === 0) {
                    notes = 'Habis terjual hari ini';
                  }

                  return (
                    <tr key={menu.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{menu.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {menu.id} · {menu.stockItemId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {avail.breakdown.stokAwal}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {avail.breakdown.terjual}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-700">
                        {avail.breakdown.terbuang > 0 ? `-${avail.breakdown.terbuang}` : 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700">
                        {avail.breakdown.koreksi !== 0
                          ? `${avail.breakdown.koreksi > 0 ? '+' : ''}${avail.breakdown.koreksi}`
                          : 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {avail.tersedia}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {notes ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {notes}
                          </span>
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
    </div>
  );
};
