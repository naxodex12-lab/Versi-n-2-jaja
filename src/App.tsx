/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Header } from './components/Header';
import { AccountCards } from './components/AccountCards';
import { BottomNav } from './components/BottomNav';
import { CopilotTimeline } from './components/CopilotTimeline';
import { DockedVoiceBar } from './components/DockedVoiceBar';
import { LoadingHalo } from './components/LoadingHalo';
import { DraggableFAB } from './components/DraggableFAB';
import { BankBuildingIcon } from './components/BankBuildingIcon';
import { CONTACTS, INITIAL_BALANCE, DEFAULT_ORIGIN_ACCOUNT } from './data/contacts';
import {
  TimelineMessage,
  Contact,
  TransactionReceipt,
  AssistantStatus,
} from './types';
import {
  norm,
  money,
  spokenMoney,
  rutSpoken,
  firstName,
  extractAmount,
  extractContact,
  yesNo,
  detectIntent,
  hasAny,
  humanizeSpokenText,
  findBestNaturalVoice,
  isSpokenEcho,
} from './utils/speech';
import { hapticTap, hapticConfirm, hapticSuccess, hapticWarning } from './utils/haptics';

export default function App() {
  // Referencia al contenedor de la aplicación para límites del botón desplazable
  const phoneContainerRef = useRef<HTMLDivElement>(null);

  // Estado de saldos y finanzas
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);

  // Modo Copiloto Asistido: true cuando se abre el asistente
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const isCopilotOpenRef = useRef(false);
  useEffect(() => {
    isCopilotOpenRef.current = isCopilotOpen;
  }, [isCopilotOpen]);

  // Control de flujo de bienvenida y barge-in del usuario
  const welcomeActiveRef = useRef<boolean>(false);

  // Control estricto anti-eco acústico y auto-escucha
  const lastSpeechEndedAtRef = useRef<number>(0);
  const recentSpokenListRef = useRef<string[]>([]);

  // Datos de la transacción en curso
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);

  // Estado del motor de voz y asistente
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus>('idle');
  const [assistantStatusText, setAssistantStatusText] = useState('TOCA PARA HABLAR');
  const [heardText, setHeardText] = useState('');
  const [isMicBlocked, setIsMicBlocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingHalo, setIsLoadingHalo] = useState(false);

  // Referencias de audio y reconocimiento
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const currentUtterFinishRef = useRef<(() => void) | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const toastTimerRef = useRef<any>(null);
  const startListeningRef = useRef<(force?: boolean) => void>(() => {});
  const handleUserUtteranceRef = useRef<(raw: string) => Promise<void>>(async () => {});

  // Hilo de mensajes interactivos (Timeline) para el Modo Copiloto Asistido
  // Comienza con el saludo cálido inicial del Asistente
  const [messages, setMessages] = useState<TimelineMessage[]>([
    {
      id: 'welcome-greeting',
      sender: 'assistant',
      text: '¡Hola! Qué gusto saludarte. Soy tu asistente de BancoEstado y estoy aquí para acompañarte paso a paso con total calma.',
      spokenText:
        '¡Hola!, Qué gusto saludarte. Soy tu asistente de BancoEstado y estoy aquí para acompañarte paso a paso con total calma.',
      timestamp: 'Ahora',
      widgetType: 'none',
    },
  ]);

  // Toast de retroalimentación
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3400);
  }, []);

  // Transición corporativa BancoEstado
  const showHalo = useCallback((durationMs = 600) => {
    return new Promise<void>((resolve) => {
      setIsLoadingHalo(true);
      setTimeout(() => {
        setIsLoadingHalo(false);
        resolve();
      }, durationMs);
    });
  }, []);

  // Configuración de la voz más humana y natural disponible en el dispositivo
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const vs = window.speechSynthesis.getVoices() || [];
      const best = findBestNaturalVoice(vs);
      if (best) {
        voiceRef.current = best;
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Interrupción inmediata de voz (Barge-In) universal para Audio y SpeechSynthesis
  const cancelSpeech = useCallback(() => {
    lastSpeechEndedAtRef.current = Date.now();
    isSpeakingRef.current = false;

    // 1. Detener elemento de audio HTML5 de inmediato si existiera
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.onended = null;
        audioElementRef.current.onerror = null;
        audioElementRef.current.removeAttribute('src');
        audioElementRef.current.load();
      } catch (err) {
        console.warn(err);
      }
      audioElementRef.current = null;
    }

    // 2. Desconectar callbacks de la utterance activa antes de cancelar
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }

    // 3. Detener síntesis de voz nativa SpeechSynthesis solo si está activa o pendiente
    if ('speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch (err) {
        console.warn(err);
      }
    }

    // 4. Resolver y limpiar cualquier promesa pendiente de speak()
    if (currentUtterFinishRef.current) {
      const finish = currentUtterFinishRef.current;
      currentUtterFinishRef.current = null;
      finish();
    }
  }, []);

  // Detener escucha inmediatamente
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (err) {
        console.warn(err);
      }
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
  }, []);

  // Síntesis de voz garantizada, pausada (0.90x) y clara para adultos mayores (58–79 años)
  const speak = useCallback(
    async (displayText: string, spokenText?: string) => {
      // 1. Detener escucha activa antes de hablar para evitar eco acústico
      stopListening();

      const wasSynthBusy =
        isSpeakingRef.current ||
        Boolean(audioElementRef.current) ||
        Boolean(currentUtterFinishRef.current) ||
        ('speechSynthesis' in window &&
          (window.speechSynthesis.speaking || window.speechSynthesis.pending));

      if (wasSynthBusy) {
        cancelSpeech();
      }

      const rawText = spokenText || displayText;
      const textToSpeak = humanizeSpokenText(rawText);

      // Registrar en el historial reciente para anulación de eco
      recentSpokenListRef.current = [
        textToSpeak,
        ...recentSpokenListRef.current.slice(0, 5),
      ];

      isSpeakingRef.current = true;
      setAssistantStatus('speaking');
      setAssistantStatusText('ASISTENTE HABLANDO');

      return new Promise<void>((resolve) => {
        if (!('speechSynthesis' in window)) {
          isSpeakingRef.current = false;
          lastSpeechEndedAtRef.current = Date.now();
          setAssistantStatus('idle');
          setAssistantStatusText('TOCA PARA HABLAR');
          resolve();
          return;
        }

        const startUtterance = () => {
          if (!isSpeakingRef.current) {
            resolve();
            return;
          }

          let finished = false;
          let safetyTimer: ReturnType<typeof setTimeout> | null = null;
          let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

          const finish = () => {
            if (finished) return;
            finished = true;
            if (safetyTimer) clearTimeout(safetyTimer);
            if (keepAliveInterval) clearInterval(keepAliveInterval);
            activeUtteranceRef.current = null;
            isSpeakingRef.current = false;
            lastSpeechEndedAtRef.current = Date.now();
            currentUtterFinishRef.current = null;
            setAssistantStatus('idle');
            setAssistantStatusText('TOCA PARA HABLAR');
            resolve();
          };

          currentUtterFinishRef.current = finish;

          const launchSpeech = (useFallbackDefaultVoice: boolean) => {
            if (finished || !isSpeakingRef.current) return;

            try {
              if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
              }
            } catch {
              // Ignorar
            }

            const utter = new SpeechSynthesisUtterance(textToSpeak);
            activeUtteranceRef.current = utter; // Evita garbage-collection en V8 mientras habla

            // Velocidad pausada y clara (0.90x) confirmada para adultos mayores (58–79 años)
            utter.rate = 0.9;
            utter.pitch = 1.0;
            utter.volume = 1.0;

            if (!useFallbackDefaultVoice) {
              const vs = window.speechSynthesis.getVoices() || [];
              const best = voiceRef.current || findBestNaturalVoice(vs);
              if (best) {
                utter.voice = best;
                utter.lang = best.lang || 'es-CL';
              } else {
                const anyEs = vs.find(
                  (v) =>
                    v.lang &&
                    (v.lang.toLowerCase().startsWith('es') ||
                      v.lang.toLowerCase().includes('spa'))
                );
                if (anyEs) {
                  utter.voice = anyEs;
                  utter.lang = anyEs.lang;
                } else {
                  utter.lang = 'es-CL';
                }
              }
            } else {
              // Voz nativa base en español sin forzar objeto externo
              utter.lang = 'es-CL';
            }

            utter.onend = () => {
              finish();
            };

            utter.onerror = (e: any) => {
              const errCode = e?.error || '';
              if (errCode === 'canceled' || errCode === 'interrupted') {
                finish();
                return;
              }
              // Si la voz seleccionada falló (ej. voz online sin red), reintentar de inmediato con la voz base del sistema
              if (!useFallbackDefaultVoice && isSpeakingRef.current && !finished) {
                launchSpeech(true);
                return;
              }
              console.warn('SpeechSynthesis error:', e);
              finish();
            };

            try {
              window.speechSynthesis.speak(utter);
              if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
              }
            } catch (err) {
              console.warn('SpeechSynthesis speak failed:', err);
              finish();
            }
          };

          // Keep-alive para evitar que Chromium pause locuciones largas a velocidad 0.90x
          keepAliveInterval = setInterval(() => {
            if (!isSpeakingRef.current || finished) {
              if (keepAliveInterval) clearInterval(keepAliveInterval);
              return;
            }
            try {
              if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
              }
            } catch {
              // Ignorar
            }
          }, 1000);

          safetyTimer = setTimeout(
            finish,
            Math.max(5000, 2600 + textToSpeak.length * 115)
          );

          launchSpeech(false);
        };

        // Si no había voz activa, ejecutar de forma sincrónica (0ms) para conservar el gesto táctil del usuario;
        // si se acaba de cancelar una voz previa, dar 60ms para que Chromium vacíe la cola sin cancelar la nueva.
        if (wasSynthBusy) {
          setTimeout(startUtterance, 60);
        } else {
          startUtterance();
        }
      });
    },
    [cancelSpeech, stopListening]
  );

  // Iniciar reconocimiento de voz con auto-recuperación y filtro anti-eco
  const startListening = useCallback(
    (force = false) => {
      // Si no es una llamada forzada (por pulsar el botón de mic) y el asistente aún habla, esperar
      if (!force && isSpeakingRef.current) return;

      if (force) {
        cancelSpeech();
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;

      if (!SpeechRecognition) {
        showToast('El navegador no tiene disponible el reconocimiento de voz.');
        return;
      }

      // Detener cualquier instancia previa para evitar conflictos de estado
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {
          // Ignorar
        }
        recognitionRef.current = null;
      }

      try {
        const rec = new SpeechRecognition();
        rec.lang = 'es-CL';
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          isListeningRef.current = true;
          setAssistantStatus('listening');
          setAssistantStatusText('TE ESCUCHO CON CALMA…');
          setIsMicBlocked(false);
        };

        rec.onresult = (e: any) => {
          let interim = '';
          let final = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const tr = e.results[i][0].transcript;
            if (e.results[i].isFinal) final += tr;
            else interim += tr;
          }

          const candidate = (final || interim).trim();
          if (!candidate) return;

          // Barge-In por Voz: si el usuario interrumpe hablando mientras el asistente emitía sonido,
          // detener instantáneamente cualquier audio o proceso de SpeechSynthesis antes de continuar
          if (isSpeakingRef.current) {
            if (!isSpokenEcho(candidate, recentSpokenListRef.current)) {
              cancelSpeech();
            } else {
              return;
            }
          }

          // Filtro estricto contra eco acústico
          if (isSpokenEcho(candidate, recentSpokenListRef.current)) {
            return;
          }

          if (final.trim()) {
            welcomeActiveRef.current = false;
            // Detener cualquier síntesis residual de inmediato antes de procesar el comando
            cancelSpeech();
            setHeardText(final.trim());
            handleUserUtteranceRef.current(final.trim());
          } else if (interim) {
            setHeardText(interim);
          }
        };

        rec.onerror = (e: any) => {
          isListeningRef.current = false;
          if (e.error === 'no-speech' || e.error === 'aborted') {
            if (!isSpeakingRef.current) {
              setAssistantStatus('idle');
              setAssistantStatusText('TOCA PARA HABLAR');
            }
            return;
          }
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            setIsMicBlocked(true);
          }
          setAssistantStatus('idle');
          setAssistantStatusText('TOCA PARA HABLAR');
        };

        rec.onend = () => {
          isListeningRef.current = false;
          if (!isSpeakingRef.current) {
            setAssistantStatus('idle');
            setAssistantStatusText('TOCA PARA HABLAR');
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn('Error en SpeechRecognition:', err);
        setAssistantStatus('idle');
        setAssistantStatusText('TOCA PARA HABLAR');
      }
    },
    [cancelSpeech, showToast]
  );

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Agregar mensaje del usuario a la conversación
  const appendUserMessage = useCallback((text: string) => {
    const newMsg: TimelineMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Ahora',
    };
    setMessages((prev) => [...prev, newMsg]);
  }, []);

  // Agregar mensaje del asistente a la conversación
  // Al terminar de hablar, permanece en espera tranquila ("TOCA PARA HABLAR") sin grabar automáticamente
  const appendAssistantMessage = useCallback(
    async (
      text: string,
      spokenText?: string,
      widgetType: any = 'none',
      widgetData?: any
    ) => {
      const newMsg: TimelineMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text,
        spokenText: spokenText || text,
        timestamp: 'Ahora',
        widgetType,
        widgetData,
      };

      setMessages((prev) => [...prev, newMsg]);
      await speak(text, spokenText);

      // Para adultos mayores (58–79 años): NO iniciar grabación automática al terminar el texto.
      // El micrófono queda en reposo esperando que el usuario presione el botón cuando esté listo.
      if (!isSpeakingRef.current && !isListeningRef.current) {
        setAssistantStatus('idle');
        setAssistantStatusText('TOCA PARA HABLAR');
      }
    },
    [speak]
  );

  // Marcar widgets anteriores como completados
  const markLatestWidgetCompleted = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) => (m.widgetType !== 'none' ? { ...m, isCompleted: true } : m))
    );
  }, []);

  // Abrir Copiloto Asistido: Comienza con ¡Hola!, hace una pausa tranquila de 1.8s y luego pregunta qué le gustaría hacer
  const handleOpenCopilot = useCallback(async () => {
    hapticTap();
    setIsCopilotOpen(true);
    isCopilotOpenRef.current = true;
    setSelectedContact(null);
    setAmount(null);
    setReceipt(null);

    // Activamos la bandera de bienvenida inicial
    welcomeActiveRef.current = true;

    // 1. Mensaje de bienvenida inicial ("¡Hola!")
    const greetingMsg: TimelineMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      text: '¡Hola! Qué gusto saludarte. Soy tu asistente de BancoEstado y estoy aquí para acompañarte paso a paso con total calma.',
      spokenText:
        '¡Hola!, Qué gusto saludarte. Soy tu asistente de BancoEstado y estoy aquí para acompañarte paso a paso con total calma.',
      timestamp: 'Ahora',
      widgetType: 'none',
    };

    setMessages([greetingMsg]);

    // 2. El asistente pronuncia de inmediato el saludo de bienvenida
    await speak(greetingMsg.text, greetingMsg.spokenText);

    // Si el usuario interrumpió (apretó el micrófono, habló o seleccionó algo),
    // no se muestra ni se dice la frase de cortesía secundaria
    if (!welcomeActiveRef.current || !isCopilotOpenRef.current) return;

    // 3. Pausa tranquila de 1.8 segundos (entre 1.5 y 2s) para que el adulto mayor asimile con calma
    await new Promise((r) => setTimeout(r, 1800));

    if (!welcomeActiveRef.current || !isCopilotOpenRef.current) return;

    // 4. Aparece y se pronuncia la pregunta de "¿Qué te gustaría hacer hoy?"
    await appendAssistantMessage(
      '¿Qué te gustaría hacer hoy?\n\nPuedes decirme por ejemplo: “Quiero transferir dinero” o “¿Cuál es mi saldo?”\n\nO toca una de las opciones sugeridas abajo:',
      '¿Qué te gustaría hacer hoy?, Puedes decirme por ejemplo quiero transferir dinero, o consultar tu saldo.',
      'none'
    );
  }, [speak, appendAssistantMessage]);

  // Iniciar transferencia: Despliega las opciones acordadas (A un contacto guardado o Cuenta nueva)
  const handleStartTransfer = useCallback(async () => {
    hapticTap();
    welcomeActiveRef.current = false;
    cancelSpeech();
    stopListening();
    setIsCopilotOpen(true);
    markLatestWidgetCompleted();
    appendUserMessage('Quiero transferir dinero');
    await showHalo(350);

    await appendAssistantMessage(
      '¡Con gusto te acompaño a transferir! ¿A quién le enviaremos dinero hoy?',
      'Con gusto te acompaño a transferir. ¿A quién le enviaremos dinero hoy?',
      'transfer_type'
    );
  }, [markLatestWidgetCompleted, appendUserMessage, showHalo, appendAssistantMessage, cancelSpeech, stopListening]);

  // PASO 1: Selección de Destino de Transferencia (Contacto Guardado o Cuenta Nueva)
  const handleSelectTransferType = useCallback(
    async (type: 'saved_contact' | 'new_account' | string) => {
      hapticTap();
      cancelSpeech();
      markLatestWidgetCompleted();

      if (type === 'saved_contact' || type === 'third_party') {
        appendUserMessage('A un contacto guardado');
        await showHalo(350);

        await appendAssistantMessage(
          'Excelente. Aquí tienes tus contactos guardados. ¿A quién le transferimos hoy? Puedes tocar a la persona o decir su nombre con tu voz:',
          'Excelente. Aquí tienes tus contactos guardados. ¿A quién le transferimos hoy?',
          'recipient_picker'
        );
      } else if (type === 'new_account') {
        appendUserMessage('A una cuenta nueva');
        await showHalo(350);

        await appendAssistantMessage(
          'De acuerdo. Ingresa con calma los datos del nuevo destinatario. Te acompañaré a verificar todo antes de autorizar:',
          'De acuerdo. Ingresa con calma los datos del nuevo destinatario. Te acompañaré a verificar todo antes de autorizar.',
          'new_account_form'
        );
      }
    },
    [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, appendAssistantMessage]
  );

  // PASO 2: Selección de Destinatario
  const handleSelectRecipient = useCallback(
    async (contact: Contact) => {
      hapticTap();
      cancelSpeech();
      setSelectedContact(contact);
      markLatestWidgetCompleted();

      appendUserMessage(`A ${contact.name}`);
      await showHalo(350);

      const msgText = `Perfecto. Seleccionaste a ${contact.name}.\n\nVerifiquemos juntos con calma sus datos oficiales:\n• RUT: ${contact.rut}\n• Banco: ${contact.bank}\n• Cuenta: ${contact.account}\n\n¿Es la persona exacta que buscas?`;
      const msgSpoken = `Perfecto. Seleccionaste a ${contact.name}. RUT ${rutSpoken(
        contact.rut
      )}, en ${contact.bank}. ¿Es la persona exacta que buscas?`;

      await appendAssistantMessage(msgText, msgSpoken, 'recipient_confirm');
    },
    [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, appendAssistantMessage]
  );

  // Manejo de confirmación o cancelación de nueva cuenta
  const handleConfirmNewAccount = useCallback(
    async (newContact: Contact) => {
      await handleSelectRecipient(newContact);
    },
    [handleSelectRecipient]
  );

  const handleCancelNewAccount = useCallback(async () => {
    hapticTap();
    cancelSpeech();
    markLatestWidgetCompleted();
    appendUserMessage('Cancelar ingreso de cuenta nueva');
    await showHalo(250);

    await appendAssistantMessage(
      'No hay problema. ¿A quién le enviaremos dinero hoy? Puedes elegir a un contacto guardado:',
      'No hay problema. ¿A quién le enviaremos dinero hoy? Puedes elegir a un contacto guardado.',
      'transfer_type'
    );
  }, [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, appendAssistantMessage]);

  // PASO 3: Confirmación de Destinatario
  const handleConfirmRecipient = useCallback(async () => {
    hapticConfirm();
    cancelSpeech();
    markLatestWidgetCompleted();

    appendUserMessage('✓ Sí, es la persona correcta');
    await showHalo(350);

    const msgText = `¡Muy bien! Ahora, ¿cuánto dinero quieres transferirle a ${firstName(
      selectedContact?.name || ''
    )}?\n\nPuedes tocar una de las fichas de dinero sugeridas abajo o decírmelo en voz alta (por ejemplo: “treinta mil pesos”):`;
    const msgSpoken = `Muy bien. Ahora, ¿cuánto dinero quieres transferirle a ${firstName(
      selectedContact?.name || ''
    )}? Puedes tocar una opción o decirme el monto.`;

    await appendAssistantMessage(msgText, msgSpoken, 'amount_selector');
  }, [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, selectedContact, appendAssistantMessage]);

  const handleRejectRecipient = useCallback(async () => {
    hapticWarning();
    cancelSpeech();
    setSelectedContact(null);
    markLatestWidgetCompleted();

    appendUserMessage('No, buscar a otra persona');
    await showHalo(300);

    await appendAssistantMessage(
      'De acuerdo, dime a quién quieres transferir o elígelo en la lista:',
      'De acuerdo, dime a quién quieres transferir o elígelo en la lista:',
      'recipient_picker'
    );
  }, [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, appendAssistantMessage]);

  // PASO 4: Confirmación del Monto
  const handleConfirmAmount = useCallback(
    async (confirmedAmount: number) => {
      hapticTap();
      cancelSpeech();
      setAmount(confirmedAmount);
      markLatestWidgetCompleted();

      appendUserMessage(`${money(confirmedAmount)} pesos`);
      await showHalo(350);

      const remaining = balance - confirmedAmount;
      const msgText = `Entendido. Vas a enviar ${money(confirmedAmount)} a ${selectedContact?.name}.\n\nTu saldo restante en CuentaRUT será de ${money(remaining)}.\n\nRevisemos este resumen antes de autorizar con tu clave secreta:`;
      const msgSpoken = `Entendido. Vas a enviar ${spokenMoney(confirmedAmount)} a ${selectedContact?.name}. Tu saldo restante será de ${spokenMoney(
        remaining
      )}. Revisemos este resumen antes de autorizar.`;

      await appendAssistantMessage(msgText, msgSpoken, 'pre_auth_summary');
    },
    [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, balance, selectedContact, appendAssistantMessage]
  );

  // PASO 5: Ir a Autorización BE Pass
  const handleProceedToAuth = useCallback(async () => {
    hapticTap();
    cancelSpeech();
    markLatestWidgetCompleted();

    appendUserMessage('Autorizar con BE Pass');
    await showHalo(300);

    const msgText =
      'Por seguridad bancaria oficial, autoriza la operación ingresando tu clave BE Pass de 6 dígitos.\n\nPuedes presionar los botones numéricos en pantalla o usar tu huella digital:';
    const msgSpoken =
      'Por seguridad, autoriza la operación ingresando tu clave BE Pass de 6 dígitos en la pantalla o usando tu huella digital.';

    await appendAssistantMessage(msgText, msgSpoken, 'bepass_keypad');
  }, [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, appendAssistantMessage]);

  const handleModifyDetails = useCallback(async () => {
    hapticTap();
    cancelSpeech();
    markLatestWidgetCompleted();

    appendUserMessage('Modificar monto o datos');
    await showHalo(300);

    await appendAssistantMessage(
      'Revisemos el monto. ¿Cuánto dinero prefieres transferir?',
      'Revisemos el monto. ¿Cuánto dinero prefieres transferir?',
      'amount_selector'
    );
  }, [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, appendAssistantMessage]);

  // PASO 6: Éxito y Generación de Comprobante
  const handleAuthSuccess = useCallback(async () => {
    hapticSuccess();
    cancelSpeech();
    markLatestWidgetCompleted();

    if (!selectedContact || !amount) return;

    const newBalance = balance - amount;
    setBalance(newBalance);

    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} · ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const opStr = String(8000000 + Math.floor(Math.random() * 999999));

    const newReceipt: TransactionReceipt = {
      amount,
      destName: selectedContact.name,
      destRut: selectedContact.rut,
      destBank: selectedContact.bank,
      destAccount: selectedContact.account,
      sourceAccount: DEFAULT_ORIGIN_ACCOUNT,
      date: dateStr,
      opNumber: opStr,
    };

    setReceipt(newReceipt);
    await showHalo(600);

    const msgText = `🎉 ¡Felicitaciones! Has completado tu transferencia con total autonomía y seguridad.\n\nLe enviamos ${money(amount)} a ${selectedContact.name} exitosamente.\n\nAquí tienes tu comprobante oficial con folio:`;
    const msgSpoken = `Felicitaciones. Has completado tu transferencia con total autonomía. Le enviamos ${spokenMoney(amount)} a ${selectedContact.name} exitosamente.`;

    await appendAssistantMessage(msgText, msgSpoken, 'receipt_card');
  }, [cancelSpeech, markLatestWidgetCompleted, selectedContact, amount, balance, showHalo, appendAssistantMessage]);

  const handleAuthCancel = useCallback(async () => {
    hapticWarning();
    cancelSpeech();
    markLatestWidgetCompleted();

    appendUserMessage('Cancelar autorización');
    await showHalo(300);

    await appendAssistantMessage(
      'Tranquilo(a), no se ha descontado ningún peso. La operación fue detenida.\n\n¿Quieres intentar otra transferencia o revisar tu saldo?',
      'No se ha descontado ningún peso. La operación fue detenida. ¿Qué te gustaría hacer ahora?',
      'transfer_type'
    );
  }, [cancelSpeech, markLatestWidgetCompleted, appendUserMessage, showHalo, appendAssistantMessage]);

  // Manejador de voz o texto
  const handleUserUtterance = useCallback(
    async (raw: string) => {
      welcomeActiveRef.current = false;
      cancelSpeech();
      stopListening();

      // Si la entrada coincide con el eco del asistente, abortar en silencio sin emitir respuesta
      if (isSpokenEcho(raw, recentSpokenListRef.current)) {
        setAssistantStatus('idle');
        setAssistantStatusText('TOCA PARA HABLAR');
        return;
      }

      setAssistantStatus('thinking');
      setAssistantStatusText('REVISANDO…');

      await new Promise((r) => setTimeout(r, 400));

      const yn = yesNo(raw);
      const intent = detectIntent(raw);

      // Si pregunta saldo
      if (intent === 'saldo') {
        appendUserMessage(raw);
        await appendAssistantMessage(
          `Tu saldo disponible en CuentaRUT es de ${money(balance)}.\n\n¿Quieres realizar alguna transferencia?`,
          `Tu saldo disponible en CuentaRUT es de ${spokenMoney(balance)}. ¿Quieres realizar alguna transferencia?`,
          'transfer_type'
        );
        return;
      }

      // Si dice transferir
      if (intent === 'transfer' || hasAny(norm(raw), ['transferir', 'enviar', 'mandar plata', 'plata'])) {
        appendUserMessage(raw);

        const foundContact = extractContact(raw);
        const parsedAmount = extractAmount(raw);

        if (foundContact && CONTACTS[foundContact]) {
          const contact = CONTACTS[foundContact];
          setSelectedContact(contact);
          if (parsedAmount) setAmount(parsedAmount);

          await appendAssistantMessage(
            `¡Perfecto! Encontré a ${contact.name} en tus contactos guardados.\n\nVerifiquemos que sea la persona correcta:\n• RUT: ${contact.rut}\n• Banco: ${contact.bank}`,
            `Perfecto. Encontré a ${contact.name}. Verifiquemos que sea la persona correcta.`,
            'recipient_confirm'
          );
          return;
        }

        await appendAssistantMessage(
          '¡Con gusto te acompaño a transferir! ¿A quién le enviaremos dinero hoy?',
          'Con gusto te acompaño a transferir. ¿A quién le enviaremos dinero hoy?',
          'transfer_type'
        );
        return;
      }

      // Si elige contacto guardado o cuenta nueva
      if (hasAny(norm(raw), ['contacto guardado', 'guardado', 'mis contactos', 'contactos'])) {
        await handleSelectTransferType('saved_contact');
        return;
      }

      if (hasAny(norm(raw), ['cuenta nueva', 'nueva cuenta', 'nuevo destinatario', 'cuenta'])) {
        await handleSelectTransferType('new_account');
        return;
      }

      // Contacto mencionado
      const mentioned = extractContact(raw);
      if (mentioned && CONTACTS[mentioned]) {
        appendUserMessage(raw);
        await handleSelectRecipient(CONTACTS[mentioned]);
        return;
      }

      // Monto mencionado
      const detectedAmount = extractAmount(raw);
      if (detectedAmount && selectedContact) {
        appendUserMessage(raw);
        await handleConfirmAmount(detectedAmount);
        return;
      }

      // Confirmaciones
      if (yn === 'yes') {
        appendUserMessage(raw);
        if (selectedContact && !amount) {
          await handleConfirmRecipient();
          return;
        }
        if (selectedContact && amount) {
          await handleProceedToAuth();
          return;
        }
      }

      if (yn === 'no') {
        appendUserMessage(raw);
        if (selectedContact && !amount) {
          await handleRejectRecipient();
          return;
        }
        if (selectedContact && amount) {
          await handleModifyDetails();
          return;
        }
      }

      appendUserMessage(raw);
      await appendAssistantMessage(
        'Te escuché, cuéntame con confianza: ¿quieres transferir dinero a un familiar o revisar tu saldo?',
        'Te escuché, pero cuéntame con calma. ¿Quieres transferir dinero o revisar tu saldo?',
        'transfer_type'
      );
    },
    [
      cancelSpeech,
      stopListening,
      balance,
      appendUserMessage,
      appendAssistantMessage,
      selectedContact,
      amount,
      handleSelectRecipient,
      handleSelectTransferType,
      handleConfirmRecipient,
      handleRejectRecipient,
      handleConfirmAmount,
      handleProceedToAuth,
      handleModifyDetails,
    ]
  );

  useEffect(() => {
    handleUserUtteranceRef.current = handleUserUtterance;
  }, [handleUserUtterance]);

  // Click en el micrófono del Dock inferior con Barge-In por toque instantáneo
  const handleMicClick = useCallback(() => {
    hapticTap();
    welcomeActiveRef.current = false; // Interrupción deliberada del usuario
    const wasSpeaking = isSpeakingRef.current;

    // Detener instantáneamente cualquier síntesis o reproducción antes de actuar
    cancelSpeech();

    if (!wasSpeaking && isListeningRef.current) {
      stopListening();
      setAssistantStatus('idle');
      setAssistantStatusText('TOCA PARA HABLAR');
      return;
    }

    stopListening();
    setHeardText('');
    setAssistantStatus('listening');
    setAssistantStatusText('TE ESCUCHO CON CALMA…');
    setTimeout(() => {
      startListeningRef.current(true);
    }, 20);
  }, [cancelSpeech, stopListening]);

  // Píldoras contextuales
  const getContextualChips = (): string[] => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return ['Quiero transferir', '¿Cuál es mi saldo?'];

    switch (lastMsg.widgetType) {
      case 'transfer_type':
        return ['A un contacto guardado', 'A una cuenta nueva', '¿Cuál es mi saldo?'];
      case 'recipient_picker':
        return ['Belén Pardo', 'Luis Olate', 'Armando Paredes', '+ Cuenta nueva'];
      case 'new_account_form':
        return ['Cancelar'];
      case 'recipient_confirm':
        return ['✓ Sí, es correcto', '✕ No, cambiar persona'];
      case 'amount_selector':
        return ['10 mil pesos', '20 mil pesos', '30 mil pesos', '50 mil pesos'];
      case 'pre_auth_summary':
        return ['Autorizar con BE Pass', 'Modificar datos'];
      case 'bepass_keypad':
        return ['Usar huella digital', 'Cancelar'];
      case 'receipt_card':
        return ['Compartir comprobante', '+ Otra transferencia', 'Volver al inicio'];
      default:
        return ['Quiero transferir', '¿Cuál es mi saldo?'];
    }
  };

  // Acciones de Comprobante
  const handleShareReceipt = () => {
    hapticTap();
    if (!receipt) return;
    const text = `Comprobante BancoEstado: Transferencia de ${money(receipt.amount)} a ${receipt.destName} realizada con éxito. Folio: ${receipt.opNumber}.`;
    if (navigator.share) {
      navigator.share({ title: 'Comprobante BancoEstado', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      showToast('Comprobante copiado al portapapeles.');
    }
  };

  const handleCopyReceipt = () => {
    hapticTap();
    if (!receipt) return;
    const text = `Comprobante BancoEstado: Transferencia de ${money(receipt.amount)} a ${receipt.destName} realizada con éxito. Folio: ${receipt.opNumber}.`;
    navigator.clipboard?.writeText(text);
    showToast('Datos del comprobante copiados.');
  };

  const handleResetJourney = () => {
    hapticTap();
    setSelectedContact(null);
    setAmount(null);
    setReceipt(null);
    appendAssistantMessage(
      'Listo. ¿Qué te gustaría hacer ahora? Puedes decirme “quiero transferir” o preguntar por tu saldo:',
      'Listo. ¿Qué te gustaría hacer ahora?',
      'none'
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-[#1E2538] flex flex-col items-center justify-start">
      {/* Contenedor del teléfono móvil */}
      <main
        ref={phoneContainerRef}
        className="w-full relative bg-[#F4F6FA] overflow-hidden flex flex-col h-[100dvh] md:h-[min(840px,calc(100vh-24px))] md:my-3 md:rounded-[32px] md:shadow-[0_25px_60px_-15px_rgba(13,27,62,0.45)] md:border-[6px] md:border-slate-800 max-w-[440px]"
      >
        {/* ================= VISTA 1: APLICACIÓN BANCOESTADO OFICIAL (CON EL ÍCONO RECONOCIBLE) ================= */}
        {!isCopilotOpen ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Contenedor desplazable de Inicio (Header y AccountCards) */}
            <div className="flex-1 overflow-y-auto relative pb-6 overscroll-contain">
              {/* Cabecera BancoEstado limpia oficial */}
              <Header
                onNotify={showToast}
                onResetToHome={() => setIsCopilotOpen(false)}
              />

              {/* Tarjetas de cuentas oficiales y saldos */}
              <AccountCards
                balance={balance}
                onStartTransfer={handleStartTransfer}
                onNotify={showToast}
              />
            </div>

            {/* Navegación inferior BancoEstado: SIEMPRE fija en su lugar en la pantalla */}
            <BottomNav
              currentView="home"
              onGoHome={() => setIsCopilotOpen(false)}
              onStartTransfer={handleStartTransfer}
              onNotify={showToast}
            />

            {/* Burbuja flotante desplazable con el dedo (estilo Messenger) con ajuste magnético */}
            <DraggableFAB
              onClick={handleOpenCopilot}
              containerRef={phoneContainerRef}
            />
          </div>
        ) : (
          /* ================= VISTA 2: ASISTENTE GUIADO LIMPIO (MÁXIMO ESPACIO PARA LA CONVERSACIÓN) ================= */
          <div className="flex-1 flex flex-col overflow-hidden relative bg-[#F4F6FA]">
            {/* Cabecera ultra-compacta (48px) de BancoEstado para no quitar espacio */}
            <div className="bg-gradient-to-r from-[#F77F00] to-[#FF9A3C] text-white px-4 py-2.5 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-2">
                <BankBuildingIcon className="w-6 h-6 shrink-0 drop-shadow-sm" />
                <div className="flex flex-col">
                  <span className="font-['Nunito'] text-base font-black leading-tight">
                    BancoEstado
                  </span>
                  <span className="text-[10px] text-orange-100 font-bold uppercase tracking-wider">
                    Asistente Guiado
                  </span>
                </div>
              </div>

              {/* Botón simple para volver a las cuentas */}
              <button
                onClick={() => {
                  welcomeActiveRef.current = false;
                  hapticTap();
                  cancelSpeech();
                  stopListening();
                  setIsCopilotOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors active:scale-95 cursor-pointer"
                type="button"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Mis cuentas</span>
              </button>
            </div>

            {/* Línea de tiempo conversacional con opacidad reducida en mensajes pasados */}
            <CopilotTimeline
              messages={messages}
              contacts={CONTACTS}
              balance={balance}
              selectedContact={selectedContact}
              amount={amount}
              receipt={receipt}
              onReplayAudio={(text) => speak(text)}
              onSelectTransferType={handleSelectTransferType}
              onSelectRecipient={handleSelectRecipient}
              onConfirmNewAccount={handleConfirmNewAccount}
              onCancelNewAccount={handleCancelNewAccount}
              onConfirmRecipient={handleConfirmRecipient}
              onRejectRecipient={handleRejectRecipient}
              onConfirmAmount={handleConfirmAmount}
              onProceedToAuth={handleProceedToAuth}
              onModifyDetails={handleModifyDetails}
              onAuthSuccess={handleAuthSuccess}
              onAuthCancel={handleAuthCancel}
              onShareReceipt={handleShareReceipt}
              onCopyReceipt={handleCopyReceipt}
              onNewTransfer={handleResetJourney}
              onGoHome={() => {
                welcomeActiveRef.current = false;
                cancelSpeech();
                stopListening();
                setIsCopilotOpen(false);
              }}
            />

            {/* Barra de audio y control inferior (Docked) */}
            <DockedVoiceBar
              status={assistantStatus}
              statusText={assistantStatusText}
              heardText={heardText}
              quickChips={getContextualChips()}
              isMicBlocked={isMicBlocked}
              onMicClick={handleMicClick}
              onChipClick={(chip) => {
                welcomeActiveRef.current = false;
                cancelSpeech();
                stopListening();
                handleUserUtterance(chip);
              }}
              onSubmitText={(text) => {
                welcomeActiveRef.current = false;
                cancelSpeech();
                stopListening();
                handleUserUtterance(text);
              }}
              onRequestMicPermission={async () => {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach((t) => t.stop());
                    setIsMicBlocked(false);
                    showToast('✓ Micrófono activado');
                    startListeningRef.current(true);
                  } catch {
                    showToast('Permite el acceso al micrófono en la barra del navegador.');
                  }
                }
              }}
            />
          </div>
        )}

        {/* Aureola BancoEstado */}
        <LoadingHalo isLoading={isLoadingHalo} />

        {/* Toast flotante */}
        {toastMessage && (
          <div
            className="absolute left-4 right-4 bottom-22 z-50 bg-[#102048] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl border border-slate-600 animate-pop-in flex items-center justify-between"
            role="status"
          >
            <span>{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  );
}
