export interface Question {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  discussion: string; // Pembahasan
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  questions: Question[];
  isActive?: boolean;
}

export interface ExamSession {
  examId: string;
  studentName: string;
  studentId: string;
  answers: { [questionId: string]: 'A' | 'B' | 'C' | 'D' | 'E' | '' };
  startTime: number; // epoch timestamp
  timeLeftSeconds: number;
  isCompleted: boolean;
}

export interface ResultLog {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  studentName: string;
  studentId: string;
  answers: { [questionId: string]: 'A' | 'B' | 'C' | 'D' | 'E' | '' };
  score: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
}

export type UserRole = 'admin' | 'student' | 'teacher' | null;

export interface Student {
  id: string;
  username: string;
  name: string;
  password: string;
  subject?: string; // Mata Pelajaran
}

export interface Teacher {
  id: string;
  username: string;
  name: string;
  subject: string; // Mata Pelajaran
  password: string;
}
