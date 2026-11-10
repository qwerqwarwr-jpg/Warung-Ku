import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header, ActiveTab } from './components/Header';
import { KasirView } from './components/kasir/KasirView';
import { LogistikView } from './components/logistik/LogistikView';
import { CustomerView } from './components/customer/CustomerView';
import { SideBySideView } from './components/demo/SideBySideView';
import { ScenarioPlayer } from './components/demo/ScenarioPlayer';
import { CriteriaChecker } from './components/demo/CriteriaChecker';
import { AuditLedgerViewer } from './components/demo/AuditLedgerViewer';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kasir');

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-slate-100/60 text-slate-900 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 pb-12">
        {activeTab === 'kasir' && <KasirView />}
        {activeTab === 'logistik' && <LogistikView />}
        {activeTab === 'customer' && <CustomerView />}
        {activeTab === 'split' && <SideBySideView />}
        {activeTab === 'scenarios' && <ScenarioPlayer />}
        {activeTab === 'criteria' && <CriteriaChecker />}
        {activeTab === 'ledger' && <AuditLedgerViewer />}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Warung Demo</span>
            <span aria-hidden="true">·</span>
            <span>MVP F&B Kasir & Logistik Terintegrasi</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">outlet_demo_01</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Ledger Append-Only · Anti-Oversell · Skenario Lampiran A S1 s/d S11
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
