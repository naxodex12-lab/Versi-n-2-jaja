import React from 'react';
import { Check, Share2, Copy, ArrowRight, RotateCcw } from 'lucide-react';
import { TransactionReceipt } from '../../types';
import { money } from '../../utils/speech';
import { hapticTap } from '../../utils/haptics';

interface ReceiptWidgetProps {
  receipt: TransactionReceipt;
  onShare: () => void;
  onCopy: () => void;
  onNewTransfer: () => void;
  onGoHome: () => void;
}

export const ReceiptWidget: React.FC<ReceiptWidgetProps> = ({
  receipt,
  onShare,
  onCopy,
  onNewTransfer,
  onGoHome,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500 shadow-md space-y-4 animate-pop-in bg-gradient-to-b from-white to-[#F4F9F7]">
      {/* Sello de Éxito */}
      <div className="text-center pb-2 border-b border-emerald-100">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#0D8F72] flex items-center justify-center mx-auto mb-2 border-2 border-[#2EC4A4]">
          <Check className="w-7 h-7 stroke-[3]" />
        </div>
        <div className="text-[19px] font-black text-slate-900 font-['Nunito']">
          ¡Transferencia Realizada!
        </div>
        <div className="text-xs font-bold text-emerald-700 mt-0.5">
          El dinero ya fue enviado a la cuenta de destino
        </div>
      </div>

      {/* Tarjeta de comprobante tipo recibo */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs space-y-2.5 text-sm divide-y divide-slate-100">
        <div className="pb-2">
          <div className="text-xs font-bold text-slate-500">Monto transferido:</div>
          <div className="text-[24px] font-black text-[#29398E] font-['Nunito'] tabular-nums mt-0.5">
            {money(receipt.amount)}
          </div>
        </div>

        <div className="pt-2 pb-2">
          <div className="text-xs font-bold text-slate-500">Destinatario:</div>
          <div className="text-[15px] font-black text-slate-900 mt-0.5">
            {receipt.destName}
          </div>
          <div className="text-xs text-slate-600 font-mono">
            RUT: {receipt.destRut}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {receipt.destBank} · {receipt.destAccount}
          </div>
        </div>

        <div className="pt-2 pb-2 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-bold">Cuenta de origen:</span>
          <span className="font-extrabold text-slate-800">{receipt.sourceAccount}</span>
        </div>

        <div className="pt-2 pb-2 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-bold">Fecha y hora:</span>
          <span className="font-bold text-slate-800">{receipt.date}</span>
        </div>

        <div className="pt-2 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-bold">N° de operación (Folio):</span>
          <span className="font-black text-[#29398E] font-mono">{receipt.opNumber}</span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={() => {
            hapticTap();
            onShare();
          }}
          className="min-h-[46px] rounded-xl bg-[#29398E] text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#1f2c73] transition-all active:scale-[0.98] cursor-pointer"
          type="button"
        >
          <Share2 className="w-4 h-4" />
          <span>Compartir comprobante</span>
        </button>

        <button
          onClick={() => {
            hapticTap();
            onCopy();
          }}
          className="min-h-[46px] rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-[0.98] cursor-pointer"
          type="button"
        >
          <Copy className="w-4 h-4 text-slate-500" />
          <span>Copiar comprobante</span>
        </button>
      </div>

      <div className="flex gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={() => {
            hapticTap();
            onNewTransfer();
          }}
          className="flex-1 py-2 text-center text-[#29398E] hover:underline text-xs font-black cursor-pointer"
          type="button"
        >
          + Hacer otra transferencia
        </button>
        <button
          onClick={() => {
            hapticTap();
            onGoHome();
          }}
          className="flex-1 py-2 text-center text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
          type="button"
        >
          Volver a mis cuentas
        </button>
      </div>
    </div>
  );
};
