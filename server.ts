import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init the GenAI client to avoid crash on load if key is missing
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Full-stack server side API route for AI question generation
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const { topic, subject, difficulty, count = 5, customPrompt = '' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topik/Materi wajib diisi.' });
    }

    const ai = getGenAI();

    const systemInstruction = `Anda adalah seorang ahli pembuat soal ujian Computer Based Test (CBT) profesional. 
Tugas Anda adalah membuat soal pilihan ganda berkualitas tinggi dengan tingkat kesulitan yang sesuai (Mudah/Sedang/Sulit). 
Semua soal, pilihan, kunci jawaban, dan pembahasan harus disajikan dalam Bahasa Indonesia yang formal dan mudah dipahami.
Pilihan jawaban harus bervariasi dari A sampai E (5 opsi). Pastikan kunci jawaban sangat akurat dan pembahasan dideskripsikan secara mendalam dan jelas.`;

    let userPromptText = `Buatlah sebanyak ${count} soal pilihan ganda tentang topik "${topic}" untuk mata pelajaran "${subject || 'Umum'}".
Tingkat kesulitan soal adalah: ${difficulty || 'Sedang'}.
Setiap soal harus berisi opsi A, B, C, D, dan E, satu kunci jawaban yang benar, serta pembahasan ringkas namun jelas.`;

    if (customPrompt.trim()) {
      userPromptText += `\n\nCatatan atau Instruksi tambahan dari pengguna: ${customPrompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPromptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'Teks dari pertanyaan/soal ujian pilihan ganda.',
              },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                  E: { type: Type.STRING },
                },
                required: ['A', 'B', 'C', 'D', 'E'],
              },
              correctAnswer: {
                type: Type.STRING,
                description: "Kunci jawaban yang benar, harus salah satu dari: 'A', 'B', 'C', 'D', 'E'.",
              },
              discussion: {
                type: Type.STRING,
                description: 'Pembahasan lengkap dan mendalam mengapa jawaban tersebut benar.',
              },
            },
            required: ['text', 'options', 'correctAnswer', 'discussion'],
          },
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('No text generated or empty response from model.');
    }

    const questions = JSON.parse(textOutput);
    res.json({ success: true, questions });
  } catch (error: any) {
    console.error('Gemini Questions Generator Server Error:', error);
    res.status(500).json({
      error: error.message || 'Gagal membuat soal otomatis dengan AI. Pastikan GEMINI_API_KEY sudah dikonfigurasi dengan benar.',
    });
  }
});

// Setup Vite Dev Middleware / Static assets serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
