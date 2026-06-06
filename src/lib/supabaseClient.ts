import { createClient } from '@supabase/supabase-js';
import { Exam, ResultLog, Student, Teacher } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gxmhklclgohwwoheldck.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4bWhrbGNsZ29od3dvaGVsZGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTEyMTksImV4cCI6MjA5NjA4NzIxOX0.MQSUsT1CZWmMh54WITyGHV212tcL7NeT6hI-vPS9e8o';

let supabaseInstance: any;
try {
  if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
    throw new Error('Supabase URL tidak valid atau kosong.');
  }
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Supabase Anon Key kosong.');
  }
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error: any) {
  console.warn('Gagal menginisialisasi client Supabase asli. Mengaktifkan safe fallback client:', error.message || error);
  const createDummyClient = (err: any) => {
    const handler: any = {
      get(target: any, prop: string): any {
        if (prop === 'then') {
          return undefined;
        }
        return (...args: any[]) => {
          const promiseLike = {
            then: (resolve: any) => resolve({ data: null, error: err }),
            catch: (reject: any) => reject(err),
          };
          return new Proxy(promiseLike, handler);
        };
      }
    };
    return new Proxy({}, handler);
  };
  supabaseInstance = createDummyClient(error);
}

export const supabase = supabaseInstance;

// SQL script that users can run in Supabase SQL editor to bootstrap tables
export const SUPABASE_BOOTSTRAP_SQL = `-- SALIN SCRIPT INI KE SUPABASE SQL EDITOR UNTUK MEMBUAT TABEL --

-- 1. Tabel Ujian
CREATE TABLE IF NOT EXISTS cbt_exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Hasil Ujian
CREATE TABLE IF NOT EXISTS cbt_results (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Siswa
CREATE TABLE IF NOT EXISTS cbt_students (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Guru
CREATE TABLE IF NOT EXISTS cbt_teachers (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Nonaktifkan Row Level Security (RLS) untuk kemudahan akses (opsional, disarankan membuat policy jika RLS aktif)
ALTER TABLE cbt_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_teachers DISABLE ROW LEVEL SECURITY;

-- Masukkan data default awal
INSERT INTO cbt_students (id, username, name, password, subject) VALUES
('stud-1', 'ahmadsudjiwo', 'Ahmad Sudjiwo', 'siswa', 'Matematika'),
('stud-2', 'rianasafitri', 'Riana Safitri', 'siswa', 'Bahasa Indonesia')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cbt_teachers (id, username, name, subject, password) VALUES
('teach-1', 'mulyadi', 'Drs. Mulyadi', 'Matematika', 'guru'),
('teach-2', 'sari', 'Sari Wahyuni, S.Pd', 'Bahasa Indonesia', 'guru')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cbt_exams (id, title, subject, duration_minutes, questions, is_active) VALUES
('exam-1', 'Penilaian Akhir Semester - Matematika Dasar', 'Matematika', 15, '[
  {
    "id": "q-1-1",
    "text": "Diketahui persamaan kuadrat x² - 5x + 6 = 0. Manakah di antara berikut ini yang merupakan himpunan akar-akar dari persamaan tersebut?",
    "options": {
      "A": "{ 1, 6 }",
      "B": "{ 2, 3 }",
      "C": "{ -2, -3 }",
      "D": "{ 1, 5 }",
      "E": "{ -1, -6 }"
    },
    "correctAnswer": "B",
    "discussion": "Persamaan kuadrat x² - 5x + 6 = 0 dapat difaktorkan menjadi (x - 2)(x - 3) = 0. Dari sini didapatkan x - 2 = 0 atau x - 3 = 0, sehingga akarnya adalah x = 2 atau x = 3. Maka himpunan akarnya adalah { 2, 3 }."
  },
  {
    "id": "q-1-2",
    "text": "Sebuah segitiga siku-siku memiliki panjang alas 6 cm dan tinggi 8 cm. Berapakah panjang hipotenusa (sisi miring) segitiga tersebut?",
    "options": {
      "A": "10 cm",
      "B": "12 cm",
      "C": "14 cm",
      "D": "15 cm",
      "E": "18 cm"
    },
    "correctAnswer": "A",
    "discussion": "Berdasarkan teorema Pythagoras, sisi miring c² = a² + b². Dengan a = 6 cm dan b = 8 cm, maka c² = 6² + 8² = 36 + 64 = 100. Jadi, c = √100 = 10 cm."
  }
]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;
`;

