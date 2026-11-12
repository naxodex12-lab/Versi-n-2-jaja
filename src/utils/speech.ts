import { CONTACTS } from '../data/contacts';

export function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasPhrase(t: string, p: string): boolean {
  return (' ' + t + ' ').indexOf(' ' + p + ' ') !== -1;
}

export function hasAny(t: string, list: string[]): boolean {
  return list.some((p) => hasPhrase(t, norm(p)));
}

/**
 * Frases típicas emitidas exclusivamente por el asistente BancoEstado
 * para identificar y anular de inmediato cualquier eco acústico capturado por el micrófono.
 */
const SYSTEM_ASSISTANT_PHRASES = [
  'te escuche',
  'cuentame con calma',
  'cuentame con confianza',
  'asistente de bancoestado',
  'asistente de banco estado',
  'que gusto saludarte',
  'paso a paso con total calma',
  'que te gustaria hacer hoy',
  'puedes decirme por ejemplo',
  'a quien le enviaremos dinero',
  'aqui tienes tus contactos guardados',
  'ingresa con calma los datos del nuevo destinatario',
  'seleccionaste a',
  'es la persona exacta que buscas',
  'cuanto dinero quieres transferirle',
  'revisemos este resumen antes de autorizar',
  'clave be pass',
  'autoriza la operacion',
  'felicitaciones has completado tu transferencia',
  'no se ha descontado ningun peso',
];

/**
 * Detecta si una transcripción capturada por el micrófono es en realidad un eco acústico
 * de la propia voz del asistente (evita bucles como "te escuché pero cuéntame con calma").
 */
export function isSpokenEcho(raw: string, recentSpokenList: string[] = []): boolean {
  const t = norm(raw);
  if (!t || t.length < 3) return false;

  // REGLA CRÍTICA: Si el usuario pronunció una intención explícita, número o contacto,
  // NUNCA es eco, es una orden directa y válida del usuario.
  if (detectIntent(raw) || extractContact(raw) || extractAmount(raw) || yesNo(raw)) {
    return false;
  }
  if (hasAny(t, ['contacto guardado', 'cuenta nueva', 'transferir', 'saldo', 'mis contactos', 'nueva cuenta'])) {
    return false;
  }

  // 1. Coincidencia directa con frases largas típicas del sistema
  for (const phrase of SYSTEM_ASSISTANT_PHRASES) {
    if (t.includes(phrase) || (phrase.includes(t) && t.length > 15)) {
      return true;
    }
  }

  // 2. Coincidencia con frases largas que el asistente acaba de decir
  for (const spoken of recentSpokenList) {
    const sNorm = norm(spoken);
    if (!sNorm || sNorm.length < 15) continue;

    // Solo se considera eco si la transcripción capturada es extensa (>20 caracteres)
    // y coincide de manera casi exacta con lo dicho por el asistente
    if (t.length > 20 && sNorm.includes(t)) {
      return true;
    }
    if (sNorm.length > 20 && t.includes(sNorm)) {
      return true;
    }
  }

  return false;
}

const UNITS: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26,
  veintisiete: 27, veintiocho: 28, veintinueve: 29,
};

const TENS: Record<string, number> = {
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
};

const HUNDREDS: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

function isNumWord(w: string): boolean {
  return (
    w in UNITS ||
    w in TENS ||
    w in HUNDREDS ||
    w === 'mil' ||
    w === 'millon' ||
    w === 'millones' ||
    w === 'medio' ||
    w === 'media'
  );
}

function runValue(run: string[]): number {
  let total = 0;
  let cur = 0;
  run.forEach((w) => {
    if (w in UNITS) cur += UNITS[w];
    else if (w in TENS) cur += TENS[w];
    else if (w in HUNDREDS) cur += HUNDREDS[w];
    else if (w === 'medio' || w === 'media') cur += 0.5;
    else if (w === 'mil') {
      total += (cur || 1) * 1000;
      cur = 0;
    } else if (w === 'millon' || w === 'millones') {
      total += (cur || 1) * 1000000;
      cur = 0;
    }
  });
  return Math.round(total + cur);
}

export function wordsToNumber(t: string): number | null {
  t = t.replace(/\bluca(s)?\b/g, 'mil');
  const toks = t.split(' ');
  let best = 0;
  let i = 0;
  while (i < toks.length) {
    if (isNumWord(toks[i])) {
      const run: string[] = [];
      let j = i;
      while (j < toks.length) {
        if (isNumWord(toks[j])) {
          run.push(toks[j]);
          j++;
        } else if (toks[j] === 'y' && run.length && j + 1 < toks.length && isNumWord(toks[j + 1])) {
          j++;
        } else break;
      }
      best = Math.max(best, runValue(run));
      i = j;
    } else i++;
  }
  return best || null;
}

