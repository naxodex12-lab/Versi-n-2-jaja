import React from 'react';
import { UserCheck, UserPlus, CheckCircle2 } from 'lucide-react';
import { hapticTap } from '../../utils/haptics';

export type TransferDestinationType = 'saved_contact' | 'new_account';

interface TransferTypeWidgetProps {
  selectedType: TransferDestinationType | string | null;
  onSelectType: (type: TransferDestinationType) => void;
  isCompleted?: boolean;
}

export const TransferTypeWidget: React.FC<TransferTypeWidgetProps> = ({
  selectedType,
  onSelectType,
  isCompleted,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-slate-200/80 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <span className="text-xs font-black text-[#535F7A] uppercase tracking-wider">
          Paso 1 · ¿A quién deseas transferir?
        </span>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Seleccionado</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Opción 1: A un contacto guardado */}
        <button
          onClick={() => {
            hapticTap();
            onSelectType('saved_contact');
          }}
          className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.98] cursor-pointer ${
            selectedType === 'saved_contact' || selectedType === 'third_party'
              ? 'border-[#29398E] bg-[#E8ECFB]/70 shadow-sm ring-2 ring-[#29398E]/15'
              : 'border-slate-200 bg-white hover:border-[#29398E]/50 hover:bg-slate-50'
          }`}
          type="button"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              selectedType === 'saved_contact' || selectedType === 'third_party'
                ? 'bg-[#29398E] text-white'
                : 'bg-[#E8ECFB] text-[#29398E]'
            }`}
          >
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-black text-[#1E2538] leading-tight">
              A un contacto guardado
            </div>
            <div className="text-xs text-slate-600 font-semibold mt-1 leading-snug">
              Familiares, amigos o cuentas a las que ya les has transferido antes.
            </div>
            <div className="mt-2 inline-flex items-center text-xs font-black text-[#29398E]">
              {selectedType === 'saved_contact' || selectedType === 'third_party'
                ? '✓ Seleccionado'
                : 'Ver contactos guardados →'}
            </div>
          </div>
        </button>

        {/* Opción 2: A una cuenta nueva */}
        <button
          onClick={() => {
            hapticTap();
            onSelectType('new_account');
          }}
          className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.98] cursor-pointer ${
            selectedType === 'new_account'
              ? 'border-[#29398E] bg-[#E8ECFB]/70 shadow-sm ring-2 ring-[#29398E]/15'
              : 'border-slate-200 bg-white hover:border-[#29398E]/50 hover:bg-slate-50'
          }`}
          type="button"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              selectedType === 'new_account'
                ? 'bg-[#29398E] text-white'
                : 'bg-[#FFF1E2] text-[#F77F00]'
            }`}
          >
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-black text-[#1E2538] leading-tight">
              A una cuenta nueva
            </div>
            <div className="text-xs text-slate-600 font-semibold mt-1 leading-snug">
              Ingresa los datos de una persona nueva para transferirle por primera vez.
            </div>
            <div className="mt-2 inline-flex items-center text-xs font-black text-[#F77F00]">
              {selectedType === 'new_account' ? '✓ Seleccionado' : 'Ingresar cuenta nueva →'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
