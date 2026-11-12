import React, { useState } from 'react';
import { Lock, Fingerprint, Delete, CheckCircle2, X } from 'lucide-react';
import { hapticTap, hapticKeypadPress, hapticSuccess, hapticWarning } from '../../utils/haptics';

interface BePassWidgetProps {
  onSuccess: () => void;
  onCancel: () => void;
  isCompleted?: boolean;
}

export const BePassWidget: React.FC<BePassWidgetProps> = ({
  onSuccess,
  onCancel,
  isCompleted,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const handleKeyPress = (num: string) => {
    hapticKeypadPress();
    if (pin.length < 6) {
      const next = pin + num;
      setPin(next);
      if (next.length === 6) {
        triggerVerification();
      }
    }
  };

  const handleDelete = () => {
    hapticKeypadPress();
    setPin((p) => p.slice(0, -1));
  };

  const handleClear = () => {
    hapticKeypadPress();
    setPin('');
  };

  const triggerVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      hapticSuccess();
      setVerifiedSuccess(true);
      setTimeout(() => {
        setIsVerifying(false);
        onSuccess();
      }, 700);
    }, 850);
  };

  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-emerald-400/70 shadow-sm space-y-4 bg-gradient-to-b from-[#F2FBF8] to-white">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#13D698] text-white flex items-center justify-center">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-[#0D8F72] uppercase tracking-wider">
            Paso Final · Clave de Seguridad BE Pass
          </span>
        </div>
        {(isCompleted || verifiedSuccess) && (
          <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Autorizado</span>
          </span>
        )}
      </div>

      {!verifiedSuccess ? (
        <>
          <div className="text-center">
            <div className="text-[16px] font-black text-[#1E2538]">
              Ingresa tu clave de 6 dígitos
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Usa los botones grandes abajo o la huella digital.
            </p>
          </div>

          {/* 6 Casilleros de clave */}
          <div className="flex justify-center gap-2.5 my-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-10 h-12 rounded-xl flex items-center justify-center text-xl font-black transition-all ${
                    isFilled
                      ? 'bg-emerald-50 border-2 border-[#13D698] text-emerald-800 scale-105 shadow-xs'
                      : 'bg-slate-100 border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isFilled ? '●' : '_'}
                </div>
              );
            })}
          </div>

          {/* Teclado numérico táctil accesible */}
          <div className="max-w-[280px] mx-auto grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(n)}
                disabled={isVerifying}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-lg transition-transform active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
                type="button"
              >
                {n}
              </button>
            ))}

            <button
              onClick={handleClear}
              disabled={isVerifying || pin.length === 0}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
              type="button"
            >
              Limpiar
            </button>

            <button
              onClick={() => handleKeyPress('0')}
              disabled={isVerifying}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-lg transition-transform active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
              type="button"
            >
              0
            </button>

            <button
              onClick={handleDelete}
              disabled={isVerifying || pin.length === 0}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
              aria-label="Borrar último dígito"
              type="button"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Alternativa Huella y Cancelar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <button
              onClick={() => {
                hapticTap();
                triggerVerification();
              }}
              disabled={isVerifying}
              className="flex items-center gap-1.5 text-[#29398E] font-black hover:underline cursor-pointer py-1"
              type="button"
            >
              <Fingerprint className="w-4 h-4 text-[#29398E]" />
              <span>Autorizar con huella digital</span>
            </button>

            <button
              onClick={() => {
                hapticWarning();
                onCancel();
              }}
              disabled={isVerifying}
              className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer py-1"
              type="button"
            >
              Cancelar
            </button>
          </div>

          {isVerifying && (
            <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-center gap-2 text-emerald-800 text-xs font-black animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              <span>Verificando tu clave BE Pass con el banco…</span>
            </div>
          )}
        </>
      ) : (
        <div className="py-4 text-center space-y-2 animate-pop-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="text-[17px] font-black text-emerald-800">
            ¡Autorización realizada con éxito!
          </div>
          <div className="text-xs font-semibold text-emerald-700">
            Generando tu comprobante oficial...
          </div>
        </div>
      )}
    </div>
  );
};
