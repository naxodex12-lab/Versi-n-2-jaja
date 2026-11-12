import React, { useState } from 'react';
import { UserPlus, ArrowRight, X, Building2, CheckCircle2 } from 'lucide-react';
import { Contact } from '../../types';
import { hapticTap, hapticSuccess } from '../../utils/haptics';

interface NewAccountWidgetProps {
  onConfirmNewAccount: (contact: Contact) => void;
  onCancel: () => void;
  isCompleted?: boolean;
}

const CHILEAN_BANKS = [
  'BancoEstado',
  'Banco de Chile',
  'Santander',
  'BCI',
  'Scotiabank',
  'Banco Falabella',
  'Banco BICE',
  'Banco Security',
  'Tenpo Prepago',
  'Mach',
];

export const NewAccountWidget: React.FC<NewAccountWidgetProps> = ({
  onConfirmNewAccount,
  onCancel,
  isCompleted,
}) => {
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [bank, setBank] = useState('BancoEstado');
  const [accountType, setAccountType] = useState('CuentaRUT / Vista');
  const [accountNumber, setAccountNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Por favor ingresa el nombre de la persona.');
      return;
    }

    if (!rut.trim() || rut.length < 7) {
      setErrorMsg('Ingresa un RUT válido (ejemplo: 12.345.678-9).');
      return;
    }

    if (!accountNumber.trim()) {
      setErrorMsg('Ingresa el número de cuenta.');
      return;
    }

    setErrorMsg(null);
    hapticSuccess();

    // Generar iniciales
    const parts = name.trim().split(/\s+/);
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const newContact: Contact = {
      id: `new-${Date.now()}`,
      name: name.trim(),
      rut: rut.trim(),
      bank,
      account: `${accountType} ${accountNumber.trim()}`,
      aliases: [name.toLowerCase().trim()],
      initials,
      isFavorite: false,
    };

    onConfirmNewAccount(newContact);
  };

  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-slate-200/80 shadow-sm space-y-3.5">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2 text-[#29398E]">
          <UserPlus className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            Nueva Cuenta de Destino
          </span>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Datos ingresados</span>
          </span>
        )}
      </div>

      <p className="text-xs text-slate-600 font-semibold leading-relaxed">
        Ingresa con calma los datos del nuevo destinatario. En el siguiente paso verificaremos todo juntos antes de transferir.
      </p>

      {!isCompleted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Nombre y apellido de la persona
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ej: Carmen Gloria Morales"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-[#29398E] bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* RUT */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              RUT de la persona
            </label>
            <input
              type="text"
              value={rut}
              onChange={(e) => {
                setRut(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ej: 14.892.301-4"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-mono font-bold text-slate-900 outline-none focus:border-[#29398E] bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Banco */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Banco de destino
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-[#29398E] bg-slate-50 focus:bg-white transition-colors cursor-pointer"
              >
                {CHILEAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de cuenta */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Tipo de cuenta
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-[#29398E] bg-slate-50 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="CuentaRUT / Vista">CuentaRUT / Vista</option>
                <option value="Cuenta Corriente">Cuenta Corriente</option>
                <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
              </select>
            </div>
          </div>

          {/* Número de cuenta */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Número de cuenta
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ej: 00148923014"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-mono font-bold text-slate-900 outline-none focus:border-[#29398E] bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Mensaje de error si falta algo */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200 animate-pop-in">
              {errorMsg}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 min-h-[46px] rounded-xl bg-[#29398E] hover:bg-[#1f2c73] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Continuar con esta cuenta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onCancel();
              }}
              className="sm:w-32 min-h-[46px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>Cancelar</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
          ✓ Datos del nuevo destinatario registrados para esta operación.
        </div>
      )}
    </div>
  );
};
