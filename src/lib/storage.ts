import { Exam, ResultLog, Student, Teacher } from '../types';
import { 
  getSupabaseExams, upsertSupabaseExam, deleteSupabaseExam,
  getSupabaseResults, insertSupabaseResult, clearSupabaseResults,
  getSupabaseStudents, upsertSupabaseStudent, deleteSupabaseStudent,
  getSupabaseTeachers, upsertSupabaseTeacher, deleteSupabaseTeacher
} from './supabaseClient';

const STORAGE_KEYS = {
  EXAMS: 'cbt_exams',
  RESULTS: 'cbt_results',
  STUDENTS: 'cbt_students',
  TEACHERS: 'cbt_teachers',
};

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'stud-1',
    username: 'ahmadsudjiwo',
    name: 'Ahmad Sudjiwo',
    password: 'siswa',
    subject: 'Matematika',
  },
  {
    id: 'stud-2',
    username: 'rianasafitri',
    name: 'Riana Safitri',
    password: 'siswa',
    subject: 'Bahasa Indonesia',
  }
];

const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 'teach-1',
    username: 'mulyadi',
    name: 'Drs. Mulyadi',
    subject: 'Matematika',
    password: 'guru',
  },
  {
    id: 'teach-2',
    username: 'sari',
    name: 'Sari Wahyuni, S.Pd',
    subject: 'Bahasa Indonesia',
    password: 'guru',
  }
];

