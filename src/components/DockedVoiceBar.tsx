import React, { useState } from 'react';
import { Mic, Send, Keyboard, X, VolumeX, AlertCircle } from 'lucide-react';
import { AssistantStatus } from '../types';
import { hapticTap, hapticSelection } from '../utils/haptics';

interface DockedVoiceBarProps {
  status: AssistantStatus;
  statusText: string;
  heardText: string;
  quickChips: string[];
  isMicBlocked: boolean;
  onMicClick: () => void;
  onChipClick: (chipText: string) => void;
  onSubmitText: (text: string) => void;
  onRequestMicPermission: () => void;
}

export const DockedVoiceBar: React.FC<DockedVoiceBarProps> = ({
  status,
  statusText,
  heardText,
  quickChips,
  isMicBlocked,
  onMicClick,
  onChipClick,
  onSubmitText,
  onRequestMicPermission,
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      hapticTap();
      onSubmitText(inputText.trim());
      setInputText('');
      setShowKeyboard(false);
    }
  };

  return (
    <div className="absolute left-0 right-0 bottom-0 z-30 bg-[#102048] border-t-2 border-slate-700/80 px-4 pt-2.5 pb-4 shadow-[0_-8px_24px_rgba(0,0,0,0.3)] select-none">
      {/* Aviso de micrófono bloqueado */}
      {isMicBlocked && (
        <div className="mb-2 bg-red-950/80 border border-red-500/50 rounded-xl p-2.5 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>El micrófono no tiene permiso en este navegador.</span>
          </div>
          <button
            onClick={() => {
              hapticTap();
              onRequestMicPermission();
            }}
            className="px-2.5 py-1 bg-red-600 text-white font-extrabold rounded-lg hover:bg-red-500 active:scale-95 cursor-pointer shrink-0"
            type="button"
          >
            Habilitar
          </button>
        </div>
      )}

      {/* Chips de Respuesta Rápida Contextual */}
      {quickChips.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                hapticSelection();
                onChipClick(chip);
              }}
              className="min-h-[40px] px-3.5 rounded-full text-xs font-black text-white bg-white/12 hover:bg-white/20 border border-white/25 shrink-0 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input de texto manual si está activo */}
      {showKeyboard && (
        <form onSubmit={handleSend} className="flex gap-2 mb-2 pt-1 animate-msg-in">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe lo que necesitas aquí..."
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm font-bold text-white outline-none focus:border-[#2EC4A4]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 bg-[#2EC4A4] disabled:opacity-40 text-[#0D1B3E] font-black rounded-xl hover:bg-[#25ab8e] transition-colors cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setShowKeyboard(false);
            }}
            className="p-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </form>
      )}

      {/* Fila principal del micrófono y estado */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Estado y Transcript */}
        <div className="flex-1 min-w-0">
          <div
            className={`flex items-center gap-2 text-xs font-black tracking-wider uppercase truncate ${
              status === 'listening'
                ? 'text-[#FF8A80]'
                : status === 'waiting'
                ? 'text-[#FFD166]'
                : status === 'thinking'
                ? 'text-[#D5DEFF]'
                : 'text-[#2EC4A4]'
            }`}
          >
            {/* Animación del ecualizador */}
            <span className="flex items-end gap-0.5 h-3 w-4 shrink-0">
              <i
                className={`w-[3px] bg-current rounded-full ${
                  status === 'speaking' || status === 'listening' || status === 'thinking'
                    ? 'eq-bar-1'
                    : 'h-1'
                }`}
              />
              <i
                className={`w-[3px] bg-current rounded-full ${
                  status === 'speaking' || status === 'listening' || status === 'thinking'
                    ? 'eq-bar-2'
                    : 'h-1.5'
                }`}
              />
              <i
                className={`w-[3px] bg-current rounded-full ${
                  status === 'speaking' || status === 'listening' || status === 'thinking'
                    ? 'eq-bar-3'
                    : 'h-1'
                }`}
              />
            </span>
            <span className="truncate">{statusText}</span>
          </div>

          <div className="text-[12px] text-slate-300 italic truncate mt-0.5 min-h-[16px]">
            {heardText ? `“${heardText}”` : 'Presiona el micrófono y habla naturalmente'}
          </div>
        </div>

        {/* Botón teclado toggle */}
        <button
          onClick={() => {
            hapticTap();
            setShowKeyboard(!showKeyboard);
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          title="Escribir con teclado"
          type="button"
        >
          <Keyboard className="w-5 h-5" />
        </button>

        {/* Botón Micrófono con Universal Barge-In */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              hapticTap();
              onMicClick();
            }}
            className={`relative w-15 h-15 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-xl cursor-pointer ${
              status === 'listening'
                ? 'bg-gradient-to-br from-[#ff8a65] to-[#D9383A] text-white ring-4 ring-red-500/30'
                : status === 'speaking'
                ? 'bg-gradient-to-br from-[#4ff2cc] to-[#2EC4A4] text-[#0D1B3E] ring-4 ring-teal-500/30'
                : 'bg-gradient-to-br from-[#4ff2cc] to-[#2EC4A4] text-[#0D1B3E]'
            }`}
            aria-label={
              status === 'speaking'
                ? 'Interrumpir y hablar (Barge-in)'
                : status === 'listening'
                ? 'Pausar micrófono'
                : 'Hablar con el asistente'
            }
            type="button"
          >
            <Mic className="w-7 h-7" />

            {(status === 'listening' || status === 'speaking') && (
              <span
                className={`absolute -inset-1 rounded-full border-2 ${
                  status === 'listening' ? 'border-red-400' : 'border-[#2EC4A4]'
                } animate-ping opacity-75`}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
