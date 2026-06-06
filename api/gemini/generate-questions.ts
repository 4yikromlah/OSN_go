import { GoogleGenAI, Type } from '@google/genai';

// Lazy client instantiation to avoid load errors
let aiClient: GoogleGenAI | null = null;
function getGenAI(apiKey: string): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflights
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sistem hanya mendukung opsi POST.' });
  }

  try {
    // Cek keberadaan API Key secara eksplisit
    if (!process.env.GEMINI_API_KEY) {
       throw new Error("GEMINI_API_KEY tidak terbaca oleh sistem");
    }

    const { topic, subject, difficulty, count = 5, customPrompt = '' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topik/Materi wajib diisi.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = getGenAI(apiKey);

    const systemInstruction = `Anda adalah seorang ahli pembuat soal ujian Computer Based Test (CBT) profesional. 
Tugas Anda adalah membuat soal pilihan ganda berkualitas tinggi dengan tingkat kesulitan yang sesuai (Mudah/Sedang/Sulit). 
Semua soal, pilihan, kunci jawaban, dan pembahasan harus disajikan dalam Bahasa Indonesia yang formal dan mudah dipahami.
Pilihan jawaban harus bervariasi dari A sampai E (5 opsi). Pastikan kunci jawaban sangat akurat dan pembahasan dideskripsikan secara mendalam dan jelas.`;

    let userPromptText = `Buatlah sebanyak ${count} soal pilihan ganda tentang topik "${topic}" untuk mata pelajaran "${subject || 'Umum'}".
Tingkat kesulitan soal adalah: ${difficulty || 'Sedang'}.
Setiap soal harus berisi opsi A, B, C, D, dan E, satu kunci jawaban yang benar, serta pembahasan ringkas namun jelas.`;

    if (customPrompt && customPrompt.trim()) {
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
      throw new Error('Tidak ada konten teks yang dihasilkan oleh model AI.');
    }

    const questions = JSON.parse(textOutput);
    return res.status(200).json({ success: true, questions });
  } catch (error: any) {
    console.error("DEBUG_ERROR:", error.message); // Ini akan muncul di log Vercel
    return res.status(500).json({ error: error.message });
  }
}
