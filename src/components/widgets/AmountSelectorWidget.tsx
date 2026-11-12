import React, { useState } from 'react';
import { DollarSign, CheckCircle2, AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { money } from '../../utils/speech';
import { hapticTap, hapticSelection } from '../../utils/haptics';

interface AmountSelectorWidgetProps {
  balance: number;
  selectedAmount: number | null;
  onConfirmAmount: (amount: number) => void;
  isCompleted?: boolean;
}

export const AmountSelectorWidget: React.FC<AmountSelectorWidgetProps> = ({
  balance,
  selectedAmount,
  onConfirmAmount,
  isCompleted,
}) => {
  const [currentVal, setCurrentVal] = useState<number>(selectedAmount || 30000);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customText, setCustomText] = useState(String(selectedAmount || 30000));

  const quickAmounts = [
    { value: 5000, label: '$5.000', sub: '5 lucas' },
    { value: 10000, label: '$10.000', sub: '10 lucas' },
    { value: 20000, label: '$20.000', sub: '20 lucas' },
    { value: 30000, label: '$30.000', sub: '30 lucas' },
    { value: 50000, label: '$50.000', sub: '50 lucas' },
    { value: 100000, label: '$100.000', sub: '100 lucas' },
  ];

  const hasExceeded = currentVal > balance;
  const remaining = balance - currentVal;

  const handleSelectQuick = (val: number) => {
    hapticTap();
    setCurrentVal(val);
    setCustomText(String(val));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setCustomText(digits);
    const parsed = parseInt(digits, 10);
    if (!isNaN(parsed)) {
      setCurrentVal(parsed);
    } else {
      setCurrentVal(0);
    }
  };

  const handleAddAmount = (addVal: number) => {
    hapticTap();
    const newVal = currentVal + addVal;
    setCurrentVal(newVal);
    setCustomText(String(newVal));
  };

  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-slate-200/80 shadow-sm space-y-3.5">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#F77F00]" />
          <span className="text-xs font-black text-[#535F7A] uppercase tracking-wider">
            Paso 3 · ¿Cuánto dinero vas a transferir?
          </span>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Monto fijado</span>
          </span>
        )}
      </div>

      {/* Visor gigante de monto */}
      <div
        className={`p-4 rounded-2xl text-center border-2 transition-all ${
          hasExceeded
            ? 'bg-red-50/70 border-red-400 text-red-600'
            : 'bg-[#FFFDF9] border-[#F77F00] text-[#1E2538]'
        }`}
      >
        <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
          Monto a enviar
        </div>
        <div className="text-[34px] font-black tracking-tight font-['Nunito'] tabular-nums leading-none">
          {money(currentVal)}
        </div>

        {/* Desglose de saldo restante para tranquilidad */}
        {!hasExceeded ? (
          <div className="mt-2 text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
            <span>Saldo en CuentaRUT: <b>{money(balance)}</b></span>
            <span>·</span>
            <span className="text-emerald-700">
              Te quedarán: <b>{money(remaining)}</b>
            </span>
          </div>
        ) : (
          <div className="mt-2 text-xs font-extrabold text-red-600 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>El monto supera tu saldo disponible ({money(balance)}).</span>
          </div>
        )}
      </div>

      {/* Fichas rápidas de dinero chileno */}
      <div>
        <div className="text-xs font-extrabold text-slate-600 mb-2">
          Toca un monto sugerido:
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickAmounts.map((q) => {
            const isPicked = currentVal === q.value;
            return (
              <button
                key={q.value}
                onClick={() => handleSelectQuick(q.value)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border-2 transition-all active:scale-95 cursor-pointer ${
                  isPicked
                    ? 'border-[#29398E] bg-[#29398E] text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                }`}
                type="button"
              >
                <span className="text-[14px] font-black">{q.label}</span>
                <span
                  className={`text-[10px] font-bold ${
                    isPicked ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {q.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sumadores rápidos e input manual */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-500">Sumar:</span>
          <button
            onClick={() => handleAddAmount(1000)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 cursor-pointer"
            type="button"
          >
            +$1.000
          </button>
          <button
            onClick={() => handleAddAmount(5000)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 cursor-pointer"
            type="button"
          >
            +$5.000
          </button>
          <button
            onClick={() => handleAddAmount(10000)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 cursor-pointer"
            type="button"
          >
            +$10.000
          </button>
        </div>

        <button
          onClick={() => {
            hapticSelection();
            setIsCustomMode(!isCustomMode);
          }}
          className="text-[#29398E] font-black hover:underline cursor-pointer ml-auto"
          type="button"
        >
          {isCustomMode ? 'Ocultar teclado' : 'Escribir otro monto'}
        </button>
      </div>

      {isCustomMode && (
        <div className="flex items-center gap-2 pt-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={customText}
              onChange={handleCustomChange}
              placeholder="Ingresa los pesos"
              className="w-full pl-7 pr-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-[#29398E]"
            />
          </div>
          <button
            onClick={() => {
              const parsed = parseInt(customText.replace(/\D/g, ''), 10);
              if (!isNaN(parsed) && parsed > 0) {
                hapticTap();
                setCurrentVal(parsed);
                setIsCustomMode(false);
              }
            }}
            className="px-4 py-2 bg-[#29398E] text-white text-xs font-bold rounded-xl"
            type="button"
          >
            Listo
          </button>
        </div>
      )}

      {/* Botón de Confirmación del Monto */}
      <button
        onClick={() => {
          hapticTap();
          onConfirmAmount(currentVal);
        }}
        disabled={hasExceeded || currentVal <= 0}
        className="w-full min-h-[48px] rounded-xl bg-[#29398E] hover:bg-[#1f2c73] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        type="button"
      >
        <span>Fijar este monto ({money(currentVal)})</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