const DEFAULT_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'Penilaian Akhir Semester - Matematika Dasar',
    subject: 'Matematika',
    durationMinutes: 15,
    questions: [
      {
        id: 'q-1-1',
        text: 'Diketahui persamaan kuadrat x² - 5x + 6 = 0. Manakah di antara berikut ini yang merupakan himpunan akar-akar dari persamaan tersebut?',
        options: {
          A: '{ 1, 6 }',
          B: '{ 2, 3 }',
          C: '{ -2, -3 }',
          D: '{ 1, 5 }',
          E: '{ -1, -6 }',
        },
        correctAnswer: 'B',
        discussion: 'Persamaan kuadrat x² - 5x + 6 = 0 dapat difaktorkan menjadi (x - 2)(x - 3) = 0. Dari sini didapatkan x - 2 = 0 atau x - 3 = 0, sehingga akarnya adalah x = 2 atau x = 3. Maka himpunan akarnya adalah { 2, 3 }.',
      },
      {
        id: 'q-1-2',
        text: 'Sebuah segitiga siku-siku memiliki panjang alas 6 cm dan tinggi 8 cm. Berapakah panjang hipotenusa (sisi miring) segitiga tersebut?',
        options: {
          A: '10 cm',
          B: '12 cm',
          C: '14 cm',
          D: '15 cm',
          E: '18 cm',
        },
        correctAnswer: 'A',
        discussion: 'Berdasarkan teorema Pythagoras, sisi miring c² = a² + b². Dengan a = 6 cm dan b = 8 cm, maka c² = 6² + 8² = 36 + 64 = 100. Jadi, c = √100 = 10 cm.',
      },
      {
        id: 'q-1-3',
        text: 'Dari angka 1, 2, 3, dan 4 akan disusun bilangan raturan ganjil tanpa pengulangan angka. Berapa banyaknya susunan bilangan ganjil yang dapat dibuat?',
        options: {
          A: '6',
          B: '8',
          C: '10',
          D: '12',
          E: '16',
        },
        correctAnswer: 'D',
        discussion: 'Untuk menyusun bilangan ratusan ganjil, posisi satuan harus diisi oleh angka ganjil (1 atau 3). Ada 2 opsi untuk satuan.\nSetelah satuan dipilih, sisa angka adalah 3. Posisi ratusan dapat diisi oleh salah satu dari 3 angka tersebut. Posisi puluhan dapat diisi oleh salah satu dari 2 angka tersisa.\nTotal kemungkinan susunan = 3 x 2 x 2 = 12 bilangan.',
      },
      {
        id: 'q-1-4',
        text: 'Jika rata-rata dari lima bilangan berurutan adalah 15, berapakah bilangan terkecil di antara bilangan-bilangan tersebut?',
        options: {
          A: '11',
          B: '12',
          C: '13',
          D: '14',
          E: '15',
        },
        correctAnswer: 'C',
        discussion: 'Misalkan lima bilangan berurutan adalah x, x+1, x+2, x+3, x+4. Jumlah dari kelima bilangan tersebut adalah 5x + 10.\nRata-rata = (5x + 10) / 5 = x + 2.\nDiketahui rata-rata adalah 15, sehingga x + 2 = 15, diperoleh x = 13. Jadi bilangan terkecil adalah 13.',
      },
      {
        id: 'q-1-5',
        text: 'Berapakah hasil dari turunan pertama fungsi f(x) = 3x² - 4x + 5?',
        options: {
          A: '6x - 4',
          B: '3x - 4',
          C: '6x + 5',
          D: '6x² - 4',
          E: '3x - 5',
        },
        correctAnswer: 'A',
        discussion: 'Menggunakan rumus umum turunan f(x) = axⁿ -> f\'(x) = a * n * xⁿ⁻¹. Maka turunan dari 3x² adalah 3 * 2 * x = 6x, turunan dari -4x adalah -4, dan turunan dari konstanta 5 adalah 0. Hasil akhirnya f\'(x) = 6x - 4.',
      },
    ],
  },
  {
    id: 'exam-2',
    title: 'Penilaian Harian - Tata Bahasa Indonesia',
    subject: 'Bahasa Indonesia',
    durationMinutes: 10,
    questions: [
      {
        id: 'q-2-1',
        text: 'Manakah penulisan kalimat berikut yang memenuhi kaidah Ejaan yang Disempurnakan (EYD) dengan benar?',
        options: {
          A: 'Ibu membeli apel Malang di pasar pagi kemarin.',
          B: 'Ibu membeli Apel Malang di Pasar Pagi kemarin.',
          C: 'Ibu membeli apel malang di pasar pagi kemarin.',
          D: 'Ibu membeli apel malang di Pasar Pagi kemarin.',
          E: 'Ibu membeli Apel malang di pasar pagi kemarin.',
        },
        correctAnswer: 'C',
        discussion: 'Nama buah (apel malang/jenis apel) bukan merupakan nama geografi yang diawali nama unsur geografi melainkan jenis jenis tumbuhan, sehingga ditulis menggunakan huruf kecil. Keterangan waktu dan tempat umum "pasar pagi", "kemarin" juga menggunakan huruf kecil. Jadi penulisan yang benar adalah C.',
      },
      {
        id: 'q-2-2',
        text: 'Kata hubung (konjungsi) subordinatif syarat ditunjukkan oleh kata...',
        options: {
          A: 'Sebab',
          B: 'Sehingga',
          C: 'Jika',
          D: 'Walaupun',
          E: 'Bahwa',
        },
        correctAnswer: 'C',
        discussion: '"Jika", "apabila", "jikalau", dan "asalkan" merupakan konjungsi subordinatif syarat. Sementara "sebab" adalah kausalitas, "sehingga" hasil/akibat, "walaupun" konsesif, dan "bahwa" penjelasan.',
      },
    ],
  }
];

const DEFAULT_RESULTS: ResultLog[] = [
  {
    id: 'res-1',
    examId: 'exam-1',
    examTitle: 'Penilaian Akhir Semester - Matematika Dasar',
    subject: 'Matematika',
    studentName: 'Ahmad Sudjiwo',
    studentId: 'NISN001',
    answers: {
      'q-1-1': 'B',
      'q-1-2': 'A',
      'q-1-3': 'A', // salah, jawaban harusnya D
      'q-1-4': 'C',
      'q-1-5': 'A',
    },
    score: 80,
    correctCount: 4,
    totalQuestions: 5,
    completedAt: '2026-06-01 14:30',
  },
  {
    id: 'res-2',
    examId: 'exam-2',
    examTitle: 'Penilaian Harian - Tata Bahasa Indonesia',
    subject: 'Bahasa Indonesia',
    studentName: 'Riana Safitri',
    studentId: 'NISN002',
    answers: {
      'q-2-1': 'C',
      'q-2-2': 'D', // salah, jawaban harusnya C
    },
    score: 50,
    correctCount: 1,
    totalQuestions: 2,
    completedAt: '2026-06-01 15:45',
  }
];

