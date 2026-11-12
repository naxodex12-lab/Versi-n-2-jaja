import React, { useState } from 'react';
import { Eye, EyeOff, MoreVertical, Smartphone, Share2, ChevronRight } from 'lucide-react';
import { money } from '../utils/speech';

interface AccountCardsProps {
  balance: number;
  onStartTransfer: () => void;
  onNotify: (msg: string) => void;
}

export const AccountCards: React.FC<AccountCardsProps> = ({
  balance,
  onStartTransfer,
  onNotify,
}) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="px-3.5 pb-6 -mt-18 relative space-y-3">
      {/* Tarjeta CuentaRUT Principal */}
      <article className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(25,35,70,0.06)] border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="text-[15px] text-[#1E2538] font-bold tracking-tight">
            <span className="font-extrabold">CuentaRUT</span>{' '}
            <span className="font-semibold text-slate-600">00020920713</span>
          </div>
          <button
            onClick={() => onNotify('Opciones adicionales de cuenta.')}
            className="text-[#29398E] p-1 rounded-full hover:bg-slate-50 transition-colors"
            aria-label="Más opciones de cuenta"
            type="button"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 mt-1.5">
          <span className="text-[32px] font-black tracking-tight text-[#1E2538] tabular-nums font-['Nunito']">
            {showBalance ? money(balance) : '$ •••••••'}
          </span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-[#29398E] p-1.5 rounded-full hover:bg-indigo-50/50 transition-colors focus:outline-none"
            aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            type="button"
          >
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-[13px] font-bold text-[#535F7A] mt-0.5">Saldo disponible</div>

        <div className="flex gap-2.5 mt-3.5">
          <button
            onClick={() => onNotify('Historial de movimientos de CuentaRUT.')}
            className="flex-1 min-h-[44px] rounded-full bg-[#29398E] text-white font-extrabold text-[15px] shadow-sm hover:bg-[#1f2c73] transition-all active:scale-[0.98]"
            type="button"
          >
            Movimientos
          </button>
          <button
            onClick={() => onNotify('Cartolas periódicas disponibles para descarga en PDF.')}
            className="flex-1 min-h-[44px] rounded-full border-2 border-[#29398E] text-[#29398E] bg-white font-extrabold text-[15px] hover:bg-indigo-50/50 transition-all active:scale-[0.98]"
            type="button"
          >
            Cartolas
          </button>
        </div>
      </article>

      {/* Tarjeta Promocional Crédito */}
      <article className="bg-white rounded-2xl overflow-hidden flex min-h-[136px] shadow-[0_2px_10px_rgba(25,35,70,0.06)] border border-slate-100">
        <div className="flex-1 p-3.5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#1E2538] leading-tight">
              Pide tu Tarjeta de Crédito
            </h3>
            <p className="text-[13px] text-slate-600 mt-1 leading-snug">
              Solicita ahora tu tarjeta y disfruta de todos los beneficios.
            </p>
          </div>
          <button
            onClick={() => onNotify('Solicitud de contacto enviada a tu ejecutivo.')}
            className="self-start min-h-[36px] px-4 rounded-full bg-[#29398E] text-white font-extrabold text-xs shadow-sm hover:bg-[#1f2c73] transition-all active:scale-[0.98]"
            type="button"
          >
            Contáctenme
          </button>
        </div>
        <div className="w-[36%] bg-gradient-to-br from-[#9db7e8] to-[#5e7fd0] rounded-tl-[44px] flex items-center justify-center p-3 text-white">
          <Smartphone className="w-11 h-11 drop-shadow-sm opacity-90" />
        </div>
      </article>

      {/* Puntos de carrusel */}
      <div className="flex justify-center gap-2 -mt-1 pb-1" aria-hidden="true">
        <span className="w-2 h-2 rounded-full bg-[#F77F00]" />
        <span className="w-2 h-2 rounded-full bg-[#D0D4DE]" />
        <span className="w-2 h-2 rounded-full bg-[#D0D4DE]" />
        <span className="w-2 h-2 rounded-full bg-[#D0D4DE]" />
      </div>

      {/* Tus Tarjetas */}
      <div className="pt-1">
        <h2 className="text-[16px] font-extrabold text-[#1E2538] mb-2 px-0.5">Tus tarjetas</h2>
        <article className="relative bg-white rounded-2xl pl-6 pr-4 py-3.5 min-h-[112px] shadow-[0_2px_10px_rgba(25,35,70,0.06)] border border-slate-100 overflow-hidden flex flex-col justify-between">
          {/* Franja izquierda de color oficial */}
          <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-[#1d3d97_50%] to-[#ef3c4a_50%]" />

          <div className="flex justify-between items-start">
            <div>
              <b className="text-[15px] font-extrabold text-[#1E2538] block leading-tight">
                Tarjeta CuentaRUT
              </b>
              <div className="text-[14px] text-slate-700 font-semibold tracking-wider mt-1 font-mono">
                **** **** **** 1706
              </div>
            </div>
            {/* Chip EMV Dorado SVG */}
            <svg
              className="w-8 h-6 rounded border border-amber-600/30 shadow-inner"
              viewBox="0 0 34 26"
              fill="none"
              aria-label="Chip EMV"
            >
              <rect width="34" height="26" rx="4" fill="#D4AF37" />
              <path d="M0 9h34M0 17h34M12 0v26M22 0v26" stroke="#997A15" strokeWidth="0.8" />
              <rect x="12" y="9" width="10" height="8" rx="2" fill="#E8C85A" stroke="#997A15" strokeWidth="0.8" />
            </svg>
          </div>

          <div className="flex justify-between items-end mt-3">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              Débito
            </span>
            {/* VISA Logo SVG */}
            <svg className="w-12 h-4" viewBox="0 0 48 16" fill="none" aria-label="VISA">
              <path
                d="M19.2 1.2L12.6 15.2H8.3L5.1 4.1C4.9 3.3 4.7 3 4.1 2.7C3.1 2.2 1.5 1.7 0 1.4L0.1 1L7 1C7.9 1 8.7 1.6 8.9 2.6L10.6 11.7L14.9 1.2H19.2ZM36 10.4C36 6.5 30.5 6.3 30.5 4.5C30.5 3.9 31.1 3.2 32.3 3C32.9 2.9 34.6 2.8 36.3 3.6L37 0.7C36 0.3 34.7 0 33.1 0C29 0 26.2 2.2 26.2 5.3C26.2 7.6 28.3 8.9 29.8 9.7C31.4 10.5 31.9 11 31.9 11.7C31.9 12.8 30.6 13.3 29.3 13.3C27.3 13.3 26.1 13 24.8 12.4L24.1 15.5C25.4 16.1 27.2 16.5 29.1 16.5C33.5 16.5 36 14.3 36 10.4ZM46.6 15.2H42.7C41.8 15.2 41.1 14.7 40.8 13.9L34.8 1.2H39.2L41.9 8.2L44.5 1.2H48.4L46.6 15.2ZM25.2 1.2L21.8 15.2H17.7L21.1 1.2H25.2Z"
                fill="#1A2F87"
              />
            </svg>
          </div>
        </article>
      </div>

      {/* Tus Ahorros */}
      <div className="pt-1">
        <h2 className="text-[16px] font-extrabold text-[#1E2538] mb-2 px-0.5">Tus ahorros</h2>
        <article className="relative bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(25,35,70,0.06)] border border-slate-100">
          <div className="flex justify-between items-start pr-8">
            <div>
              <b className="text-[15px] font-extrabold text-[#1E2538] block leading-snug">
                Plazo Vivienda Giro Diferido
              </b>
              <div className="text-[13px] text-slate-500 font-semibold mt-0.5 font-mono">
                30460553225
              </div>
            </div>
            <button
              onClick={() => onNotify('Detalle de cuenta de ahorro compartido.')}
              className="text-[#29398E] p-1.5 rounded-full hover:bg-slate-50 transition-colors"
              aria-label="Compartir cuenta de ahorro"
              type="button"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[24px] font-black text-[#1E2538] font-['Nunito'] tabular-nums">
              $307.529
            </span>
            <Eye className="w-4 h-4 text-[#29398E]" />
          </div>

          <div className="text-[12px] font-bold text-[#535F7A] mt-0.5">Total ahorrado</div>

          <button
            onClick={() => onNotify('Visualizando detalles del plan de ahorro.')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#E8ECFB] text-[#29398E] flex items-center justify-center hover:bg-[#d8e0f7] transition-transform active:scale-95"
            aria-label="Ver cuenta de ahorro"
            type="button"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </article>
      </div>
    </div>
  );
};
