import React from 'react';
import { Home, Lock, LayoutGrid } from 'lucide-react';
import { ViewType } from '../types';
import { hapticTap } from '../utils/haptics';

interface BottomNavProps {
  currentView: ViewType;
  onGoHome: () => void;
  onStartTransfer: () => void;
  onNotify: (msg: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onGoHome,
  onStartTransfer,
  onNotify,
}) => {
  return (
    <nav
      className="bg-white border-t border-slate-200/90 flex items-center shrink-0 safe-area-pb z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      aria-label="Navegación principal"
    >
      {/* Pestaña Inicio */}
      <button
        onClick={() => {
          hapticTap();
          onGoHome();
        }}
        className={`flex-1 relative flex flex-col items-center justify-center min-h-[58px] py-1 transition-colors cursor-pointer ${
          currentView === 'home' ? 'text-[#F77F00]' : 'text-slate-800 hover:text-slate-900'
        }`}
        type="button"
      >
        {currentView === 'home' && (
          <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#F77F00]" />
        )}
        <Home className="w-5 h-5 mb-0.5 stroke-[2.3]" />
        <span className="text-[11px] font-bold tracking-tight text-[#1E2538]">Inicio</span>
      </button>

      {/* Pestaña Transferir */}
      <button
        onClick={() => {
          hapticTap();
          onStartTransfer();
        }}
        className={`flex-1 relative flex flex-col items-center justify-center min-h-[58px] py-1 transition-colors cursor-pointer ${
          currentView === 'transfer' || currentView === 'recipients'
            ? 'text-[#F77F00]'
            : 'text-slate-800 hover:text-slate-900'
        }`}
        type="button"
      >
        {(currentView === 'transfer' || currentView === 'recipients') && (
          <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#F77F00]" />
        )}
        <svg
          className="w-5 h-5 mb-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 7H5M9 3L5 7L9 11" />
          <path d="M5 17H19M15 13L19 17L15 21" />
        </svg>
        <span className="text-[11px] font-bold tracking-tight text-[#1E2538]">Transferir</span>
      </button>

      {/* Pestaña Seguridad */}
      <button
        onClick={() => {
          hapticTap();
          onNotify('Módulo de Seguridad BancoEstado (BE Pass, Biometría, Dispositivos).');
        }}
        className="flex-1 relative flex flex-col items-center justify-center min-h-[58px] py-1 text-slate-800 hover:text-slate-900 transition-colors cursor-pointer"
        type="button"
      >
        <Lock className="w-5 h-5 mb-0.5 stroke-[2.3]" />
        <span className="text-[11px] font-bold tracking-tight text-[#1E2538]">Seguridad</span>
      </button>

      {/* Pestaña Más */}
      <button
        onClick={() => {
          hapticTap();
          onNotify('Más servicios: Pagos de cuentas, Recargas, Inversiones.');
        }}
        className="flex-1 relative flex flex-col items-center justify-center min-h-[58px] py-1 text-slate-800 hover:text-slate-900 transition-colors cursor-pointer"
        type="button"
      >
        <LayoutGrid className="w-5 h-5 mb-0.5 stroke-[2.3]" />
        <span className="text-[11px] font-bold tracking-tight text-[#1E2538]">Más</span>
      </button>
    </nav>
  );
};