export function extractAmount(raw: string): number | null {
  const k = String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u00a0\u202f\u2009\u2007]/g, ' ')
    .replace(/\$/g, ' ')
    .replace(/\s+/g, ' ');

  let m = k.match(/(\d+(?:[.,]\d+)?)\s*(millones|millon|mil|lucas?|k)\b/);
  if (m) {
    const n = parseFloat(m[1].replace(',', '.'));
    const v = Math.round(n * (/millon/.test(m[2]) ? 1e6 : 1e3));
    if (v > 0) return v;
  }

  m = k.match(/(^|[^\d])(\d{1,3}(?:[.,' ]\d{3})+)(?!\d)/);
  if (m) {
    const g = parseInt(m[2].replace(/[.,' ]/g, ''), 10);
    if (g > 0) return g;
  }

  m = k.match(/(^|[^\d])(\d{1,9})(?!\d)/);
  if (m) {
    const d = parseInt(m[2], 10);
    if (d > 0) return d;
  }

  const w = wordsToNumber(norm(raw));
  if (w && (w >= 100 || /\bpesos?\b/.test(norm(raw)))) return w;
  return null;
}

export function extractContact(raw: string): string | null {
  const t = ' ' + norm(raw) + ' ';
  let best: string | null = null;
  let pos = 1e9;
  Object.keys(CONTACTS).forEach((key) => {
    CONTACTS[key].aliases.forEach((a) => {
      const i = t.indexOf(' ' + a + ' ');
      if (i !== -1 && i < pos) {
        pos = i;
        best = key;
      }
    });
  });
  return best;
}

export function numberToWords(n: number): string {
  const U = [
    'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve',
    'veinte', 'veintiuno', 'veintidos', 'veintitres', 'veinticuatro', 'veinticinco', 'veintiseis',
    'veintisiete', 'veintiocho', 'veintinueve',
  ];
  const T = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const H = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  function below(x: number): string {
    if (x === 100) return 'cien';
    const out: string[] = [];
    const h = Math.floor(x / 100);
    const r = x % 100;
    if (h) out.push(H[h]);
    if (r) {
      if (r < 30) out.push(r === 1 ? 'un' : r === 21 ? 'veintiun' : U[r]);
      else {
        const t = Math.floor(r / 10);
        const u = r % 10;
        out.push(u ? T[t] + ' y ' + (u === 1 ? 'un' : U[u]) : T[t]);
      }
    }
    return out.join(' ');
  }

  n = Math.round(n);
  if (n === 0) return 'cero';
  const parts: string[] = [];
  const mill = Math.floor(n / 1e6);
  const mil = Math.floor((n % 1e6) / 1000);
  const rest = n % 1000;
  if (mill) parts.push(mill === 1 ? 'un millon' : below(mill) + ' millones');
  if (mil) parts.push(mil === 1 ? 'mil' : below(mil) + ' mil');
  if (rest) parts.push(below(rest));
  return parts.join(' ');
}

export function spokenMoney(n: number): string {
  n = Math.round(n);
  if (n === 1) return 'un peso';
  return numberToWords(n) + (n >= 1e6 && n % 1e6 === 0 ? ' de pesos' : ' pesos');
}

export function money(n: number): string {
  return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function rutSpoken(r: string): string {
  return r.replace(/\./g, '').replace('-', ', guion ').replace(/k$/i, 'ka');
}

export function firstName(n: string): string {
  return (n || '').split(' ')[0];
}

export const YES = [
  'confirmar', 'confirmo', 'confirma', 'confirmado', 'si', 'claro', 'correcto', 'es correcto', 'exacto', 'acepto',
  'de acuerdo', 'dale', 'ya', 'ok', 'okey', 'esta bien', 'asi es', 'adelante', 'hazlo', 'envialo', 'mandalo', 'por supuesto', 'autorizar', 'autorizo',
  'esa es la persona', 'si esa es la persona', 'esa es la persona que busco', 'si esa es', 'esa es', 'es la persona', 'si busco', 'si es',
];

export const NO = [
  'cancelar', 'cancelo', 'cancela', 'cancelado', 'no', 'nop', 'detente', 'detener', 'espera', 'alto', 'mejor no',
  'olvidalo', 'anulalo', 'anular', 'no quiero', 'retrocede', 'incorrecto', 'equivocado', 'otra persona',
  'esa no es la persona', 'no esa no es', 'no es la persona', 'no es la persona que busco', 'cambiar', 'cambia', 'no es',
];

export const EXIT = ['salir', 'inicio', 'volver', 'menu principal', 'pagina principal', 'cancelar', 'cancela'];

export function yesNo(raw: string): 'yes' | 'no' | 'both' | null {
  const t = norm(raw);
  const y = hasAny(t, YES);
  const n = hasAny(t, NO);
  if (y && n) {
    if (/\bno (confirmo|confirmar|confirma|acepto|esta bien|dale|quiero|es correcto)\b/.test(t)) return 'no';
    return 'both';
  }
  return y ? 'yes' : n ? 'no' : null;
}

export function isExit(raw: string): boolean {
  return hasAny(norm(raw), EXIT);
}

export function detectIntent(raw: string): 'transfer' | 'saldo' | 'help' | 'exit' | null {
  const t = norm(raw);
  if (/\b(transfer\w*|transfier\w*|enviar|envia|enviale|mandar|manda|mandale|depositar|deposita|girar|gira)\b/.test(t)) {
    return 'transfer';
  }
  if (/\b(saldo|cuanto tengo|cuanto me queda|cuanta plata tengo|cuanto dinero tengo)\b/.test(t)) {
    return 'saldo';
  }
  if (/\b(ayuda|ayudame|no se|que puedo|opciones|repite|repetir|otra vez)\b/.test(t)) {
    return 'help';
  }
  if (isExit(raw)) return 'exit';
  return null;
}

/**
 * Convierte texto técnico o bancario en frases con cadencia humana,
 * pausas naturales y pronunciación fonética cálida para adultos mayores.
 */
export function humanizeSpokenText(raw: string): string {
  let s = String(raw || '');
  // Reemplazar signos y comillas que confunden a sintetizadores
  s = s.replace(/[“”"«»]/g, '');
  s = s.replace(/\.{2,}/g, ', '); // Evitar "punto punto" en sintetizadores
  s = s.replace(/CuentaRUT/gi, 'Cuenta RUT');
  s = s.replace(/\bBE Pass\b/gi, 'B E Pass');
  s = s.replace(/\bRUT\b/g, 'R U T');
  s = s.replace(/BancoEstado/gi, 'Banco Estado');
  s = s.replace(/\b(\d{1,2})\.(\d{3})\.(\d{3})-([\dkK])\b/g, (_m, a, b, c, d) => {
    return `${a} millones ${b} mil ${c}, guion ${d === 'k' || d === 'K' ? 'ka' : d}`;
  });
  // Dar pausas amables con comas en saludos y preguntas
  s = s.replace(/¡Hola!/g, '¡Hola!, ');
  s = s.replace(/¿Qué te gustaría hacer hoy\?/g, '¿Qué te gustaría hacer hoy?, ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Algoritmo de puntuación para seleccionar la voz más humana y natural
 * disponible en el dispositivo del usuario, evitando sintetizadores mecánicos o robóticos.
 */
export function findBestNaturalVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const spanishVoices = voices.filter(
    (v) => v.lang && (v.lang.toLowerCase().startsWith('es') || v.lang.toLowerCase().includes('spa'))
  );

  if (spanishVoices.length === 0) return null;

  const scored = spanishVoices.map((v) => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    let score = 0;

    // Bonificación geográfica latinoamericana
    if (lang === 'es-cl') score += 30;
    else if (lang === 'es-419') score += 25;
    else if (lang === 'es-mx') score += 20;
    else if (lang === 'es-us') score += 15;
    else if (lang.startsWith('es')) score += 10;

    // Gran bonificación para motores neuronales / alta definición (sonido humano real)
    if (name.includes('natural')) score += 150;
    if (name.includes('online')) score += 120;
    if (name.includes('neural')) score += 130;
    if (name.includes('google')) score += 110;
    if (name.includes('enhanced') || name.includes('premium')) score += 90;
    if (!v.localService) score += 40;

    // Penalización drástica para sintetizadores robóticos anticuados
    if (name.includes('espeak') || name.includes('desktop') || name.includes('sampler') || name.includes('m1') || name.includes('m2') || name.includes('sapi')) {
      score -= 200;
    }

    return { voice: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.voice || null;
}

// Memoria caché de audio generado para reproducción ultra rápida
const audioBlobCache = new Map<string, string>();
let serverTtsDisabledUntil = 0;

/**
 * Solicita síntesis natural cálida al backend potenciado por Gemini.
 * Retorna la URL del Blob reproducible o null si no está disponible.
 */
export async function fetchNaturalSpeechAudio(
  text: string,
  voiceName = 'Aoede'
): Promise<string | null> {
  const clean = humanizeSpokenText(text);
  const cacheKey = `${voiceName}:${clean}`;

  if (audioBlobCache.has(cacheKey)) {
    return audioBlobCache.get(cacheKey)!;
  }

  // Si la cuota en la nube está en cooldown, pasar directo a la voz local con 0ms de espera
  if (Date.now() < serverTtsDisabledUntil) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, voiceName }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (data.quotaExhausted || data.fallbackToClient) {
      serverTtsDisabledUntil = Date.now() + 1000 * 60 * 60 * 6; // 6 horas
      return null;
    }

    if (!data.success || !data.audio) return null;

    // Convertir base64 a Blob URL
    const binary = atob(data.audio);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const mime = data.mimeType || 'audio/wav';
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    audioBlobCache.set(cacheKey, url);
    return url;
  } catch (_e) {
    clearTimeout(timeoutId);
    return null;
  }
}