// Initialize defaults if they do not exist in localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  if (localStorage.getItem(STORAGE_KEYS.EXAMS) === null) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(DEFAULT_EXAMS));
  }
  if (localStorage.getItem(STORAGE_KEYS.RESULTS) === null) {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(DEFAULT_RESULTS));
  }
  if (localStorage.getItem(STORAGE_KEYS.STUDENTS) === null) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  }
  if (localStorage.getItem(STORAGE_KEYS.TEACHERS) === null) {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
  }
}

export function getExams(): Exam[] {
  const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveExams(exams: Exam[]): void {
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
}

export function saveExam(exam: Exam): void {
  const exams = getExams();
  const index = exams.findIndex((e) => e.id === exam.id);
  if (index >= 0) {
    exams[index] = exam;
  } else {
    exams.push(exam);
  }
  saveExams(exams);
  upsertSupabaseExam(exam).catch((err) => console.warn('Supabase saveExam failed:', err));
}

export function deleteExam(examId: string): void {
  const exams = getExams();
  const filtered = exams.filter((e) => e.id !== examId);
  saveExams(filtered);
  deleteSupabaseExam(examId).catch((err) => console.warn('Supabase deleteExam failed:', err));
}

export function getResults(): ResultLog[] {
  const data = localStorage.getItem(STORAGE_KEYS.RESULTS);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveResult(result: ResultLog): void {
  const results = getResults();
  results.unshift(result); // Add latest to the top
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  insertSupabaseResult(result).catch((err) => console.warn('Supabase saveResult failed:', err));
}

export function clearAllResults(): void {
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify([]));
  clearSupabaseResults().catch((err) => console.warn('Supabase clearAllResults failed:', err));
}

export function getStudents(): Student[] {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  // Background bulk sync
  Promise.all(students.map((s) => upsertSupabaseStudent(s)))
    .catch((err) => console.warn('Supabase bulk saveStudents failed:', err));
}

export function saveStudent(student: Student): void {
  const students = getStudents();
  const index = students.findIndex((s) => s.id === student.id);
  if (index >= 0) {
    students[index] = student;
  } else {
    students.push(student);
  }
  saveStudents(students);
}

export function deleteStudent(studentId: string): void {
  const students = getStudents();
  const filtered = students.filter((s) => s.id !== studentId);
  saveStudents(filtered);
  deleteSupabaseStudent(studentId).catch((err) => console.warn('Supabase deleteStudent failed:', err));
}

export function getTeachers(): Teacher[] {
  const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveTeachers(teachers: Teacher[]): void {
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  // Background bulk sync
  Promise.all(teachers.map((t) => upsertSupabaseTeacher(t)))
    .catch((err) => console.warn('Supabase bulk saveTeachers failed:', err));
}

export function saveTeacher(teacher: Teacher): void {
  const teachers = getTeachers();
  const index = teachers.findIndex((t) => t.id === teacher.id);
  if (index >= 0) {
    teachers[index] = teacher;
  } else {
    teachers.push(teacher);
  }
  saveTeachers(teachers);
}

export function deleteTeacher(teacherId: string): void {
  const teachers = getTeachers();
  const filtered = teachers.filter((t) => t.id !== teacherId);
  saveTeachers(filtered);
  deleteSupabaseTeacher(teacherId).catch((err) => console.warn('Supabase deleteTeacher failed:', err));
}

// Global pull/sync function to download latest data from Supabase and sync local storage
export async function syncStorageWithSupabase(): Promise<{
  exams: Exam[] | null;
  results: ResultLog[] | null;
  students: Student[] | null;
  teachers: Teacher[] | null;
}> {
  const [exams, results, students, teachers] = await Promise.all([
    getSupabaseExams(),
    getSupabaseResults(),
    getSupabaseStudents(),
    getSupabaseTeachers(),
  ]);

  if (exams !== null && exams.length > 0) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  }
  if (results !== null) {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  }
  if (students !== null && students.length > 0) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
  if (teachers !== null && teachers.length > 0) {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }

  return { exams, results, students, teachers };
}
