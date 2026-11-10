import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  Boxes,
  Smartphone,
  Columns3,
  PlayCircle,
  ShieldCheck,
  FileText,
  RotateCcw,
  Wifi,
  WifiOff,
  Clock,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type ActiveTab = 'kasir' | 'logistik' | 'customer' | 'split' | 'scenarios' | 'criteria' | 'ledger';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    outletConfig,
    businessDate,
    currentTime,
    isReconnecting,
    setIsReconnecting,
    resetToInitialState,
    loadFullLampiranAData,
    orders,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const awaitingCount = orders.filter((o) => o.status === 'awaiting_payment').length;

  const navItems: NavItem[] = [
    {
      id: 'kasir',
      label: 'Kasir',
      shortLabel: 'Kasir',
      icon: Store,
      badge: awaitingCount > 0 ? awaitingCount : undefined,
      description: 'Antrean pesanan, verifikasi QRIS, walk-in, tiket dapur',
    },
    {
      id: 'logistik',
      label: 'Logistik',
      shortLabel: 'Logistik',
      icon: Boxes,
      description: 'Isi stok pagi, pantau sisa, koreksi/terbuang, rekap harian',
    },
    {
      id: 'customer',
      label: 'Customer QR',
      shortLabel: 'Customer',
      icon: Smartphone,
      description: 'Pesan mandiri di meja M01–M05 dengan stok realtime',
    },
    {
      id: 'split',
      label: '3 Layar Simultan',
      shortLabel: '3 Layar',
      icon: Columns3,
      description: 'Bandingkan Kasir, Customer, dan Logistik berdampingan',
    },
    {
      id: 'scenarios',
      label: 'Skenario S1–S11',
      shortLabel: 'Skenario',
      icon: PlayCircle,
      description: 'Putar skenario kronologis anti-oversell & webhook ganda',
    },
    {
      id: 'criteria',
      label: 'Uji I-1–I-11',
      shortLabel: 'Uji Integrasi',
      icon: ShieldCheck,
      description: 'Evaluasi 11 kriteria keberhasilan integrasi kasir ↔ logistik',
    },
    {
      id: 'ledger',
      label: 'Ledger & Audit',
      shortLabel: 'Ledger',
      icon: FileText,
      description: 'Tabel pergerakan stok append-only, reservasi, & audit log',
    },
  ];

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top Banner for Reconnection Status or Demo simulation */}
        {isReconnecting && (
          <div className="bg-amber-500 text-slate-950 px-3 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-pulse">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Menyambung ulang koneksi... Data akan sinkron saat pulih.</span>
          </div>
        )}

        {/* Main Navbar Container */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Zone 1: Brand & Active Screen Pill on Mobile */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Drawer Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                aria-label="Buka menu navigasi"
                title="Buka menu navigasi modul"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo icon */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-base shrink-0 shadow-xs">
                WD
              </div>

              {/* Outlet info */}
              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                    {outletConfig.name}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-mono hidden md:inline shrink-0">
                    [{outletConfig.id}]
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 font-mono tabular-nums">
                  <span className="hidden sm:inline">{businessDate} ·</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    {currentTime} WIB
                  </span>
                </div>
              </div>
            </div>

            {/* Zone 2: Desktop Horizontal Navigation (Hidden on < lg) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[44px] ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.shortLabel}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-mono text-[10px] rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Quick Utilities (Right side) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Connection Toggle Simulator */}
              <button
                type="button"
                onClick={() => setIsReconnecting(!isReconnecting)}
                className={`p-2 rounded-md border text-xs transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isReconnecting
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={isReconnecting ? 'Koneksi terputus (klik untuk pulih)' : 'Simulasi putus koneksi'}
                aria-label="Simulasi koneksi"
              >
                {isReconnecting ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
              </button>

              {/* Load Full Demo Data (Desktop button) */}
              <button
                type="button"
                onClick={loadFullLampiranAData}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap min-h-[44px]"
                title="Muat data lengkap skenario Lampiran A (S1 s/d S11)"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Muat Data Demo</span>
              </button>

              {/* Reset to 07:30 Button */}
              <button
                type="button"
                onClick={resetToInitialState}
                className="p-2 rounded-md border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Reset ke kondisi awal 07:30 (kosong)"
                aria-label="Reset kondisi awal"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Header / Current Module Bar (Visible only on < lg) */}
        <div className="lg:hidden border-t border-slate-100 bg-slate-50/80 px-3 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Modul Aktif:
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
              {React.createElement(currentNav.icon, { className: 'w-3.5 h-3.5 text-slate-700 shrink-0' })}
              <span className="truncate">{currentNav.label}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white rounded border border-slate-200 shrink-0 min-h-[32px] flex items-center gap-1"
          >
            <span>Ganti Modul</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Mobile & Tablet Drawer Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-[100dvh] flex flex-col shadow-2xl z-10 overflow-hidden">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-xs text-white">
                  WD
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight">{outletConfig.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {businessDate} · {currentTime} WIB
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Tutup menu navigasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 pb-1">
                Pilih Modul Aplikasi
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 min-h-[48px] ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs sm:text-sm truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                              isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] line-clamp-1 mt-0.5 ${
                          isActive ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  loadFullLampiranAData();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 min-h-[44px] transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Muat Data Demo Penuh (S1–S11)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetToInitialState();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 bg-white text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 min-h-[44px] transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Reset ke 07:30 (Kosong)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
