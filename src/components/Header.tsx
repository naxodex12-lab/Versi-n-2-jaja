import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

interface HeaderProps {
  onNotify?: (msg: string) => void;
  onResetToHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNotify, onResetToHome }) => {
  return (
    <header className="relative bg-gradient-to-r from-[#F77F00] to-[#FF9A3C] h-[148px] rounded-b-[44px] px-4 pt-3 flex items-start justify-between shadow-sm">
      {/* Imagotipo oficial BancoEstado */}
      <button
        onClick={onResetToHome}
        className="flex items-center pt-1 cursor-pointer transition-opacity active:opacity-85 text-left focus:outline-none"
        aria-label="BancoEstado - Ir a Inicio"
      >
        <div className="flex items-center gap-2">
          {/* Isotipo edificio BancoEstado */}
          <svg className="w-9 h-9 drop-shadow-md shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="8" fill="#D01026" />
            <rect y="36" width="48" height="12" fill="#003E7E" />
            <polygon points="0,31 16,24 16,32 0,37" fill="#F26822" />
            <polygon points="0,21 16,14 16,21 0,28" fill="#F26822" />
            <polygon points="31,6 46,14 46,37 31,37" fill="#F26822" />
            <polygon points="16,14 31,6 31,37 16,37" fill="#FFFFFF" />
            <polygon points="16,14 22,10 31,6 23,17" fill="#FFFFFF" />
          </svg>
          <div className="flex flex-col">
            <span className="text-white text-2xl font-black tracking-tight leading-none drop-shadow-sm font-['Nunito']">
              BancoEstado
            </span>
            <span className="text-orange-100 text-[10px] font-bold tracking-wider uppercase opacity-90 mt-0.5">
              Desde 1855
            </span>
          </div>
        </div>
      </button>

      {/* Acciones de cabecera */}
      <div className="flex items-center gap-1.5 pt-1">
        <button
          onClick={() => onNotify?.('Buscar estará disponible en la versión final.')}
          className="w-9 h-9 rounded-full bg-[#FFF1E2] text-[#29398E] flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          aria-label="Buscar en la aplicación"
          type="button"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNotify?.('No tienes notificaciones pendientes.')}
          className="w-9 h-9 rounded-full bg-[#FFF1E2] text-[#29398E] flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          aria-label="Notificaciones"
          type="button"
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNotify?.('Menú de configuración de BancoEstado.')}
          className="w-9 h-9 rounded-full bg-[#FFF1E2] text-[#29398E] flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          aria-label="Menú principal"
          type="button"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
