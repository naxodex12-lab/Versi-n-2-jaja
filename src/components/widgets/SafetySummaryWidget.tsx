import React from 'react';
import { Shield, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Contact } from '../../types';
import { money } from '../../utils/speech';
import { hapticTap } from '../../utils/haptics';

interface SafetySummaryWidgetProps {
  contact: Contact;
  amount: number;
  balance: number;
  onProceedToAuth: () => void;
  onModify: () => void;
  isCompleted?: boolean;
}

export const SafetySummaryWidget: React.FC<SafetySummaryWidgetProps> = ({
  contact,
  amount,
  balance,
  onProceedToAuth,
  onModify,
  isCompleted,
}) => {
  const remaining = balance - amount;

  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-[#29398E]/30 shadow-sm space-y-3.5 bg-gradient-to-b from-[#E8ECFB]/30 to-white">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
        <div className="flex items-center gap-2 text-[#29398E]">
          <Shield className="w-5 h-5 text-[#29398E]" />
          <span className="text-xs font-black uppercase tracking-wider">
            Paso 4 · Resumen Claro y Sin Letra Chica
          </span>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmado</span>
          </span>
        )}
      </div>

      {/* Tarjeta de Resumen Detallada */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs space-y-2.5 text-sm">
        <div className="flex justify-between items-start pb-2 border-b border-slate-100">
          <span className="text-slate-500 font-bold">Destinatario:</span>
          <div className="text-right">
            <span className="font-black text-[#1E2538] block">{contact.name}</span>
            <span className="text-xs text-slate-500 font-semibold">
              RUT {contact.rut} · {contact.bank}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <span className="text-slate-500 font-bold">Monto a transferir:</span>
          <span className="text-lg font-black text-[#29398E] font-['Nunito'] tabular-nums">
            {money(amount)}
          </span>
        </div>

        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <span className="text-slate-500 font-bold">Costo de transferencia:</span>
          <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
            $0 (Gratis)
          </span>
        </div>

        <div className="flex justify-between items-center pt-0.5">
          <span className="text-slate-600 font-extrabold">Saldo que te quedará:</span>
          <span className="font-black text-slate-900 tabular-nums">
            {money(remaining)}
          </span>
        </div>
      </div>

      <div className="p-2.5 bg-blue-50/70 rounded-xl text-xs font-semibold text-[#102048] leading-relaxed">
        💡 <b>Tranquilidad:</b> Tu dinero aún no ha salido de tu cuenta. En el siguiente paso te pediremos tu clave secreta BE Pass para autorizar.
      </div>

      {/* Botones de acción */}
      {!isCompleted ? (
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={() => {
              hapticTap();
              onProceedToAuth();
            }}
            className="flex-1 min-h-[48px] rounded-xl bg-[#29398E] hover:bg-[#1f2c73] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <span>Autorizar con BE Pass</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              hapticTap();
              onModify();
            }}
            className="sm:w-36 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Modificar datos</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-indigo-50 text-[#29398E] text-xs font-bold text-center border border-indigo-200">
          ✓ Resumen aceptado. Procediendo con BE Pass...
        </div>
      )}
    </div>
  );
};
