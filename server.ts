import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Helper: Wrap raw 16-bit 24kHz mono PCM into a standard 44-byte WAV container
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Cooldown en memoria para límite de cuota en free tier (evita peticiones fallidas repetidas)
let ttsQuotaExhaustedUntil = 0;

// TTS Endpoint powered by Gemini API
app.post('/api/tts', async (req: Request, res: Response) => {
  const { text, voiceName = 'Aoede' } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ success: false, error: 'Text parameter is required' });
    return;
  }

  // Si la cuota de TTS en la nube está temporalmente agotada, responder de inmediato
  // indicando que el cliente debe usar la síntesis nativa de alta definición con 0ms de demora.
  if (Date.now() < ttsQuotaExhaustedUntil) {
    res.json({
      success: false,
      fallbackToClient: true,
      quotaExhausted: true,
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.json({
      success: false,
      error: 'GEMINI_API_KEY not configured on server',
      fallbackToClient: true,
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanSpeechText = String(text).trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: cleanSpeechText,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Aoede',
            },
          },
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidate returned by Gemini TTS');
    }

    const parts = candidates[0].content?.parts || [];
    let audioData: string | null = null;
    let mimeType = 'audio/wav';

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        audioData = part.inlineData.data;
        if (part.inlineData.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
        break;
      }
    }

    if (!audioData) {
      throw new Error('No audio content part in Gemini TTS response');
    }

    if (mimeType.toLowerCase().includes('pcm')) {
      const rawBuffer = Buffer.from(audioData, 'base64');
      const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
      res.json({
        success: true,
        mimeType: 'audio/wav',
        audio: wavBuffer.toString('base64'),
      });
      return;
    }

    res.json({
      success: true,
      mimeType,
      audio: audioData,
    });
  } catch (error: any) {
    const errMsg = String(error?.message || error || '');
    const isQuota =
      errMsg.includes('429') ||
      errMsg.includes('quota') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.status === 429;

    if (isQuota) {
      // Activar cooldown de 12 horas para evitar sobrecargar y silenciar warnings
      ttsQuotaExhaustedUntil = Date.now() + 1000 * 60 * 60 * 12;
      res.json({
        success: false,
        quotaExhausted: true,
        fallbackToClient: true,
      });
      return;
    }

    res.json({
      success: false,
      error: 'Error generating natural speech with Gemini',
      fallbackToClient: true,
    });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'interfaz-puente-backend' });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In development, hook up Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Interfaz Puente] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Error]:', err);
});
