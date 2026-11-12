import React from 'react';
import { ShieldCheck, Check, X, CheckCircle2 } from 'lucide-react';
import { Contact } from '../../types';
import { hapticConfirm, hapticWarning } from '../../utils/haptics';

interface RecipientConfirmWidgetProps {
  contact: Contact;
  onConfirm: () => void;
  onReject: () => void;
  isConfirmed?: boolean;
}

export const RecipientConfirmWidget: React.FC<RecipientConfirmWidgetProps> = ({
  contact,
  onConfirm,
  onReject,
  isConfirmed,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-[#2EC4A4]/50 shadow-sm space-y-3.5 bg-gradient-to-b from-[#F2FBF8] to-white">
      {/* Cabecera de Verificación */}
      <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
        <div className="flex items-center gap-2 text-[#0D8F72]">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-wider">
            Verificación de Seguridad
          </span>
        </div>
        {isConfirmed && (
          <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Persona confirmada</span>
          </span>
        )}
      </div>

      {/* Ficha Destinatario */}
      <div className="bg-white rounded-xl p-3.5 border border-emerald-200/70 shadow-xs flex items-center gap-3.5">
        <div className="w-13 h-13 rounded-2xl bg-[#FFF1E2] text-[#F77F00] font-black text-lg flex items-center justify-center shrink-0 border border-orange-200">
          {contact.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-black text-[#1E2538] leading-tight">
            {contact.name}
          </div>
          <div className="text-xs text-slate-700 font-extrabold mt-1">
            RUT: <span className="font-mono text-sm text-[#29398E]">{contact.rut}</span>
          </div>
          <div className="text-xs text-slate-500 font-bold mt-0.5">
            {contact.bank} · {contact.account}
          </div>
        </div>
      </div>

      <div className="text-center text-xs font-extrabold text-slate-600">
        Por tu seguridad: Comprueba que el nombre y RUT coincidan con quien deseas transferir.
      </div>

      {/* Botones de acción accesibles */}
      {!isConfirmed ? (
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={() => {
              hapticConfirm();
              onConfirm();
            }}
            className="flex-1 min-h-[48px] rounded-xl bg-[#29398E] hover:bg-[#1f2c73] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Sí, es la persona correcta</span>
          </button>
          <button
            onClick={() => {
              hapticWarning();
              onReject();
            }}
            className="sm:w-36 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>Buscar otra</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
          ✓ Confirmaste que transferirás a {contact.name}.
        </div>
      )}
    </div>
  );
};
