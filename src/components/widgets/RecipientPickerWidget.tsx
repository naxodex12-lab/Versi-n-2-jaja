import React, { useState } from 'react';
import { Search, ChevronRight, CheckCircle2, UserCheck, X } from 'lucide-react';
import { Contact } from '../../types';
import { norm } from '../../utils/speech';
import { hapticTap, hapticSelection } from '../../utils/haptics';

interface RecipientPickerWidgetProps {
  contacts: Record<string, Contact>;
  selectedContactId: string | null;
  onSelectContact: (contact: Contact) => void;
  onSwitchToNewAccount?: () => void;
  isCompleted?: boolean;
}

export const RecipientPickerWidget: React.FC<RecipientPickerWidgetProps> = ({
  contacts,
  selectedContactId,
  onSelectContact,
  onSwitchToNewAccount,
  isCompleted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavs, setFilterFavs] = useState(false);

  const filteredContacts = Object.values(contacts).filter((c) => {
    if (filterFavs && !c.isFavorite) return false;
    if (!searchQuery) return true;
    const q = norm(searchQuery);
    return (
      norm(c.name).includes(q) ||
      norm(c.rut).includes(q) ||
      norm(c.bank).includes(q) ||
      norm(c.account).includes(q)
    );
  });

  filteredContacts.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-slate-200/80 shadow-sm space-y-3">
      {/* Cabecera del widget */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#29398E]" />
          <span className="text-xs font-black text-[#535F7A] uppercase tracking-wider">
            Paso 2 · Selecciona al destinatario
          </span>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Destinatario elegido</span>
          </span>
        )}
      </div>

      {/* Buscador táctil simplificado */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-[#29398E] focus-within:bg-white transition-colors">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Escribe el nombre o RUT..."
            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                hapticSelection();
                setSearchQuery('');
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => {
            hapticSelection();
            setFilterFavs(!filterFavs);
          }}
          className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
            filterFavs
              ? 'bg-[#29398E] text-white border-[#29398E]'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          type="button"
        >
          ★ Favoritos
        </button>
      </div>

      {/* Lista de contactos */}
      <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
        {filteredContacts.length === 0 ? (
          <div className="py-6 text-center text-sm font-bold text-slate-500">
            No encontramos a nadie con “{searchQuery}”. Intenta con otro nombre.
          </div>
        ) : (
          filteredContacts.map((c) => {
            const isSelected = selectedContactId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  hapticTap();
                  onSelectContact(c);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF9F2] border-2 border-[#F77F00] shadow-sm'
                    : 'hover:bg-[#E8ECFB]/50 border-2 border-transparent'
                }`}
                type="button"
              >
                {/* Avatar */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#F77F00] text-white shadow-sm'
                      : 'bg-[#FFF1E2] text-[#F77F00]'
                  }`}
                >
                  {c.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-black text-[#1E2538] leading-tight truncate">
                    {c.name}
                  </div>
                  <div className="text-xs text-slate-600 font-semibold truncate mt-0.5">
                    {c.bank} · {c.account}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    RUT: {c.rut}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {isSelected ? (
                    <span className="text-xs font-black text-[#F77F00] bg-orange-100/70 px-2.5 py-1 rounded-full">
                      ✓ Seleccionado
                    </span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {onSwitchToNewAccount && !isCompleted && (
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              hapticTap();
              onSwitchToNewAccount();
            }}
            className="text-xs font-black text-[#29398E] hover:underline cursor-pointer"
            type="button"
          >
            + ¿No está en la lista? Ingresar una cuenta nueva
          </button>
        </div>
      )}
    </div>
  );
};
