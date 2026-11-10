import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Database, Shield, Lock } from 'lucide-react';

export const AuditLedgerViewer: React.FC = () => {
  const { stockMovements, stockReservations, auditLogs } = useApp();

  const [activeTab, setActiveTab] = useState<'movements' | 'reservations' | 'audit'>('movements');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inspektor Ledger Stok & Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bukti ledger append-only (PRD Logistik Bagian 5 & PRD Kasir Bagian 6), tabel reservasi TTL, dan jejak audit sensitif.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors min-h-[44px] shrink-0 ${
              activeTab === 'movements'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>stock_movement ({stockMovements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors min-h-[44px] shrink-0 ${
              activeTab === 'reservations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>stock_reservation ({stockReservations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors min-h-[44px] shrink-0 ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>audit_log ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: stock_movement ledger */}
      {activeTab === 'movements' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Tabel stock_movement (Append-Only · Tidak Ada UPDATE atau DELETE)
            </span>
            <span className="text-xs font-mono text-slate-500">
              Total {stockMovements.length} Baris
            </span>
          </div>

          {stockMovements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Ledger masih kosong. Isi stok pagi atau jalankan skenario untuk melihat entri.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 font-mono">
                    <th className="px-3 py-2.5">ID</th>
                    <th className="px-3 py-2.5">Waktu</th>
                    <th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5">Tipe</th>
                    <th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5">Order</th>
                    <th className="px-3 py-2.5">Idempotency Key</th>
                    <th className="px-3 py-2.5">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {stockMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-bold text-slate-900">{m.id}</td>
                      <td className="px-3 py-2 text-slate-600">{m.createdAt}</td>
                      <td className="px-3 py-2 font-bold text-slate-800">{m.stockItemId}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            m.type === 'opening'
                              ? 'bg-blue-100 text-blue-800'
                              : m.type === 'sale'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type === 'waste'
                              ? 'bg-rose-100 text-rose-800'
                              : m.type === 'reversal'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums font-bold ${
                          m.qty > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {m.qty > 0 ? `+${m.qty}` : m.qty}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{m.orderId || '-'}</td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-xs">{m.idempotencyKey}</td>
                      <td className="px-3 py-2 text-slate-600">{m.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: stock_reservation */}
      {activeTab === 'reservations' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Tabel stock_reservation (TTL 10 Menit Anti-Oversell)
            </span>
            <span className="text-xs font-mono text-slate-500">
              Total {stockReservations.length} Reservasi
            </span>
          </div>

          {stockReservations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada data reservasi aktif atau selesai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 font-mono">
                    <th className="px-3 py-2.5">ID</th>
                    <th className="px-3 py-2.5">Order ID</th>
                    <th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Dibuat</th>
                    <th className="px-3 py-2.5">Kedaluwarsa (TTL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {stockReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-bold text-slate-900">{r.id}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{r.orderId}</td>
                      <td className="px-3 py-2 text-slate-700">{r.stockItemId}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">{r.qty}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'active'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'committed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'expired'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.createdAt}</td>
                      <td className="px-3 py-2 text-slate-600">{r.expiresAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: audit_log */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Tabel audit_log (Pencatatan Aksi Sensitif Pembayaran, Void, & Mutasi)
            </span>
            <span className="text-xs font-mono text-slate-500">
              Total {auditLogs.length} Log
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada aksi tercatat di audit log.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-600 font-semibold">{log.entity} [{log.entityId}]</span>
                    </div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-2">
                      <span>Oleh: <strong className="text-slate-700">{log.actorId}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>{log.createdAt} WIB</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 p-2 rounded border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-semibold">Sebelum:</span>
                      <pre className="text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
                        {log.before ? JSON.stringify(log.before) : 'null'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Sesudah:</span>
                      <pre className="text-slate-800 overflow-x-auto whitespace-pre-wrap break-all">
                        {log.after ? JSON.stringify(log.after) : 'null'}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