// Direct sync check to track connection status
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  examsTable: boolean;
  resultsTable: boolean;
  studentsTable: boolean;
  teachersTable: boolean;
  message: string;
}> {
  const result = {
    connected: false,
    examsTable: false,
    resultsTable: false,
    studentsTable: false,
    teachersTable: false,
    message: 'Memulai pengecekan...',
  };

  try {
    // 1. Verify URL and key format
    if (!SUPABASE_URL || SUPABASE_URL.includes('MY_SUPABASE_URL')) {
      result.message = 'Supabase URL belum diatur atau masih default.';
      return result;
    }

    // 2. Perform test select
    const testExams = await supabase.from('cbt_exams').select('id').limit(1);
    result.connected = true;
    result.examsTable = !testExams.error;

    const testResults = await supabase.from('cbt_results').select('id').limit(1);
    result.resultsTable = !testResults.error;

    const testStudents = await supabase.from('cbt_students').select('id').limit(1);
    result.studentsTable = !testStudents.error;

    const testTeachers = await supabase.from('cbt_teachers').select('id').limit(1);
    result.teachersTable = !testTeachers.error;

    if (result.examsTable && result.resultsTable && result.studentsTable && result.teachersTable) {
      result.message = 'Sukses! Semua tabel terhubung dan siap digunakan.';
    } else {
      const missing = [];
      if (!result.examsTable) missing.push('cbt_exams');
      if (!result.resultsTable) missing.push('cbt_results');
      if (!result.studentsTable) missing.push('cbt_students');
      if (!result.teachersTable) missing.push('cbt_teachers');
      result.message = `Terhubung, namun ada tabel yang belum dibuat: ${missing.join(', ')}. Silakan salin script SQL di bawah ini dan jalankan di SQL Editor Supabase Anda.`;
    }
  } catch (error: any) {
    result.connected = false;
    result.message = `Kesalahan koneksi: ${error.message || error}`;
  }

  return result;
}

// ---------------- EXAMS ----------------
export async function getSupabaseExams(): Promise<Exam[] | null> {
  try {
    const { data, error } = await supabase
      .from('cbt_exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      subject: item.subject,
      durationMinutes: item.duration_minutes,
      questions: item.questions || [],
      isActive: item.is_active,
    }));
  } catch (err) {
    console.warn('Supabase getExams error (mungkin tabel belum dibuat):', err);
    return null; // Return null so we can fall back to local storage
  }
}

export async function upsertSupabaseExam(exam: Exam): Promise<boolean> {
  try {
    const { error } = await supabase.from('cbt_exams').upsert({
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      duration_minutes: exam.durationMinutes,
      questions: exam.questions,
      is_active: exam.isActive !== false,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase saveExam error:', err);
    return false;
  }
}

export async function deleteSupabaseExam(examId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cbt_exams').delete().eq('id', examId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteExam error:', err);
    return false;
  }
}

// ---------------- RESULTS ----------------
export async function getSupabaseResults(): Promise<ResultLog[] | null> {
  try {
    const { data, error } = await supabase
      .from('cbt_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      examId: item.exam_id,
      examTitle: item.exam_title,
      subject: item.subject,
      studentName: item.student_name,
      studentId: item.student_id,
      answers: item.answers || {},
      score: item.score,
      correctCount: item.correct_count,
      totalQuestions: item.total_questions,
      completedAt: item.completed_at,
    }));
  } catch (err) {
    console.warn('Supabase getResults error (mungkin tabel belum dibuat):', err);
    return null;
  }
}

export async function insertSupabaseResult(result: ResultLog): Promise<boolean> {
  try {
    const { error } = await supabase.from('cbt_results').insert({
      id: result.id,
      exam_id: result.examId,
      exam_title: result.examTitle,
      subject: result.subject,
      student_name: result.studentName,
      student_id: result.studentId,
      answers: result.answers,
      score: result.score,
      correct_count: result.correctCount,
      total_questions: result.totalQuestions,
      completed_at: result.completedAt,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase saveResult error:', err);
    return false;
  }
}

export async function clearSupabaseResults(): Promise<boolean> {
  try {
    const { error } = await supabase.from('cbt_results').delete().neq('id', '');
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase clearAllResults error:', err);
    return false;
  }
}

// ---------------- STUDENTS ----------------
export async function getSupabaseStudents(): Promise<Student[] | null> {
  try {
    const { data, error } = await supabase
      .from('cbt_students')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      username: item.username,
      name: item.name,
      password: item.password,
      subject: item.subject || undefined,
    }));
  } catch (err) {
    console.warn('Supabase getStudents error (mungkin tabel belum dibuat):', err);
    return null;
  }
}

export async function upsertSupabaseStudent(student: Student): Promise<boolean> {
  try {
    const { error } = await supabase.from('cbt_students').upsert({
      id: student.id,
      username: student.username,
      name: student.name,
      password: student.password,
      subject: student.subject || null,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase saveStudent error:', err);
    return false;
  }
}

export async function deleteSupabaseStudent(studentId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cbt_students').delete().eq('id', studentId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteStudent error:', err);
    return false;
  }
}

// ---------------- TEACHERS ----------------
export async function getSupabaseTeachers(): Promise<Teacher[] | null> {
  try {
    const { data, error } = await supabase
      .from('cbt_teachers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      username: item.username,
      name: item.name,
      subject: item.subject,
      password: item.password,
    }));
  } catch (err) {
    console.warn('Supabase getTeachers error (mungkin tabel belum dibuat):', err);
    return null;
  }
}

export async function upsertSupabaseTeacher(teacher: Teacher): Promise<boolean> {
  try {
    const { error } = await supabase.from('cbt_teachers').upsert({
      id: teacher.id,
      username: teacher.username,
      name: teacher.name,
      subject: teacher.subject,
      password: teacher.password,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase saveTeacher error:', err);
    return false;
  }
}

export async function deleteSupabaseTeacher(teacherId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cbt_teachers').delete().eq('id', teacherId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteTeacher error:', err);
    return false;
  }
}
