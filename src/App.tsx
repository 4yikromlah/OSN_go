import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Clock, ShieldCheck, BookOpen, Award, BookMarked, 
  Timer, ChevronLeft, ChevronRight, Plus, Trash2, Users, 
  CheckCircle, XCircle, Search, Lock, User, PlusCircle, CheckCircle2, AlertTriangle, FileText,
  UserCheck, UserPlus, Edit3, Key, Shield, Sparkles, BrainCircuit, RefreshCw,
  Download, FileUp, Eye, EyeOff
} from 'lucide-react';

import { Exam, ExamSession, ResultLog, Question, UserRole, Student, Teacher } from './types';
import { 
  getExams, getResults, saveResult, saveExam, deleteExam, clearAllResults, 
  getStudents, saveStudent, saveStudents, deleteStudent,
  getTeachers, saveTeacher, deleteTeacher, saveTeachers,
  syncStorageWithSupabase
} from './lib/storage';
import { testSupabaseConnection, SUPABASE_BOOTSTRAP_SQL } from './lib/supabaseClient';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import WordImportHelper from './components/WordImportHelper';
import smasaLogo from './assets/images/smasa_logo_1780390180944.png';

export default function App() {
  // Session State
  const [role, setRole] = useState<UserRole>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_role');
      return saved ? (saved as UserRole) : null;
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<{ name: string; studentId?: string } | null>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  // App Data (Loaded from Storage)
  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      return getExams();
    } catch {
      return [];
    }
  });
  const [results, setResults] = useState<ResultLog[]>(() => {
    try {
      return getResults();
    } catch {
      return [];
    }
  });
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      return getStudents();
    } catch {
      return [];
    }
  });

  // Navigation / View states
  const [activeScreen, setActiveScreen] = useState<'login' | 'student-dashboard' | 'exam-active' | 'review-screen' | 'admin-dashboard'>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_activeScreen');
      return (saved as any) || 'login';
    } catch {
      return 'login';
    }
  });
  
  // Login Form States
  const [loginTab, setLoginTab] = useState<'student' | 'teacher' | 'admin'>('student');
  const [studentUsernameInput, setStudentUsernameInput] = useState('');
  const [studentPasswordInput, setStudentPasswordInput] = useState('');
  const [teacherUsernameInput, setTeacherUsernameInput] = useState('');
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_currentTeacher');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_currentStudent');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Exam States
  const [activeSession, setActiveSession] = useState<ExamSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_activeSession');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_currentQuestionIndex');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Active Review State (to examine detailed breakdown of score)
  const [activeReviewResult, setActiveReviewResult] = useState<ResultLog | null>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_activeReviewResult');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin Dashboard States
  const [adminTab, setAdminTab] = useState<'exams' | 'students' | 'results' | 'teachers' | 'supabase'>(() => {
    try {
      const saved = sessionStorage.getItem('cbt_adminTab');
      return (saved as any) || 'exams';
    } catch {
      return 'exams';
    }
  });
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedResultExamId, setSelectedResultExamId] = useState<string>('ALL');
  const [selectedExamForEdit, setSelectedExamForEdit] = useState<Exam | null>(null);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [isImportingQuestions, setIsImportingQuestions] = useState(false);

  // Supabase monitoring state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    examsTable: boolean;
    resultsTable: boolean;
    studentsTable: boolean;
    teachersTable: boolean;
    message: string;
    checking: boolean;
  }>({
    connected: false,
    examsTable: false,
    resultsTable: false,
    studentsTable: false,
    teachersTable: false,
    message: 'Menghubungkan ke Supabase...',
    checking: false,
  });

  const checkSupabase = async () => {
    setSupabaseStatus(prev => ({ ...prev, checking: true }));
    try {
      const status = await testSupabaseConnection();
      setSupabaseStatus({
        ...status,
        checking: false,
      });
    } catch (e: any) {
      setSupabaseStatus({
        connected: false,
        examsTable: false,
        resultsTable: false,
        studentsTable: false,
        teachersTable: false,
        message: 'Gagal mengecek: ' + e.message,
        checking: false,
      });
    }
  };

  // Student Management States
  const [studentUsername, setStudentUsername] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentSubject, setStudentSubject] = useState('');
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Teacher Management States
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      return getTeachers();
    } catch {
      return [];
    }
  });
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherNameInput, setTeacherNameInput] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<Teacher | null>(null);
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');

  // New Exam Form
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newExamDuration, setNewExamDuration] = useState(15);

  // New Question Form (inside selected exam edit mode)
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQOptA, setNewQOptA] = useState('');
  const [newQOptB, setNewQOptB] = useState('');
  const [newQOptC, setNewQOptC] = useState('');
  const [newQOptD, setNewQOptD] = useState('');
  const [newQOptE, setNewQOptE] = useState('');
  const [newQKey, setNewQKey] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [newQDiscussion, setNewQDiscussion] = useState('');

  // AI Question Generator States
  const [showAiQuestionGenerator, setShowAiQuestionGenerator] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Sedang');
  const [aiCount, setAiCount] = useState(5);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Selected question IDs for bulk operations
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Hapus',
    cancelText = 'Batal'
  ) => {
    setConfirmDialog({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      confirmText,
      cancelText,
    });
  };

  // Load Initial Storage Data & Sync with Supabase
  useEffect(() => {
    // 1. Instant local load
    setExams(getExams());
    setResults(getResults());
    setStudents(getStudents());
    setTeachers(getTeachers());

    // 2. Perform background sync from Supabase
    const initSync = async () => {
      try {
        const synced = await syncStorageWithSupabase();
        if (synced.exams !== null) setExams(getExams());
        if (synced.results !== null) setResults(getResults());
        if (synced.students !== null) setStudents(getStudents());
        if (synced.teachers !== null) setTeachers(getTeachers());
      } catch (err) {
        console.warn('Initial Supabase Sync failed:', err);
      }
      try {
        const status = await testSupabaseConnection();
        setSupabaseStatus({ ...status, checking: false });
      } catch (e) {}
    };

    initSync();
  }, []);

  // Sync state to sessionStorage whenever it changes to support page refresh (F5) persistence
  useEffect(() => {
    try {
      if (role) {
        sessionStorage.setItem('cbt_role', role);
      } else {
        sessionStorage.removeItem('cbt_role');
      }
    } catch (e) {
      console.error(e);
    }
  }, [role]);

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem('cbt_currentUser', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('cbt_currentUser');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      if (activeScreen) {
        sessionStorage.setItem('cbt_activeScreen', activeScreen);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeScreen]);

  useEffect(() => {
    try {
      if (currentTeacher) {
        sessionStorage.setItem('cbt_currentTeacher', JSON.stringify(currentTeacher));
      } else {
        sessionStorage.removeItem('cbt_currentTeacher');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentTeacher]);

  useEffect(() => {
    try {
      if (currentStudent) {
        sessionStorage.setItem('cbt_currentStudent', JSON.stringify(currentStudent));
      } else {
        sessionStorage.removeItem('cbt_currentStudent');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentStudent]);

  useEffect(() => {
    try {
      if (activeSession) {
        sessionStorage.setItem('cbt_activeSession', JSON.stringify(activeSession));
      } else {
        sessionStorage.removeItem('cbt_activeSession');
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeSession]);

  useEffect(() => {
    try {
      sessionStorage.setItem('cbt_currentQuestionIndex', currentQuestionIndex.toString());
    } catch (e) {
      console.error(e);
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    try {
      if (activeReviewResult) {
        sessionStorage.setItem('cbt_activeReviewResult', JSON.stringify(activeReviewResult));
      } else {
        sessionStorage.removeItem('cbt_activeReviewResult');
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeReviewResult]);

  useEffect(() => {
    try {
      if (adminTab) {
        sessionStorage.setItem('cbt_adminTab', adminTab);
      }
    } catch (e) {
      console.error(e);
    }
  }, [adminTab]);

  // Timer Tick Effect for Active Exam
  useEffect(() => {
    if (activeScreen !== 'exam-active' || !activeSession || activeSession.isCompleted) return;

    const timer = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        
        const secondsElapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        const totalDurationSeconds = prev.timeLeftSeconds + Math.floor((Date.now() - prev.startTime) / 1000); // stable total seconds
        const secondsRemaining = (prev.examId ? (exams.find(e => e.id === prev.examId)?.durationMinutes || 15) * 60 : 900) - secondsElapsed;

        if (secondsRemaining <= 0) {
          clearInterval(timer);
          // Auto submit
          handleAutoSubmit(prev);
          return { ...prev, timeLeftSeconds: 0, isCompleted: true };
        }

        return {
          ...prev,
          timeLeftSeconds: secondsRemaining,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeScreen, activeSession, exams]);

  // Handle Logouts
  const handleLogout = () => {
    setRole(null);
    setCurrentUser(null);
    setCurrentStudent(null);
    setCurrentTeacher(null);
    setActiveSession(null);
    setActiveReviewResult(null);
    setSelectedExamForEdit(null);
    setIsImportingQuestions(false);
    setActiveScreen('login');
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
  };

  // Teacher Login Action
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!teacherUsernameInput.trim()) {
      setLoginError('Silakan masukkan Username Guru Anda.');
      return;
    }
    if (!teacherPasswordInput) {
      setLoginError('Silakan masukkan Password Guru Anda.');
      return;
    }

    const matchedTeacher = teachers.find(
      (t) => t.username.toLowerCase() === teacherUsernameInput.toLowerCase().trim()
    );

    if (!matchedTeacher) {
      setLoginError('Username Guru tidak ditemukan. Hubungi Administrator jika belum terdaftar.');
      return;
    }

    if (matchedTeacher.password !== teacherPasswordInput) {
      setLoginError('Password Guru salah. Silakan coba lagi.');
      return;
    }

    setCurrentUser({ name: matchedTeacher.name });
    setRole('teacher');
    setCurrentTeacher(matchedTeacher);
    setActiveScreen('admin-dashboard');
    setAdminTab('exams');
    setTeacherUsernameInput('');
    setTeacherPasswordInput('');
  };

  // Student Login Action
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!studentUsernameInput.trim()) {
      setLoginError('Silakan masukkan Username Anda.');
      return;
    }
    if (!studentPasswordInput) {
      setLoginError('Silakan masukkan Password Anda.');
      return;
    }

    const matchedStudent = students.find(
      (s) => s.username.toLowerCase() === studentUsernameInput.toLowerCase().trim()
    );

    if (!matchedStudent) {
      setLoginError('Username tidak terdaftar. Hubungi Administrator untuk didaftarkan.');
      return;
    }

    if (matchedStudent.password !== studentPasswordInput) {
      setLoginError('Password salah. Silakan coba lagi.');
      return;
    }

    const sId = matchedStudent.id;
    const newStudent = { name: matchedStudent.name, studentId: sId };
    
    setCurrentUser(newStudent);
    setRole('student');
    setCurrentStudent(matchedStudent);
    setActiveScreen('student-dashboard');
    
    // Clear login inputs
    setStudentUsernameInput('');
    setStudentPasswordInput('');
  };

  // Student starts an exam from the dashboard
  const handleStartExam = (exam: Exam) => {
    if (!currentStudent) return;
    if (exam.questions.length === 0) {
      alert('Maaf, Ujian ini belum memiliki soal. Silakan hubungi Administrator.');
      return;
    }

    const sId = currentStudent.id;
    const newStudent = { name: currentStudent.name, studentId: sId };
    
    // Create active exam session
    const initialAnswers: { [key: string]: 'A' | 'B' | 'C' | 'D' | 'E' | '' } = {};
    exam.questions.forEach(q => {
      initialAnswers[q.id] = '';
    });

    const session: ExamSession = {
      examId: exam.id,
      studentName: newStudent.name,
      studentId: sId,
      answers: initialAnswers,
      startTime: Date.now(),
      timeLeftSeconds: exam.durationMinutes * 60,
      isCompleted: false,
    };

    setActiveSession(session);
    setCurrentQuestionIndex(0);
    setActiveScreen('exam-active');
  };

  // Admin Login Action
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (adminPassword === 'admin321' || adminPassword === 'Admin123') {
      setCurrentUser({ name: 'Administrator' });
      setRole('admin');
      setActiveScreen('admin-dashboard');
      setAdminPassword('');
    } else {
      setLoginError('Password Admin salah! (Gunakan password "admin" untuk masuk)');
    }
  };

  // Student select option answer
  const handleSelectAnswer = (option: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (!activeSession) return;
    const activeExam = exams.find(e => e.id === activeSession.examId);
    if (!activeExam) return;
    const currentQuestion = activeExam.questions[currentQuestionIndex];

    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: option,
        },
      };
    });
  };

  // Submit Exam manually
  const handleSubmitExam = () => {
    if (!activeSession) return;
    saveExamResultData(activeSession);
  };

  // Auto submit when time runs out
  const handleAutoSubmit = (session: ExamSession) => {
    saveExamResultData(session);
  };

  // Core Scoring & Saving Logic
  const saveExamResultData = (session: ExamSession) => {
    const activeExam = exams.find(e => e.id === session.examId);
    if (!activeExam) return;

    let correctCount = 0;
    activeExam.questions.forEach((q) => {
      const studentAns = session.answers[q.id];
      if (studentAns === q.correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = activeExam.questions.length;
    // Round score to single decimal/integer
    const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const formattedDate = new Date().toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const resultLog: ResultLog = {
      id: `res-log-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      examId: activeExam.id,
      examTitle: activeExam.title,
      subject: activeExam.subject,
      studentName: session.studentName,
      studentId: session.studentId,
      answers: session.answers,
      score: finalScore,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      completedAt: formattedDate,
    };

    saveResult(resultLog);

    // Refresh application scoreboards
    setResults(getResults());
    setActiveReviewResult(resultLog);
    setActiveScreen('review-screen');
    setShowSubmitConfirm(false);
  };

  // Admin Create New Exam
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamSubject.trim()) {
      alert('Semua bidang wajib diisi!');
      return;
    }

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      title: newExamTitle.trim(),
      subject: newExamSubject.trim(),
      durationMinutes: Number(newExamDuration) || 15,
      questions: [],
    };

    saveExam(newExam);
    setExams(getExams());
    setShowAddExamModal(false);
    
    // Clear state
    setNewExamTitle('');
    setNewExamSubject('');
    setNewExamDuration(15);
    
    // Auto select newly created exam for editing
    setSelectedExamForEdit(newExam);
  };

  // Admin Delete Exam
  const handleDeleteExam = (examId: string) => {
    triggerConfirm(
      'Hapus Paket Ujian',
      'Apakah Anda yakin ingin menghapus ujian ini? Semua data terkait soal di dalamnya akan hilang.',
      () => {
        deleteExam(examId);
        setExams(getExams());
        if (selectedExamForEdit?.id === examId) {
          setSelectedExamForEdit(null);
        }
      }
    );
  };

  // Admin Toggle Active Exam status
  const handleToggleExamActive = (examId: string) => {
    const targetExam = exams.find(e => e.id === examId);
    if (!targetExam) return;
    const updatedExam = {
      ...targetExam,
      isActive: targetExam.isActive === false ? true : false
    };
    saveExam(updatedExam);
    setExams(getExams());
    if (selectedExamForEdit?.id === examId) {
      setSelectedExamForEdit(updatedExam);
    }
  };

  // Admin Add Question Manually
  const handleAddQuestionManually = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForEdit) return;

    if (!newQText.trim() || !newQOptA.trim() || !newQOptB.trim()) {
      alert('Teks pertanyaan, pilihan A dan pilihan B adalah bidang minimum wajib!');
      return;
    }

    const newQuestion: Question = {
      id: `q-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      text: newQText.trim(),
      options: {
        A: newQOptA.trim(),
        B: newQOptB.trim(),
        C: newQOptC.trim() || '-',
        D: newQOptD.trim() || '-',
        E: newQOptE.trim() || '-',
      },
      correctAnswer: newQKey,
      discussion: newQDiscussion.trim() || 'Tidak ada pembahasan.',
    };

    const updatedExam: Exam = {
      ...selectedExamForEdit,
      questions: [...selectedExamForEdit.questions, newQuestion],
    };

    saveExam(updatedExam);
    setExams(getExams());
    setSelectedExamForEdit(updatedExam);

    // Reset fields
    setNewQText('');
    setNewQOptA('');
    setNewQOptB('');
    setNewQOptC('');
    setNewQOptD('');
    setNewQOptE('');
    setNewQKey('A');
    setNewQDiscussion('');
    setShowAddQuestionForm(false);
  };

  // Admin Edit Exam general info
  const handleUpdateExamMetadata = (title: string, subject: string, duration: number) => {
    if (!selectedExamForEdit) return;
    const updated: Exam = {
      ...selectedExamForEdit,
      title,
      subject,
      durationMinutes: duration,
    };
    saveExam(updated);
    setExams(getExams());
    setSelectedExamForEdit(updated);
  };

  // Admin Delete Question inside Exam Edit screen
  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedExamForEdit) return;
    const filteredQuestions = selectedExamForEdit.questions.filter(q => q.id !== questionId);
    const updated: Exam = {
      ...selectedExamForEdit,
      questions: filteredQuestions,
    };
    saveExam(updated);
    setExams(getExams());
    setSelectedExamForEdit(updated);
    
    // Remove from checked list if deleted individually
    setSelectedQuestionIds(prev => prev.filter(id => id !== questionId));
  };

  // Bulk delete selected questions
  const handleDeleteSelectedQuestions = () => {
    if (!selectedExamForEdit) return;
    if (selectedQuestionIds.length === 0) {
      alert('Silakan pilih soal yang ingin dihapus terlebih dahulu menggunakan checkbox.');
      return;
    }

    triggerConfirm(
      'Hapus Soal Terpilih',
      `Apakah Anda yakin ingin menghapus ${selectedQuestionIds.length} soal yang dipilih?`,
      () => {
        const remainingQuestions = selectedExamForEdit.questions.filter(q => !selectedQuestionIds.includes(q.id));
        const updated: Exam = {
          ...selectedExamForEdit,
          questions: remainingQuestions,
        };
        saveExam(updated);
        setExams(getExams());
        setSelectedExamForEdit(updated);
        setSelectedQuestionIds([]);
      }
    );
  };

  // Delete all questions in the selected exam
  const handleDeleteAllQuestions = () => {
    if (!selectedExamForEdit) return;
    if (selectedExamForEdit.questions.length === 0) {
      alert('Ujian ini tidak memiliki soal untuk dihapus.');
      return;
    }

    triggerConfirm(
      'Kosongkan Semua Soal',
      'Apakah Anda yakin ingin menghapus SEMUA soal dalam paket ujian ini? Tindakan ini tidak dapat dibatalkan.',
      () => {
        const updated: Exam = {
          ...selectedExamForEdit,
          questions: [],
        };
        saveExam(updated);
        setExams(getExams());
        setSelectedExamForEdit(updated);
        setSelectedQuestionIds([]);
      }
    );
  };

  // Admin handle bulk questions loaded via WordImportHelper
  const handleBulkImportSave = (bulkQuestions: Question[]) => {
    if (!selectedExamForEdit) return;
    const updated: Exam = {
      ...selectedExamForEdit,
      questions: [...selectedExamForEdit.questions, ...bulkQuestions],
    };
    saveExam(updated);
    setExams(getExams());
    setSelectedExamForEdit(updated);
    setIsImportingQuestions(false);
  };

  // AI-Assisted Question Generator Action
  const handleGenerateAiQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForEdit) return;
    if (!aiTopic.trim()) {
      setAiError('Silakan masukkan Topik atau Materi pembahasan.');
      return;
    }
    
    setAiIsGenerating(true);
    setAiError('');

    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          subject: selectedExamForEdit.subject,
          difficulty: aiDifficulty,
          count: aiCount,
          customPrompt: aiCustomPrompt.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Terjadi kesalahan saat memanggil server API.');
      }

      // Format AI results into local Question array
      const generatedQuestions: Question[] = data.questions.map((q: any, index: number) => ({
        id: `q-ai-${Date.now()}-${index}-${Math.floor(100 + Math.random() * 900)}`,
        text: q.text,
        options: {
          A: q.options?.A || 'Jawaban A',
          B: q.options?.B || 'Jawaban B',
          C: q.options?.C || 'Jawaban C',
          D: q.options?.D || 'Jawaban D',
          E: q.options?.E || 'Jawaban E',
        },
        correctAnswer: (['A', 'B', 'C', 'D', 'E'].includes(q.correctAnswer) ? q.correctAnswer : 'A') as 'A' | 'B' | 'C' | 'D' | 'E',
        discussion: q.discussion || 'Tidak ada pembahasan khusus.',
      }));

      const updatedExam: Exam = {
        ...selectedExamForEdit,
        questions: [...selectedExamForEdit.questions, ...generatedQuestions],
      };

      saveExam(updatedExam);
      setExams(getExams());
      setSelectedExamForEdit(updatedExam);

      // Clean AI form success states
      setAiTopic('');
      setAiCustomPrompt('');
      setShowAiQuestionGenerator(false);
    } catch (err: any) {
      console.error('AI Generator error:', err);
      setAiError(err.message || 'Koneksi gagal atau kunci AI belum diatur.');
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleClearResultsLog = () => {
    triggerConfirm(
      'Hapus Log Hasil Ujian',
      'Apakah Anda yakin ingin menghapus semua daftar hasil ujian siswa? Tindakan ini tidak dapat dibatalkan.',
      () => {
        clearAllResults();
        setResults([]);
      }
    );
  };

  const handleExportResultsCSV = () => {
    if (filteredResults.length === 0) {
      alert('Tidak ada data hasil ujian yang dapat diekspor.');
      return;
    }

    // Header row with UTF-8 BOM representation for correct Excel character parsing
    let csvContent = '\uFEFF';
    csvContent += 'No,Nama Siswa,NISN/Username,Paket Ujian,Mata Pelajaran,Tanggal Selesai,Benar,Total Soal,Skor,Status\n';

    filteredResults.forEach((res, index) => {
      const status = res.score >= 70 ? 'LULUS' : 'REMEDIAL';
      const name = res.studentName.replace(/"/g, '""');
      const studentId = (res.studentId || '').replace(/"/g, '""');
      const examTitle = res.examTitle.replace(/"/g, '""');
      const subject = res.subject.replace(/"/g, '""');
      const completedAt = res.completedAt.replace(/"/g, '""');
      
      const row = [
        index + 1,
        `"${name}"`,
        `"${studentId}"`,
        `"${examTitle}"`,
        `"${subject}"`,
        `"${completedAt}"`,
        res.correctCount,
        res.totalQuestions,
        `"${res.score}%"`,
        status
      ].join(',');
      
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const packetSuffix = selectedResultExamId !== 'ALL' 
      ? `_${filteredResults[0]?.examTitle.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}`
      : '_Semua_Paket';
    link.setAttribute('download', `rekap_hasil_ujian${packetSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Student Actions
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUsername.trim() || !studentNameInput.trim() || !studentPassword.trim() || !studentSubject.trim()) {
      alert('Semua bidang (Username, Nama, Mata Pelajaran, Password) wajib diisi!');
      return;
    }

    const isUsernameDuplicate = students.some(
      (s) =>
        s.username.toLowerCase().trim() === studentUsername.toLowerCase().trim() &&
        s.id !== selectedStudentForEdit?.id
    );

    if (isUsernameDuplicate) {
      alert('Username sudah digunakan oleh siswa lain. Silakan pakai username unik.');
      return;
    }

    const studentToSave: Student = {
      id: selectedStudentForEdit?.id || `stud-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      username: studentUsername.trim(),
      name: studentNameInput.trim(),
      password: studentPassword.trim(),
      subject: studentSubject.trim(),
    };

    saveStudent(studentToSave);
    const updatedStudents = getStudents();
    setStudents(updatedStudents);

    // Reset Form
    setStudentUsername('');
    setStudentNameInput('');
    setStudentPassword('');
    setStudentSubject('');
    setSelectedStudentForEdit(null);
    setShowAddStudentForm(false);
  };

  const handleEditStudentClick = (student: Student) => {
    setSelectedStudentForEdit(student);
    setStudentUsername(student.username);
    setStudentNameInput(student.name);
    setStudentPassword(student.password);
    setStudentSubject(student.subject || '');
    setShowAddStudentForm(true);
  };

  const handleDeleteStudentClick = (studentId: string) => {
    triggerConfirm(
      'Hapus Akun Siswa',
      'Apakah Anda yakin ingin menghapus siswa ini?',
      () => {
        deleteStudent(studentId);
        setStudents(getStudents());
      }
    );
  };

  const handleCancelStudentEdit = () => {
    setSelectedStudentForEdit(null);
    setStudentUsername('');
    setStudentNameInput('');
    setStudentPassword('');
    setStudentSubject('');
    setShowAddStudentForm(false);
  };

  // Teacher (Guru) Actions
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherUsername.trim() || !teacherNameInput.trim() || !teacherPassword.trim() || !teacherSubject.trim()) {
      alert('Semua bidang (Username, Nama, Mata Pelajaran, Password) wajib diisi!');
      return;
    }

    const isUsernameDuplicate = teachers.some(
      (t) =>
        t.username.toLowerCase().trim() === teacherUsername.toLowerCase().trim() &&
        t.id !== selectedTeacherForEdit?.id
    );

    if (isUsernameDuplicate) {
      alert('Username sudah digunakan oleh guru lain. Silakan pakai username unik.');
      return;
    }

    const teacherToSave: Teacher = {
      id: selectedTeacherForEdit?.id || `teach-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      username: teacherUsername.trim(),
      name: teacherNameInput.trim(),
      subject: teacherSubject.trim(),
      password: teacherPassword.trim(),
    };

    saveTeacher(teacherToSave);
    const updatedTeachers = getTeachers();
    setTeachers(updatedTeachers);

    // Reset Form
    setTeacherUsername('');
    setTeacherNameInput('');
    setTeacherSubject('');
    setTeacherPassword('');
    setSelectedTeacherForEdit(null);
    setShowAddTeacherForm(false);
  };

  const handleEditTeacherClick = (teacher: Teacher) => {
    setSelectedTeacherForEdit(teacher);
    setTeacherUsername(teacher.username);
    setTeacherNameInput(teacher.name);
    setTeacherSubject(teacher.subject);
    setTeacherPassword(teacher.password);
    setShowAddTeacherForm(true);
  };

  const handleDeleteTeacherClick = (teacherId: string) => {
    triggerConfirm(
      'Hapus Akun Guru',
      'Apakah Anda yakin ingin menghapus guru ini?',
      () => {
        deleteTeacher(teacherId);
        setTeachers(getTeachers());
      }
    );
  };

  const handleCancelTeacherEdit = () => {
    setSelectedTeacherForEdit(null);
    setTeacherUsername('');
    setTeacherNameInput('');
    setTeacherSubject('');
    setTeacherPassword('');
    setShowAddTeacherForm(false);
  };

  const handleDownloadStudentTemplate = () => {
    // UTF-8 BOM representation for correct Excel character parsing
    let csvContent = '\uFEFF';
    csvContent += 'username,nama_lengkap,password,mata_pelajaran\n';
    csvContent += 'ahmadsudjiwo,Ahmad Sudjiwo,siswa,Matematika\n';
    csvContent += 'rianasafitri,Riana Safitri,siswa,Bahasa Indonesia\n';
    csvContent += 'budi123,Budi Santoso,rahasia123,Fisika\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_siswa_neocbt.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportStudentsCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          alert('File kosong atau rusak.');
          return;
        }

        // Split lines and filter out empty lines
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (lines.length <= 1) {
          alert('Template tidak memiliki baris data.');
          return;
        }

        // Header checking
        const rawHeaders = lines[0].replace(/^\uFEFF/, '').split(',');
        const headers = rawHeaders.map(h => h.trim().toLowerCase());
        
        // Find indices
        const usernameIdx = headers.indexOf('username');
        const nameIdx = headers.indexOf('nama_lengkap');
        const passwordIdx = headers.indexOf('password');
        const subjectIdx = headers.indexOf('mata_pelajaran');

        if (usernameIdx === -1 || nameIdx === -1 || passwordIdx === -1) {
          alert('Format header kolom tidak valid. Pastikan terdapat kolom: username, nama_lengkap, password');
          return;
        }

        const newStudentsList: Student[] = [];
        const existingStudents = getStudents();

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(cell => {
            // Trim enclosing quotes if present
            let clean = cell.trim();
            if (clean.startsWith('"') && clean.endsWith('"')) {
              clean = clean.slice(1, -1);
            }
            return clean;
          });

          // Check if columns match
          if (row.length < Math.max(usernameIdx, nameIdx, passwordIdx) + 1) {
            continue; // Skip malformed lines
          }

          const username = row[usernameIdx];
          const name = row[nameIdx];
          const password = row[passwordIdx];
          const subject = subjectIdx !== -1 && row[subjectIdx] ? row[subjectIdx] : 'Umum';

          if (!username || !name || !password) {
            continue; // Skip lines with blank elements
          }

          // Build student object
          newStudentsList.push({
            id: `stud-csv-${Date.now()}-${i}-${Math.floor(100 + Math.random() * 900)}`,
            username: username,
            name: name,
            password: password,
            subject: subject
          });
        }

        if (newStudentsList.length === 0) {
          alert('Tidak ada akun siswa valid yang berhasil dibaca.');
          return;
        }

        // Merge and save (skip duplicates of usernames)
        const mergedStudents = [...existingStudents];
        let importedCount = 0;

        newStudentsList.forEach(newStud => {
          // Check if username already exists
          const exists = mergedStudents.some(s => s.username.toLowerCase() === newStud.username.toLowerCase());
          if (!exists) {
            mergedStudents.push(newStud);
            importedCount++;
          }
        });

        saveStudents(mergedStudents);
        setStudents(getStudents());
        alert(`Berhasil mengimpor ${importedCount} akun siswa baru (mengabaikan username duplikat).`);
        // Reset file input
        if (e.target) {
          e.target.value = '';
        }
      } catch (err) {
        console.error('Failed to parse CSV:', err);
        alert('Terjadi kesalahan saat memproses file CSV: ' + err);
      }
    };
    reader.readAsText(file);
  };

  // Filtered exams for display
  const displayedExams = useMemo(() => {
    if (role === 'teacher' && currentTeacher) {
      return exams.filter(e => e.subject.toLowerCase() === currentTeacher.subject.toLowerCase());
    }
    return exams;
  }, [exams, role, currentTeacher]);

  // Compute stats for admin
  const avgScore = useMemo(() => {
    const list = role === 'teacher' && currentTeacher 
      ? results.filter(r => r.subject.toLowerCase() === currentTeacher.subject.toLowerCase())
      : results;
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / list.length);
  }, [results, role, currentTeacher]);

  const filteredResults = useMemo(() => {
    let list = results;
    if (role === 'teacher' && currentTeacher) {
      list = list.filter(r => r.subject.toLowerCase() === currentTeacher.subject.toLowerCase());
    }
    if (selectedResultExamId && selectedResultExamId !== 'ALL') {
      list = list.filter(r => r.examId === selectedResultExamId);
    }
    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase();
      list = list.filter(
        r => 
          r.studentName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          r.examTitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [results, adminSearch, selectedResultExamId, role, currentTeacher]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (role === 'teacher' && currentTeacher) {
      list = list.filter(s => s.subject && s.subject.toLowerCase() === currentTeacher.subject.toLowerCase());
    }
    if (!studentSearch.trim()) return list;
    const q = studentSearch.toLowerCase();
    return list.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        (s.subject && s.subject.toLowerCase().includes(q))
    );
  }, [students, studentSearch, role, currentTeacher]);

  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    const q = teacherSearch.toLowerCase();
    return teachers.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  const activeExamDetails = useMemo(() => {
    if (!activeSession) return null;
    return exams.find(e => e.id === activeSession.examId) || null;
  }, [activeSession, exams]);

  const currentActiveQuestion = useMemo(() => {
    if (!activeExamDetails) return null;
    return activeExamDetails.questions[currentQuestionIndex] || null;
  }, [activeExamDetails, currentQuestionIndex]);

  return (
    <div className="min-h-screen text-slate-700 bento-bg flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-6">
      {/* Permanent visual header */}
      <Header currentUser={currentUser} role={role} onLogout={handleLogout} />

      {/* Main Container below Header */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: LOGIN */}
          {activeScreen === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg mx-auto self-center lg:mt-8"
            >
              <div className="neu-flat p-6 sm:p-10 flex flex-col gap-6 border border-white/20">
                
                {/* Visual Brand Title */}
                <div className="text-center flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-lg flex items-center justify-center mb-2 overflow-hidden border border-slate-200/50 p-1 transform hover:scale-105 transition-transform">
                    <img 
                      src={smasaLogo} 
                      alt="SMASA Logo" 
                      className="w-full h-full object-contain animate-fadeIn"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h2 className="font-display font-black text-2xl tracking-tight text-slate-800 italic">
                    SMASA-<span className="text-[#4dabf7]">Online</span>
                  </h2>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Masuk ke portal evaluasi dengan platform modern, responsif, dan berbasis Bento Grid.
                  </p>
                </div>

                {/* Login Tabs */}
                <div className="flex flex-wrap sm:flex-nowrap neu-pressed p-1.5 rounded-2xl border border-white/10 gap-1">
                  <button
                    type="button"
                    onClick={() => { setLoginTab('student'); setLoginError(''); }}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${loginTab === 'student' ? 'clay-blue text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    Portal Siswa
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginTab('teacher'); setLoginError(''); }}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${loginTab === 'teacher' ? 'clay-blue text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    Portal Guru
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginTab('admin'); setLoginError(''); }}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${loginTab === 'admin' ? 'clay-blue text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Admin
                  </button>
                </div>

                {/* Errors notification */}
                {loginError && (
                   <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* STUDENT FORM */}
                {loginTab === 'student' && (
                  <form onSubmit={handleStudentLogin} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-600 tracking-wide uppercase flex items-center gap-1 font-mono">
                        <User className="w-3.5 h-3.5 text-blue-500" /> Username Siswa:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan username Anda..."
                        value={studentUsernameInput}
                        onChange={(e) => setStudentUsernameInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border neu-input text-sm font-sans"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-600 tracking-wide uppercase flex items-center gap-1 font-mono">
                        <Lock className="w-3.5 h-3.5 text-blue-500" /> Password:
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Masukkan password Anda..."
                        value={studentPasswordInput}
                        onChange={(e) => setStudentPasswordInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border neu-input text-sm font-sans"
                      />
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-100/60 rounded-xl text-[10px] text-slate-600 leading-relaxed font-sans">
                      <span className="font-bold text-blue-700 block mb-0.5 font-mono">💡 INFO untuk SISWA:</span>
                      Daftar siswa dikelola sepenuhnya di Menu Admin (Kelola Siswa). <br />
                      Gunakan <strong className="font-mono text-blue-700">Username : NISN</strong> dan <strong className="font-mono text-blue-700">Password : siswa</strong><br />
                      untuk info login yang bermasalah, silahkan komunikasi pada guru pembina
                    </div>

                    <button
                      type="submit"
                      className="clay-blue w-full py-3.5 text-xs font-bold tracking-widest uppercase mt-2 cursor-pointer flex items-center justify-center gap-2 text-white"
                    >
                      <UserCheck className="w-4 h-4" />
                      Masuk Portal Siswa
                    </button>
                  </form>
                )}

                {/* TEACHER FORM */}
                {loginTab === 'teacher' && (
                  <form onSubmit={handleTeacherLogin} className="flex flex-col gap-5 animate-fadeIn">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-600 tracking-wide uppercase flex items-center gap-1 font-mono">
                        <User className="w-3.5 h-3.5 text-blue-500" /> Username Guru:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan username guru..."
                        value={teacherUsernameInput}
                        onChange={(e) => setTeacherUsernameInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border neu-input text-sm font-sans"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-600 tracking-wide uppercase flex items-center gap-1 font-mono">
                        <Lock className="w-3.5 h-3.5 text-blue-500" /> Password:
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Masukkan password guru..."
                        value={teacherPasswordInput}
                        onChange={(e) => setTeacherPasswordInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border neu-input text-sm font-sans"
                      />
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-100/60 rounded-xl text-[10px] text-slate-600 leading-relaxed font-sans">
                      <span className="font-bold text-blue-700 block mb-0.5 font-mono">💡 INFO untuk GURU:</span>
                      Akun guru dikelola di Menu Admin (Kelola Guru). <br />
                      Gunakan <strong className="font-mono text-blue-700">Username dan Password</strong> dari <strong className="font-mono text-blue-700">Admin</strong>
                    </div>

                    <button
                      type="submit"
                      className="clay-blue w-full py-3.5 text-xs font-bold tracking-widest uppercase mt-2 cursor-pointer flex items-center justify-center gap-2 text-white"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Masuk Portal Guru
                    </button>
                  </form>
                )}

                {/* ADMIN FORM */}
                {loginTab === 'admin' && (
                  <form onSubmit={handleAdminLogin} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-600 tracking-wide uppercase font-mono">
                          Kata Sandi Admin:
                        </label>

                      </div>
                      <input
                        type="password"
                        required
                        placeholder="Masukkan password..."
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border neu-input text-sm font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      className="clay-blue w-full py-3.5 text-xs font-bold tracking-widest uppercase mt-2 cursor-pointer flex items-center justify-center gap-2 text-white"
                    >
                      <Lock className="w-4 h-4" />
                      Masuk Administrator
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {/* SCREEN 1.5: STUDENT DASHBOARD */}
          {activeScreen === 'student-dashboard' && currentStudent && (
            <motion.div
              key="student-dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 w-full animate-fadeIn"
            >
              {/* Student Welcome Header Banner */}
              <div className="neu-flat p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20">
                <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(99,102,241,0.3)] flex items-center justify-center text-white shrink-0">
                    <User className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800">Selamat Datang, {currentStudent.name}!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      NISN/ID: <strong className="text-slate-700">{currentStudent.id}</strong> &bull; Username: <strong className="text-slate-700">{currentStudent.username}</strong>
                    </p>
                    <span className="inline-block mt-2 px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200/50 rounded-full">
                      Mata Pelajaran Anda: {currentStudent.subject || 'Semua Mata Pelajaran'}
                    </span>
                  </div>
                </div>

                {/* Subject stats or indicators */}
                <div className="flex items-center gap-5 bg-white/40 p-4 rounded-2xl border border-white/50 shadow-inner">
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Ujian Selesai</span>
                    <div className="text-3xl font-black text-indigo-600 font-sans">
                      {results.filter(r => r.studentId === currentStudent.id).length}
                    </div>
                  </div>
                  <div className="h-10 w-px bg-slate-300/30"></div>
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Rata-rata Nilai</span>
                    <div className="text-3xl font-black text-emerald-600 font-sans">
                      {(() => {
                        const studentRes = results.filter(r => r.studentId === currentStudent.id);
                        if (studentRes.length === 0) return '0%';
                        const avg = Math.round(studentRes.reduce((acc, curr) => acc + curr.score, 0) / studentRes.length);
                        return `${avg}%`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* TWO COLUMN BENTO BOX: Left is Active Exams, Right is History */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Column Left: Active Exams (Span 7) */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                  <div className="neu-flat p-6 flex flex-col gap-4 border border-white/20">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Daftar Ujian Aktif
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px] font-mono">
                        {
                          exams.filter(exam => {
                            const isActive = exam.isActive !== false;
                            const studentSub = (currentStudent.subject || '').trim().toLowerCase();
                            const examSub = (exam.subject || '').trim().toLowerCase();
                            return isActive && examSub === studentSub;
                          }).length
                        } Ujian
                      </span>
                    </div>

                    {/* Listing Matching Active Exams */}
                    {(() => {
                      const matchedActiveExams = exams.filter(exam => {
                        const isActive = exam.isActive !== false;
                        const studentSub = (currentStudent.subject || '').trim().toLowerCase();
                        const examSub = (exam.subject || '').trim().toLowerCase();
                        return isActive && examSub === studentSub;
                      });

                      if (matchedActiveExams.length === 0) {
                        return (
                          <div className="text-center py-10 px-4 flex flex-col items-center justify-center gap-3">
                            <span className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                              <BookMarked className="w-6 h-6 animate-pulse" />
                            </span>
                            <div className="text-slate-600 font-sans font-medium text-sm">Tidak Ada Ujian Aktif</div>
                            <p className="text-xs text-slate-400 leading-normal max-w-xs">
                              Tidak ada ujian aktif saat ini untuk mata pelajaran Anda ({currentStudent.subject || 'Semua'}). Silakan laporkan jika ini tidak sesuai.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-4">
                          {matchedActiveExams.map((exam) => {
                            // Check if student has already completed this exam
                            const studentResult = results.find(
                              r => r.examId === exam.id && r.studentId === currentStudent.id
                            );

                            return (
                              <div
                                key={exam.id}
                                className="p-5 rounded-2xl border border-white/40 bg-white/20 hover:bg-white/40 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                              >
                                <div className="flex flex-col gap-1.5">
                                  <h5 className="font-extrabold text-slate-800 text-base leading-tight">
                                    {exam.title}
                                  </h5>
                                  <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500 font-mono">
                                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                                      {exam.subject}
                                    </span>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1">
                                      <Timer className="w-3.5 h-3.5" />
                                      {exam.durationMinutes} Menit
                                    </span>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1">
                                      <FileText className="w-3.5 h-3.5" />
                                      {exam.questions.length} Soal
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center">
                                  {studentResult ? (
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                      <div className="text-right">
                                        <span className="text-[10px] font-bold block opacity-60 uppercase font-mono text-green-700">Skor Anda</span>
                                        <span className="text-sm font-black text-green-600">{studentResult.score}%</span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setActiveReviewResult(studentResult);
                                          setActiveScreen('review-screen');
                                        }}
                                        className="clay-blue text-white px-3 py-2 text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-sm rounded-lg"
                                      >
                                        Tinjau Pembahasan
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleStartExam(exam)}
                                      className="clay-blue w-full sm:w-auto text-white px-5 py-2.5 text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-md rounded-xl"
                                    >
                                      <BookOpen className="w-4 h-4" />
                                      Kerjakan Ujian
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Column Right: Exam Results History (Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <div className="neu-flat p-6 flex flex-col gap-4 border border-white/20">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-500" />
                        Riwayat Evaluasi Anda
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px] font-mono">
                        {results.filter(r => r.studentId === currentStudent.id).length} Selesai
                      </span>
                    </div>

                    {/* Listing Completed Exams for this student */}
                    {(() => {
                      const studentHist = results.filter(r => r.studentId === currentStudent.id);

                      if (studentHist.length === 0) {
                        return (
                          <div className="text-center py-10 px-4 flex flex-col items-center justify-center gap-3">
                            <span className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                              <XCircle className="w-6 h-6" />
                            </span>
                            <div className="text-slate-500 font-sans text-sm">Belum ada evaluasi diselesaikan</div>
                            <p className="text-xs text-slate-400 leading-normal max-w-xs">
                              Riwayat nilai dan lembar evaluasi Anda akan ditampilkan di sini setelah Anda selesai mengerjakan ujian.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1">
                          {studentHist.map((resLog) => {
                            const isPassed = resLog.score >= 70;
                            return (
                              <div
                                key={resLog.id}
                                className="p-4 rounded-xl border border-white/40 bg-white/20 flex items-center justify-between gap-3 shadow-inner"
                              >
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-slate-800 text-sm leading-tight truncate">
                                    {resLog.examTitle}
                                  </h5>
                                  <span className="text-[10px] text-slate-500 block mt-0.5">
                                    Selesai: {resLog.completedAt}
                                  </span>
                                </div>

                                <div className="shrink-0 flex items-center gap-3">
                                  <div className="text-center">
                                    <span className={`text-xs font-black block leading-none px-2 py-1 rounded font-mono text-white ${isPassed ? 'clay-green' : 'bg-rose-500'}`}>
                                      {resLog.score}%
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setActiveReviewResult(resLog);
                                      setActiveScreen('review-screen');
                                    }}
                                    className="p-1 px-2 py-1 flex items-center justify-center rounded bg-blue-100 border border-blue-200 hover:bg-blue-200 text-[10px] uppercase font-bold text-blue-700 transition-colors cursor-pointer"
                                    title="Tinjau Hasil"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* SCREEN 2: ACTIVE EXAM PROCESS (CBT Engine) */}
          {activeScreen === 'exam-active' && activeSession && activeExamDetails && currentActiveQuestion && (
            <motion.div
              key="exam-active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full"
            >
              {/* LEFT SIDE PANEL (TIMER & QUESTIONS MAP) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Dashboard Timer Card - Styled to match stats layout */}
                <div className="p-6 rounded-[2rem] glass border border-white/40 flex flex-col items-center gap-3">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 text-blue-400" />
                    SISA WAKTU MENGERJAKAN
                  </span>
                  
                  {/* Digital Clock countdown display */}
                  <div className={`text-4xl font-extrabold tracking-widest font-mono text-center ${activeSession.timeLeftSeconds < 120 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>
                    {Math.floor(activeSession.timeLeftSeconds / 60).toString().padStart(2, '0')}
                    <span className="animate-pulse">:</span>
                    {(activeSession.timeLeftSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold font-mono">Remaining Time</div>
                  
                  {/* Dynamic Progress Meter */}
                  <div className="w-full bg-gray-200/50 h-2 rounded-full overflow-hidden mt-1 shadow-inner border border-white/20">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-1000" 
                      style={{ width: `${Math.max(0, Math.min(100, (activeSession.timeLeftSeconds / (activeExamDetails.durationMinutes * 60)) * 100))}%` }}
                    ></div>
                  </div>
                  
                  {/* Profile info footer in metadata tracker */}
                  <div className="text-[10px] text-slate-500 font-semibold uppercase text-center mt-3 border-t border-slate-300/30 pt-3 w-full font-mono leading-relaxed">
                    Siswa: <span className="font-bold text-slate-700">{activeSession.studentName}</span> <br />
                    Mata Pelajaran: <span className="font-bold text-blue-500">{activeExamDetails.subject}</span>
                  </div>
                </div>

                {/* Questions Bento-grid Navigation Mapper */}
                <div className="neu-flat p-6 flex flex-col gap-4 border border-white/20">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 font-mono">
                    Question Navigator
                  </h3>
                  
                  {/* Responsive grid of numbers matching specified layout */}
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {activeExamDetails.questions.map((q, idx) => {
                      const isCurrent = idx === currentQuestionIndex;
                      const isAnswered = !!activeSession.answers[q.id];
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`h-8 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all duration-200 active:translate-y-0.5 border ${
                            isCurrent 
                              ? 'neu-pressed border-blue-400 text-blue-500 font-extrabold shadow-inner' 
                              : isAnswered 
                                ? 'bg-green-400 border-green-500 text-white font-bold shadow-inner' 
                                : 'neu-flat border-white/40 text-slate-400 hover:neu-pressed'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Indicators Description */}
                  <div className="flex gap-4 items-center justify-center text-[9px] font-bold font-mono text-slate-400 mt-2 border-t border-slate-300/30 pt-2.5">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-blue-400 inline-block border border-blue-300"></span>
                      <span>Aktif</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-green-400 inline-block border border-green-500"></span>
                      <span>Terjawab</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded neu-flat border-white/45 inline-block"></span>
                      <span>Kosong</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE PANEL (ACTIVE QUESTION CONTENT) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Main Question Box */}
                <div className="neu-flat rounded-[40px] p-6 md:p-8 flex flex-col gap-6 border border-white/20">
                  
                  {/* Badge Row */}
                  <div className="flex items-center justify-between border-b border-slate-200/40 pb-4">
                    <div className="flex space-x-3">
                      <div className="clay-green text-white px-4 py-1 flex items-center font-bold text-[11px] uppercase tracking-wide">
                        Soal {currentQuestionIndex + 1} dari {activeExamDetails.questions.length}
                      </div>
                      <div className="bg-white/40 border border-white/50 px-3 py-1 rounded-xl flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                        {activeExamDetails.subject}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold font-mono text-slate-400 hidden sm:inline">
                      CBT-ID: {currentActiveQuestion.id}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div>
                    <h2 className="text-base sm:text-[17px] font-bold text-slate-800 mb-4 leading-relaxed whitespace-pre-wrap">
                      {currentActiveQuestion.text}
                    </h2>
                  </div>

                  {/* 5 Multi Choices options A-E */}
                  <div className="space-y-3">
                    {(['A', 'B', 'C', 'D', 'E'] as Array<'A' | 'B' | 'C' | 'D' | 'E'>).map((key) => {
                      const isSelected = activeSession.answers[currentActiveQuestion.id] === key;
                      const optionText = currentActiveQuestion.options[key];
                      
                      return isSelected ? (
                        <button
                          key={key}
                          onClick={() => handleSelectAnswer(key)}
                          className="neu-pressed border-2 border-blue-300 rounded-2xl p-4 flex items-center space-x-4 cursor-pointer text-left w-full transition-all"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-400 border-4 border-blue-100 flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-sm" />
                          <span className="text-sm font-bold text-blue-900 flex-1 leading-normal">{optionText}</span>
                        </button>
                      ) : (
                        <button
                          key={key}
                          onClick={() => handleSelectAnswer(key)}
                          className="neu-flat border border-white/40 rounded-2xl p-4 flex items-center space-x-4 cursor-pointer hover:bg-white/20 text-left w-full transition-all"
                        >
                          <div className="w-6 h-6 rounded-full border-2 border-[#b8bec9] flex items-center justify-center font-mono font-bold text-xs text-slate-400 shrink-0 bg-white/20">
                            {key}
                          </div>
                          <span className="text-sm text-slate-700 font-medium flex-1 leading-normal">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Nav Controls Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-4 pt-5 border-t border-slate-300/30">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="neu-flat px-6 py-2.5 rounded-xl text-xs font-bold text-[#777] hover:neu-pressed transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer border border-white/20 shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        PREVIOUS
                      </button>
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(activeExamDetails.questions.length - 1, prev + 1))}
                        disabled={currentQuestionIndex === activeExamDetails.questions.length - 1}
                        className="neu-flat px-6 py-2.5 rounded-xl text-xs font-bold text-blue-600 hover:neu-pressed transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer border border-white/20 shadow-sm"
                      >
                        NEXT
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => setShowSubmitConfirm(true)}
                      className="clay-blue px-10 py-3 text-xs font-bold text-white uppercase tracking-widest active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-[18px]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      SUBMIT EXAM
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Confirmation modal */}
              {showSubmitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                  <div className="clay-card p-6 sm:p-8 max-w-md w-full flex flex-col gap-5 text-center">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center self-center shadow-inner">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h4 className="text-lg font-bold text-slate-800">Selesaikan Ujian Sekarang?</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Anda akan mengakhiri ujian dan merekam nilai akhir. Anda tidak dapat merubah jawaban kembali setelah proses ini.
                      </p>
                    </div>
                    
                    {/* Checking if any are left empty */}
                    {Object.values(activeSession.answers).includes('') && (
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/50 text-[10px] text-amber-800 font-semibold">
                        Pemberitahuan: Masih ada beberapa soal yang belum Anda jawab.
                      </div>
                    )}

                    <div className="flex gap-3 justify-center mt-2">
                      <button
                        onClick={() => setShowSubmitConfirm(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Kembali Mengerjakan
                      </button>
                      <button
                        onClick={handleSubmitExam}
                        className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md active:translate-y-0.5 transition-all"
                      >
                        Ya, Selesaikan & Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SCREEN 3: EXAM COMPLETE & DISCUSSION/REVIEW DETAILS */}
          {activeScreen === 'review-screen' && activeReviewResult && (
            <motion.div
              key="review-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 w-full animate-fadeIn"
            >
              
              {/* Leader Metrics Banner - Styled as a flat bento header */}
              <div className="neu-flat p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20">
                <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-green-500 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(16,185,129,0.3)] flex items-center justify-center text-white shrink-0">
                    <Award className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800">Ujian Telah Disubmit Berhasil!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Peserta: <strong className="text-slate-700">{activeReviewResult.studentName}</strong> ({activeReviewResult.studentId}) &bull; Tanggal: {activeReviewResult.completedAt}
                    </p>
                    <span className="inline-block mt-2 px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200/50 rounded-full">
                      Mata Pelajaran: {activeReviewResult.subject}
                    </span>
                  </div>
                </div>

                {/* Score badge layout */}
                <div className="flex items-center gap-5 bg-white/40 p-4 rounded-2xl border border-white/50 shadow-inner">
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Skor Akhir</span>
                    <div className="text-4xl font-black text-blue-600 font-sans">{activeReviewResult.score}</div>
                  </div>
                  <div className="h-10 w-px bg-slate-300/30"></div>
                  <div className="text-left text-xs text-slate-600 flex flex-col justify-center">
                    <div className="font-bold flex items-center gap-1">Status: <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white leading-normal ${activeReviewResult.score >= 70 ? 'clay-green' : 'bg-red-500 border border-red-400'}`}>{activeReviewResult.score >= 70 ? 'LULUS' : 'REMEDIAL'}</span></div>
                    <div className="mt-1">Benar: <strong className="text-slate-700">{activeReviewResult.correctCount}</strong> / {activeReviewResult.totalQuestions} Soal</div>
                  </div>
                </div>
              </div>

              {/* Review & Pembahasan header */}
              <div className="flex justify-between items-center mt-2 border-b border-slate-300/30 pb-3">
                <h4 className="text-base font-bold text-slate-700 flex items-center gap-2 font-display uppercase tracking-wider italic">
                  <BookMarked className="w-5 h-5 text-blue-500 animate-pulse" />
                  Lembar Interaktif: Soal & Pembahasan
                </h4>
                {role === 'student' ? (
                  <button
                    onClick={() => {
                      setActiveReviewResult(null);
                      setActiveScreen('student-dashboard');
                    }}
                    className="clay-blue px-5 py-2 text-xs font-bold text-white transition-all shadow-md rounded-[12px] cursor-pointer"
                  >
                    Kembali ke Dasbor
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="clay-blue px-5 py-2 text-xs font-bold text-white transition-all shadow-md rounded-[12px] cursor-pointer"
                  >
                    Selesai & Keluar Evaluasi
                  </button>
                )}
              </div>

              {/* List of questions reviews */}
              <div className="flex flex-col gap-6">
                {exams.find(e => e.id === activeReviewResult.examId)?.questions.map((q, idx) => {
                  const studentAns = activeReviewResult.answers[q.id];
                  const isCorrect = studentAns === q.correctAnswer;
                  
                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-[2rem] border transition-all duration-300 ${
                        isCorrect 
                          ? 'neu-flat border-green-300/70' 
                          : 'neu-flat border-red-300/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Circle Indicator */}
                        <span className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 shadow-sm border ${
                          isCorrect 
                            ? 'clay-green text-white border-white/20' 
                            : 'bg-red-50 border-red-400 text-white'
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="flex-1 flex flex-col gap-3">
                          {/* Question Text */}
                          <p className="text-slate-800 text-base font-bold leading-relaxed whitespace-pre-wrap">{q.text}</p>
                          
                          {/* Options map with correctness indications */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mt-1">
                            {(['A', 'B', 'C', 'D', 'E'] as Array<'A' | 'B' | 'C' | 'D' | 'E'>).map((key) => {
                              const isKey = q.correctAnswer === key;
                              const isStudentSelected = studentAns === key;
                              
                              let optionStyle = 'bg-white/20 border-white/30 text-slate-600';
                              if (isKey) {
                                optionStyle = 'clay-green border border-white/30 text-white font-bold shadow-sm';
                              } else if (isStudentSelected && !isCorrect) {
                                optionStyle = 'bg-red-50 border border-red-400 text-white font-bold shadow-sm';
                              }

                              return (
                                <div
                                  key={key}
                                  className={`p-2.5 rounded-xl border text-xs leading-dense flex items-start gap-1.5 break-all ${optionStyle}`}
                                >
                                  <span className="font-extrabold shrink-0">{key}.</span>
                                  <span>{q.options[key]}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Student Answer feedback row */}
                          <div className="flex flex-wrap gap-2.5 items-center text-xs mt-1">
                            <span>Jawaban Anda:</span>
                            {studentAns ? (
                              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] flex items-center gap-1 ${
                                isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                Pilihan [{studentAns}] {isCorrect ? '(Benar)' : '(Salah)'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-500 font-bold text-[11px]">
                                (Tidak Diisi)
                              </span>
                            )}
                            
                            {!isCorrect && (
                              <span className="px-2.5 py-0.5 rounded-full bg-green-100/80 text-green-800 font-bold uppercase text-[11px] border border-green-200">
                                Kunci Jawaban: [{q.correctAnswer}]
                              </span>
                            )}
                          </div>

                          {/* TEXTAREA PEMBAHASAN - Renders if got wrong or right */}
                          {(!isCorrect || q.discussion) && (
                            <div className="mt-3 p-4 rounded-2xl glass border border-white/40 shadow-inner">
                              <label className="text-[10px] font-extrabold text-[#444] uppercase tracking-widest block mb-1.5 font-mono">
                                Pembahasan Jawaban Soal #{idx + 1}:
                              </label>
                              
                              {/* Standard styled interactive disable-locked textarea of discussion */}
                              <textarea
                                readOnly
                                rows={Math.min(6, q.discussion.split('\n').length + 1)}
                                value={q.discussion || 'Tidak ada uraian pembahasan untuk soal ini.'}
                                className="w-full p-3 text-slate-700 bg-white/50 rounded-xl border-0 font-mono text-xs focus:outline-none focus:ring-0 leading-relaxed resize-none text-left"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom finalize action */}
              <div className="flex justify-center mt-6 pt-6 border-t border-slate-300/30">
                <button
                  onClick={() => {
                    if (role === 'student') {
                      setActiveReviewResult(null);
                      setActiveScreen('student-dashboard');
                    } else {
                      handleLogout();
                    }
                  }}
                  className="clay-blue px-12 py-3.5 text-xs font-bold text-white uppercase tracking-widest active:translate-y-0.5 transition-all shadow-md rounded-[18px] cursor-pointer"
                >
                  {role === 'student' ? 'Kembali ke Dasbor' : 'Selesai & Keluar Evaluasi'}
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 4: ADMINISTRATOR CONTROLLER INTERFACE */}
          {activeScreen === 'admin-dashboard' && (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 w-full animate-fadeIn"
            >
              
              {/* Stat Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Paket Ujian"
                  value={role === 'teacher' ? displayedExams.length : exams.length}
                  icon={BookOpen}
                  colorScheme="indigo"
                  description={role === 'teacher' ? `Mata Pelajaran: ${currentTeacher?.subject}` : "Paket bank soal yang terdaftar"}
                />
                <MetricCard
                  title="Total Ujian Diikuti"
                  value={role === 'teacher' && currentTeacher ? results.filter(r => r.subject.toLowerCase() === currentTeacher.subject.toLowerCase()).length : results.length}
                  icon={Users}
                  colorScheme="teal"
                  description="Selesai disubmit siswa"
                />
                <MetricCard
                  title="Nilai Rata-Rata"
                  value={`${avgScore}%`}
                  icon={Award}
                  colorScheme="emerald"
                  description="Dari seluruh peserta evaluasi"
                />
                <MetricCard
                  title={role === 'teacher' ? "Mata Pelajaran" : "Password Default"}
                  value={role === 'teacher' ? (currentTeacher?.subject || "") : "admin"}
                  icon={role === 'teacher' ? GraduationCap : Lock}
                  colorScheme="amber"
                  description={role === 'teacher' ? `Guru: ${currentTeacher?.name}` : "Password utama administrator"}
                />
              </div>

              {/* Tab selector */}
              <div className="flex flex-wrap sm:flex-nowrap bg-[#e0e5ec] p-1.5 rounded-2xl w-full max-w-2xl border border-white/20 shadow-inner gap-1">
                <button
                  onClick={() => setAdminTab('exams')}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-1.5 transition-all duration-300 ${adminTab === 'exams' ? 'clay-blue text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  Kelola Ujian & Soal
                </button>
                {role !== 'teacher' && (
                  <button
                    onClick={() => setAdminTab('teachers')}
                    className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-1.5 transition-all duration-300 ${adminTab === 'teachers' ? 'clay-blue text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Kelola Guru
                  </button>
                )}
                <button
                  onClick={() => setAdminTab('students')}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-1.5 transition-all duration-300 ${adminTab === 'students' ? 'clay-blue text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Kelola Siswa
                </button>
                <button
                  onClick={() => setAdminTab('results')}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-1.5 transition-all duration-300 ${adminTab === 'results' ? 'clay-blue text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Hasil Ujian
                </button>
                <button
                  onClick={() => setAdminTab('supabase')}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-1.5 transition-all duration-300 ${adminTab === 'supabase' ? 'clay-blue text-white shadow-md bg-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Key className="w-3.5 h-3.5" />
                  Koneksi Supabase
                </button>
              </div>

              {/* TAB 1: MANAGE EXAMS AND QUESTIONS */}
              {adminTab === 'exams' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left sub-side (Exams List) */}
                  <div className="lg:col-span-5 flex flex-col gap-5">
                    <div className="neu-flat p-6 flex flex-col gap-4 border border-white/20">
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Daftar Paket Ujian</h4>
                        <button
                          onClick={() => {
                            if (role === 'teacher' && currentTeacher) {
                              setNewExamSubject(currentTeacher.subject);
                            } else {
                              setNewExamSubject('');
                            }
                            setNewExamTitle('');
                            setNewExamDuration(15);
                            setShowAddExamModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-[10px] uppercase flex items-center gap-1 transition-all animate-fadeIn"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah Ujian
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
                        {displayedExams.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">Belum ada paket ujian terdaftar.</div>
                        ) : (
                          displayedExams.map((exam) => {
                            const isSelected = selectedExamForEdit?.id === exam.id;
                            return (
                              <div
                                key={exam.id}
                                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex justify-between items-center ${
                                  isSelected 
                                    ? 'neu-pressed border-blue-300/60 shadow-inner' 
                                    : 'neu-flat border-white/40 hover:bg-white/10'
                                }`}
                                onClick={() => {
                                  setSelectedExamForEdit(exam);
                                  setIsImportingQuestions(false);
                                  setShowAddQuestionForm(false);
                                  setSelectedQuestionIds([]);
                                }}
                              >
                                <div className="flex-1 flex flex-col gap-1 pr-3">
                                  <span className="font-extrabold text-[9px] text-[#4dabf7] uppercase tracking-wider font-mono">{exam.subject}</span>
                                  <h5 className="font-bold text-slate-800 text-sm leading-tight">{exam.title}</h5>
                                  <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-medium mt-1">
                                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {exam.durationMinutes} Menit</span>
                                    <span>&bull;</span>
                                    <span>{exam.questions.length} Soal</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleExamActive(exam.id);
                                    }}
                                    className={`p-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                                      exam.isActive !== false
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200/50 hover:bg-emerald-100 font-bold'
                                        : 'text-slate-500 bg-slate-100 border-slate-200/50 hover:bg-slate-200 font-medium'
                                    }`}
                                    title={exam.isActive !== false ? 'Aktif (Klik untuk Nonaktifkan)' : 'Nonaktif (Klik untuk Aktifkan)'}
                                  >
                                    {exam.isActive !== false ? (
                                      <Eye className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                      <EyeOff className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                    <span className="text-[9px] font-mono uppercase tracking-wider px-0.5">
                                      {exam.isActive !== false ? 'AKTIF' : 'OFF'}
                                    </span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExam(exam.id);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                    title="Hapus Ujian"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right sub-side (Exam Edit / Question Editor Container) */}
                  <div className="lg:col-span-7">
                    {selectedExamForEdit ? (
                      <div className="flex flex-col gap-6">
                        
                        {/* Word Import Panel integrated if active */}
                        {isImportingQuestions ? (
                          <WordImportHelper
                            onQuestionsImported={handleBulkImportSave}
                            onCancel={() => setIsImportingQuestions(false)}
                          />
                        ) : (
                          <div className="neu-flat p-6 flex flex-col gap-5 border border-white/20">
                            
                            {/* Exam Header update meta */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                              <div>
                                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Paket Ujian Dipilih</span>
                                <h3 className="text-base font-bold text-slate-800">{selectedExamForEdit.title}</h3>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => {
                                    setIsImportingQuestions(true);
                                    setShowAddQuestionForm(false);
                                    setShowAiQuestionGenerator(false);
                                  }}
                                  className="clay-green text-white px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Import Word</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setShowAddQuestionForm(!showAddQuestionForm);
                                    setIsImportingQuestions(false);
                                    setShowAiQuestionGenerator(false);
                                  }}
                                  className="clay-blue text-white px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>{showAddQuestionForm ? 'Batal Tambah' : 'Tambah Soal Manual'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setShowAiQuestionGenerator(!showAiQuestionGenerator);
                                    setIsImportingQuestions(false);
                                    setShowAddQuestionForm(false);
                                  }}
                                  className="clay-purple text-white px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-fuchsia-600 border border-fuchsia-400"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-white" />
                                  <span>{showAiQuestionGenerator ? 'Batal AI' : 'Buat Soal via AI'}</span>
                                </button>
                              </div>
                            </div>

                            {/* EXAM META EDIT FIELDS inline */}
                            <div className="p-4 glass rounded-2xl border border-white/40 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Judul Ujian:</label>
                                <input
                                  type="text"
                                  value={selectedExamForEdit.title}
                                  onChange={(e) => handleUpdateExamMetadata(e.target.value, selectedExamForEdit.subject, selectedExamForEdit.durationMinutes)}
                                  className="neu-input border border-slate-300/40 px-2.5 py-1.5 focus:bg-white text-xs text-slate-700 font-medium"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Mata Pelajaran: </label>
                                <input
                                  type="text"
                                  value={selectedExamForEdit.subject}
                                  onChange={(e) => handleUpdateExamMetadata(selectedExamForEdit.title, e.target.value, selectedExamForEdit.durationMinutes)}
                                  disabled={role === 'teacher'}
                                  className={`neu-input border border-slate-300/40 px-2.5 py-1.5 focus:bg-white text-xs text-slate-700 font-medium ${role === 'teacher' ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''}`}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Durasi (Menit):</label>
                                <input
                                  type="number"
                                  value={selectedExamForEdit.durationMinutes}
                                  onChange={(e) => handleUpdateExamMetadata(selectedExamForEdit.title, selectedExamForEdit.subject, Number(e.target.value))}
                                  className="neu-input border border-slate-300/40 px-2.5 py-1.5 focus:bg-white text-xs text-slate-700 font-medium"
                                />
                              </div>
                            </div>

                            {/* MANUAL QUESTION ADD FORM COLLAPSIBLE */}
                            {showAddQuestionForm && (
                              <form onSubmit={handleAddQuestionManually} className="p-5 rounded-3xl neu-pressed border border-white/10 shadow-inner flex flex-col gap-4 animate-fadeIn">
                                <h4 className="text-xs font-bold text-blue-800 border-b border-blue-200/20 pb-1.5 flex items-center gap-1 border-dashed uppercase tracking-wider font-mono">
                                  <Plus className="w-4 h-4 text-blue-600" />
                                  TAMBAH SOAL PILIHAN GANDA MANUAL (5 PILIHAN)
                                </h4>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Teks Pertanyaan Soal:</label>
                                  <textarea
                                    value={newQText}
                                    onChange={(e) => setNewQText(e.target.value)}
                                    placeholder="Ketik pertanyaan di sini..."
                                    required
                                    className="w-full p-2.5 rounded-xl border border-slate-300/40 neu-input bg-white text-xs text-slate-700 focus:outline-none"
                                    rows={3}
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Pilihan A:</label>
                                    <input
                                      type="text"
                                      value={newQOptA}
                                      onChange={(e) => setNewQOptA(e.target.value)}
                                      placeholder="Teks opsi A..."
                                      required
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 bg-white text-xs text-slate-700"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Pilihan B:</label>
                                    <input
                                      type="text"
                                      value={newQOptB}
                                      onChange={(e) => setNewQOptB(e.target.value)}
                                      placeholder="Teks opsi B..."
                                      required
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 bg-white text-xs text-slate-700"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Pilihan C:</label>
                                    <input
                                      type="text"
                                      value={newQOptC}
                                      onChange={(e) => setNewQOptC(e.target.value)}
                                      placeholder="Teks opsi C..."
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 bg-white text-xs text-slate-700"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Pilihan D:</label>
                                    <input
                                      type="text"
                                      value={newQOptD}
                                      onChange={(e) => setNewQOptD(e.target.value)}
                                      placeholder="Teks opsi D..."
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 bg-white text-xs text-slate-700"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Pilihan E:</label>
                                    <input
                                      type="text"
                                      value={newQOptE}
                                      onChange={(e) => setNewQOptE(e.target.value)}
                                      placeholder="Teks opsi E..."
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 bg-white text-xs text-slate-700"
                                    />
                                  </div>
                                  
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Kunci Jawaban Benar:</label>
                                    <select
                                      value={newQKey}
                                      onChange={(e) => setNewQKey(e.target.value as 'A' | 'B' | 'C' | 'D' | 'E')}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 text-xs text-slate-700 bg-white"
                                    >
                                      <option value="A">A</option>
                                      <option value="B">B</option>
                                      <option value="C">C</option>
                                      <option value="D">D</option>
                                      <option value="E">E</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Teks Pembahasan (Penjelasan Kunci):</label>
                                  <textarea
                                    value={newQDiscussion}
                                    onChange={(e) => setNewQDiscussion(e.target.value)}
                                    placeholder="Jelaskan alasan kunci jawaban benar di sini..."
                                    className="w-full p-2.5 rounded-xl border border-slate-300/40 neu-input bg-white text-xs text-slate-700"
                                    rows={2}
                                  />
                                </div>

                                <div className="flex justify-end gap-2 border-t border-slate-200/20 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowAddQuestionForm(false)}
                                    className="px-3.5 py-1.5 rounded-lg hover:neu-pressed text-xs text-slate-500 font-bold ml-auto cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    className="clay-blue px-5 py-1.5 text-xs text-white uppercase tracking-wider font-bold cursor-pointer"
                                  >
                                    Simpan Soal
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* AI-POWERED QUESTION GENERATOR PANEL */}
                            {showAiQuestionGenerator && (
                              <form onSubmit={handleGenerateAiQuestions} className="p-5 rounded-3xl neu-pressed border border-fuchsia-300/30 bg-fuchsia-500/5 shadow-inner flex flex-col gap-4 animate-fadeIn">
                                <h4 className="text-xs font-bold text-fuchsia-800 border-b border-fuchsia-200/20 pb-1.5 flex items-center gap-1 border-dashed uppercase tracking-wider font-mono">
                                  <Sparkles className="w-4 h-4 text-fuchsia-600 animate-pulse" />
                                  BUAT SOAL OTOMATIS DENGAN BANTUAN AI (GEMINI)
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Topik / Materi Pembahasan:</label>
                                    <input
                                      type="text"
                                      value={aiTopic}
                                      onChange={(e) => setAiTopic(e.target.value)}
                                      placeholder="Misal: Aljabar Linier, Kemerdekaan RI, Tata Surya"
                                      required
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                                      disabled={aiIsGenerating}
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Kesulitan:</label>
                                      <select
                                        value={aiDifficulty}
                                        onChange={(e) => setAiDifficulty(e.target.value as 'Mudah' | 'Sedang' | 'Sulit')}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                                        disabled={aiIsGenerating}
                                      >
                                        <option value="Mudah">Mudah</option>
                                        <option value="Sedang">Sedang</option>
                                        <option value="Sulit">Sulit</option>
                                      </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Jumlah Soal:</label>
                                      <select
                                        value={aiCount}
                                        onChange={(e) => setAiCount(Number(e.target.value))}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-300/40 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                                        disabled={aiIsGenerating}
                                      >
                                        <option value="1">1 Soal</option>
                                        <option value="3">3 Soal</option>
                                        <option value="5">5 Soal</option>
                                        <option value="10">10 Soal</option>
                                        <option value="15">15 Soal</option>
                                        <option value="20">20 Soal</option>
                                        <option value="30">30 Soal</option>
                                        <option value="40">40 Soal</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Catatan / Instruksi Pembatas Khusus (Opsional):</label>
                                  <textarea
                                    value={aiCustomPrompt}
                                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                                    placeholder="Misal: Hindari materi trigonometri / buat soal khusus seputar perjuangan diponegoro..."
                                    className="w-full p-2.5 rounded-xl border border-slate-300/40 neu-input bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                                    rows={2}
                                    disabled={aiIsGenerating}
                                  />
                                </div>

                                {aiError && (
                                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl flex items-center gap-2 animate-fadeIn font-sans">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span>{aiError}</span>
                                  </div>
                                )}

                                <div className="flex justify-end gap-2 border-t border-slate-200/20 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowAiQuestionGenerator(false)}
                                    className="px-3.5 py-1.5 rounded-lg hover:neu-pressed text-xs text-slate-500 font-bold ml-auto cursor-pointer"
                                    disabled={aiIsGenerating}
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    className="clay-purple px-5 py-1.5 text-xs text-white uppercase tracking-wider font-bold cursor-pointer disabled:opacity-55 active:translate-y-0.5 transition-all flex items-center gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 border border-fuchsia-400"
                                    disabled={aiIsGenerating}
                                  >
                                    {aiIsGenerating ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        Melahirkan Soal...
                                      </>
                                    ) : (
                                      <>
                                        <BrainCircuit className="w-3.5 h-3.5" />
                                        Generasikan Soal
                                      </>
                                    )}
                                  </button>
                                </div>
                              </form>
                            )/* MANUAL QUESTION ADD FORM COLLAPSIBLE */}

                            {/* EXAMS QUESTIONS LIST */}
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-white/10">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                                  Daftar Soal Aktif ({selectedExamForEdit.questions.length})
                                </span>
                                {selectedExamForEdit.questions.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-semibold hover:text-slate-800">
                                      <input
                                        type="checkbox"
                                        checked={selectedExamForEdit.questions.length > 0 && selectedQuestionIds.length === selectedExamForEdit.questions.length}
                                        onChange={() => {
                                          const isAllSelected = selectedExamForEdit.questions.length > 0 && selectedQuestionIds.length === selectedExamForEdit.questions.length;
                                          if (isAllSelected) {
                                            setSelectedQuestionIds([]);
                                          } else {
                                            setSelectedQuestionIds(selectedExamForEdit.questions.map(q => q.id));
                                          }
                                        }}
                                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 pointer-events-auto cursor-pointer"
                                      />
                                      <span>Pilih Semua</span>
                                    </label>

                                    {selectedQuestionIds.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={handleDeleteSelectedQuestions}
                                        className="text-[10px] uppercase tracking-wide font-extrabold px-2 py-1 flex items-center gap-1 shadow cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors border border-red-500"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Hapus Terpilih ({selectedQuestionIds.length})</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={handleDeleteAllQuestions}
                                      className="text-[10px] uppercase tracking-wide font-extrabold px-2 py-1 flex items-center gap-1 shadow cursor-pointer bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-500 font-medium"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Kosongkan Soal</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {selectedExamForEdit.questions.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400 neu-flat bg-white/20 rounded-2xl border border-dashed border-white/30 leading-relaxed">
                                  Belum ada soal pada ujian ini. <br />
                                  Klik <strong>Import Word</strong> di atas untuk mengunduh template soal atau mengimpor file .docx, atau klik <strong>Tambah Soal Manual</strong>.
                                </div>
                              ) : (
                                <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                                  {selectedExamForEdit.questions.map((q, qidx) => {
                                    const isChecked = selectedQuestionIds.includes(q.id);
                                    return (
                                      <div 
                                        key={q.id} 
                                        className={`p-4 rounded-2xl neu-flat border transition-all duration-150 text-xs flex gap-3 relative group shadow-sm ${
                                          isChecked ? 'border-blue-400/80 bg-blue-50/20' : 'border-white/30'
                                        }`}
                                      >
                                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedQuestionIds(prev => [...prev, q.id]);
                                              } else {
                                                setSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                                              }
                                            }}
                                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                          />
                                          <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-bold font-mono flex items-center justify-center shrink-0 text-[10px]">
                                            {qidx + 1}
                                          </span>
                                        </div>
                                        
                                        <div className="flex-grow flex flex-col gap-2 pr-4">
                                          <p className="font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">{q.text}</p>
                                          
                                          <div className="grid grid-cols-1 md:grid-cols-5 gap-1 text-[11px] text-slate-500">
                                            {(['A', 'B', 'C', 'D', 'E'] as Array<'A' | 'B' | 'C' | 'D' | 'E'>).map((key) => {
                                              const isKey = q.correctAnswer === key;
                                              return (
                                                <span key={key} className={`truncate p-1 px-1.5 rounded ${isKey ? 'clay-green text-white font-bold' : ''}`}>
                                                  {key}. {q.options[key]}
                                                </span>
                                              );
                                            })}
                                          </div>

                                          <p className="text-[10px] text-blue-800 italic font-mono mt-0.5"><span className="font-bold">Pembahasan: </span>{q.discussion || 'Tidak ada pembahasan.'}</p>
                                        </div>

                                        <button
                                          onClick={() => handleDeleteQuestion(q.id)}
                                          className="absolute right-2 top-2 p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                          title="Hapus Soal"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="neu-flat p-10 text-center text-xs text-slate-400 border border-white/20">
                        <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        Silakan pilih atau tambahkan paket ujian di panel sebelah kiri untuk mulai mengelola atau mengundurkan soal-soal.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: MANAGE STUDENTS */}
              {adminTab === 'students' && (
                <div className="neu-flat p-6 md:p-8 flex flex-col gap-6 border border-white/20 animate-fadeIn">
                  
                  {/* Header & Controls Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">Manajemen Akun Siswa</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {role === 'teacher' 
                          ? `Daftar siswa yang terdaftar dalam bidang pelajaran Anda (${currentTeacher?.subject}).`
                          : "Kelola data kredensi (username, nama, password) siswa untuk mengikuti Computer Based Test (CBT)."}
                      </p>
                    </div>
                    {role !== 'teacher' && (
                      <div>
                        <button
                          onClick={() => {
                            setSelectedStudentForEdit(null);
                            setStudentUsername('');
                            setStudentNameInput('');
                            setStudentPassword('');
                            setShowAddStudentForm(!showAddStudentForm);
                          }}
                          className="clay-blue text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>{showAddStudentForm ? 'Tutup Form' : 'Tambah Siswa Baru'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CSV spreadsheet template and import panel */}
                  {role !== 'teacher' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-3xl border border-white/20 bg-[#e0e5ec]/20 shadow-inner animate-fadeIn">
                      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#e0e5ec]/40 border border-white/30">
                        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 pb-2 border-b border-white/10">
                          <Download className="w-3.5 h-3.5 text-blue-500" />
                          1. Unduh Template CSV Siswa
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                          Unduh format tabel (.CSV) yang kompatibel dengan Excel atau Google Sheets. Isi dengan data username login, nama lengkap, dan password masing-masing siswa.
                        </p>
                        <button
                          type="button"
                          onClick={handleDownloadStudentTemplate}
                          className="mt-2 self-start px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 font-bold text-blue-700 text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Unduh Template (.CSV)
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#e0e5ec]/40 border border-white/30">
                        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 pb-2 border-b border-white/10">
                          <FileUp className="w-3.5 h-3.5 text-green-600" />
                          2. Impor File Excel / CSV
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                          Setelah mengisi data siswa pada template, silakan unggah file tersebut ke sini. Sistem akan otomatis meregistrasikan semua akun siswa sekaligus secara masal!
                        </p>
                        
                        <label className="mt-2 self-start px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-600 text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
                          <FileUp className="w-3.5 h-3.5 text-slate-500" />
                          <span>Pilih Berkas CSV</span>
                          <input
                            type="file"
                            accept=".csv, .txt, text/csv, text/plain"
                            onChange={handleImportStudentsCSV}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Add/Edit Student Form Collapsible */}
                  {showAddStudentForm && role !== 'teacher' && (
                    <motion.form
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleSaveStudent}
                      className="p-5 rounded-3xl neu-pressed bg-[#e0e5ec]/50 border border-white/30 flex flex-col gap-4 shadow-inner"
                    >
                      <h5 className="text-xs font-bold text-blue-800 flex items-center gap-2 border-b border-blue-200/20 pb-2 uppercase tracking-wider font-mono">
                        <UserCheck className="w-4 h-4" />
                        {selectedStudentForEdit ? 'EDIT DATA SISWA' : 'TAMBAH AKUN SISWA BARU'}
                      </h5>
 
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Username Login :</label>
                          <input
                            type="text"
                            value={studentUsername}
                            onChange={(e) => setStudentUsername(e.target.value)}
                            placeholder="Contoh: budi123"
                            required
                            className="px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                          />
                        </div>
 
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Nama Lengkap Siswa :</label>
                          <input
                            type="text"
                            value={studentNameInput}
                            onChange={(e) => setStudentNameInput(e.target.value)}
                            placeholder="Contoh: Budi Santoso"
                            required
                            className="px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Mata Pelajaran :</label>
                          <input
                            type="text"
                            value={studentSubject}
                            onChange={(e) => setStudentSubject(e.target.value)}
                            placeholder="Contoh: Matematika, IPA"
                            required
                            className="px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                          />
                        </div>
 
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Kata Sandi / Password :</label>
                          <input
                            type="text"
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            placeholder="Contoh: rahasia123"
                            required
                            className="px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono font-medium"
                          />
                        </div>
                      </div>
 
                      <div className="flex justify-end gap-2.5 border-t border-slate-200/20 pt-3">
                        <button
                          type="button"
                          onClick={handleCancelStudentEdit}
                          className="px-4 py-2 rounded-xl hover:neu-pressed text-xs text-slate-500 font-bold cursor-pointer transition-all"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="clay-blue px-6 py-2 rounded-xl text-xs text-white uppercase tracking-wider font-bold cursor-pointer transition-all active:translate-y-0.5 shadow-sm"
                        >
                          {selectedStudentForEdit ? 'Perbarui Data' : 'Simpan Akun'}
                        </button>
                      </div>
                    </motion.form>
                  )}
 
                  {/* Search and List */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-white/40 border border-white/20 p-2.5 rounded-2xl w-full max-w-md shadow-inner neu-input">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Cari siswa berdasarkan nama, username, atau mata pelajaran..."
                        className="bg-transparent text-xs text-slate-700 w-full focus:outline-none"
                      />
                    </div>
 
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/40">
                      <table className="w-full text-left border-collapse bg-white/10">
                        <thead>
                          <tr className="bg-slate-200/50 border-b border-slate-300/30">
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">No</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Username</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Password</th>
                            {role !== 'teacher' && <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={role === 'teacher' ? 5 : 6} className="p-8 text-center text-xs text-slate-400">
                                Tidak ada data siswa yang cocok dengan pencarian atau terdaftar.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((stud, idx) => (
                              <tr 
                                key={stud.id}
                                className="border-b border-slate-300/10 hover:bg-white/20 transition-all duration-150"
                              >
                                <td className="p-3.5 text-xs font-mono text-slate-500 font-medium">{idx + 1}</td>
                                <td className="p-3.5 text-xs text-slate-800 font-semibold">{stud.name}</td>
                                <td className="p-3.5 text-xs text-blue-700 font-bold">
                                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 font-mono text-[10px]">
                                    {stud.subject || 'Umum'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-xs text-slate-600 font-medium select-all">{stud.username}</td>
                                <td className="p-3.5 text-xs font-mono text-slate-500 font-medium select-all bg-slate-300/5 rounded px-2.5 py-1 inline-block mt-1">{stud.password}</td>
                                {role !== 'teacher' && (
                                  <td className="p-3.5 text-xs text-center shrink-0">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleEditStudentClick(stud)}
                                        className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                        title="Edit Siswa"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteStudentClick(stud.id)}
                                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Hapus Siswa"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MANAGE TEACHERS */}
              {adminTab === 'teachers' && (
                <div className="neu-flat p-6 md:p-8 flex flex-col gap-6 border border-white/20 animate-fadeIn">
                  
                  {/* Header & Controls Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">Manajemen Akun Guru</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Kelola data kredensi (Nama, Mata Pelajaran, Username, Password) guru untuk mengawasi atau mengonfigurasi ujian.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setSelectedTeacherForEdit(null);
                          setTeacherUsername('');
                          setTeacherNameInput('');
                          setTeacherSubject('');
                          setTeacherPassword('');
                          setShowAddTeacherForm(!showAddTeacherForm);
                        }}
                        className="clay-blue text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{showAddTeacherForm ? 'Tutup Form' : 'Tambah Guru Baru'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Add/Edit Teacher Form Collapsible */}
                  {showAddTeacherForm && (
                    <motion.form
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleSaveTeacher}
                      className="p-5 rounded-3xl neu-pressed bg-[#e0e5ec]/50 border border-white/30 flex flex-col gap-4 shadow-inner"
                    >
                      <h5 className="text-xs font-bold text-blue-800 flex items-center gap-2 border-b border-blue-200/20 pb-2 uppercase tracking-wider font-mono">
                        <UserCheck className="w-4 h-4" />
                        {selectedTeacherForEdit ? 'EDIT DATA GURU' : 'TAMBAH AKUN GURU BARU'}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Username Login :</label>
                          <input
                            type="text"
                            value={teacherUsername}
                            onChange={(e) => setTeacherUsername(e.target.value)}
                            placeholder="Contoh: guru_matematika"
                            required
                            className="px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Nama Lengkap Guru :</label>
                          <input
                            type="text"
                            value={teacherNameInput}
                            onChange={(e) => setTeacherNameInput(e.target.value)}
                            placeholder="Contoh: Dr. Herman, M.Pd"
                            required
                            className="px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Mata Pelajaran :</label>
                          <input
                            type="text"
                            value={teacherSubject}
                            onChange={(e) => setTeacherSubject(e.target.value)}
                            placeholder="Contoh: Matematika"
                            required
                            className="px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Kata Sandi / Password :</label>
                          <input
                            type="text"
                            value={teacherPassword}
                            onChange={(e) => setTeacherPassword(e.target.value)}
                            placeholder="Contoh: gurubahagia"
                            required
                            className="px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2.5 border-t border-slate-200/20 pt-3">
                        <button
                          type="button"
                          onClick={handleCancelTeacherEdit}
                          className="px-4 py-2 rounded-xl hover:neu-pressed text-xs text-slate-500 font-bold cursor-pointer transition-all"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="clay-blue px-6 py-2 rounded-xl text-xs text-white uppercase tracking-wider font-bold cursor-pointer transition-all active:translate-y-0.5 shadow-sm"
                        >
                          {selectedTeacherForEdit ? 'Perbarui Data' : 'Simpan Akun'}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* Search and List */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-white/40 border border-white/20 p-2.5 rounded-2xl w-full max-w-md shadow-inner neu-input">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder="Cari guru berdasarkan nama, username, atau mata pelajaran..."
                        className="bg-transparent text-xs text-slate-700 w-full focus:outline-none"
                      />
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200/40">
                      <table className="w-full text-left border-collapse bg-white/10">
                        <thead>
                          <tr className="bg-slate-200/50 border-b border-slate-300/30">
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">No</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Nama Guru</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Username</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Password</th>
                            <th className="p-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTeachers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                                Tidak ada data guru yang cocok dengan pencarian atau terdaftar.
                              </td>
                            </tr>
                          ) : (
                            filteredTeachers.map((teach, idx) => (
                              <tr 
                                key={teach.id}
                                className="border-b border-slate-300/10 hover:bg-white/20 transition-all duration-150"
                              >
                                <td className="p-3.5 text-xs font-mono text-slate-500 font-medium">{idx + 1}</td>
                                <td className="p-3.5 text-xs text-slate-800 font-semibold">{teach.name}</td>
                                <td className="p-3.5 text-xs text-emerald-700 font-bold">
                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 font-mono text-[10px]">
                                    {teach.subject}
                                  </span>
                                </td>
                                <td className="p-3.5 text-xs text-slate-600 font-medium select-all">{teach.username}</td>
                                <td className="p-3.5 text-xs font-mono text-slate-500 font-medium select-all bg-slate-300/5 rounded px-2.5 py-1 inline-block mt-1">{teach.password}</td>
                                <td className="p-3.5 text-xs text-center shrink-0">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditTeacherClick(teach)}
                                      className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Edit Guru"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTeacherClick(teach.id)}
                                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Hapus Guru"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REPORTS & STUDENT RESULT LISTS */}
              {adminTab === 'results' && (
                <div className="neu-flat p-6 md:p-8 flex flex-col gap-5 border border-white/20">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">Daftar Rekap Nilai Evaluasi Siswa</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Memantau performa, mendegradasi rekap manual ke dokumen, atau melakukan audit.
                      </p>
                    </div>
                    
                    {role !== 'teacher' && results.length > 0 && (
                      <button
                        onClick={handleClearResultsLog}
                        className="px-3.5 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 font-bold text-red-700 text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Semua Log
                      </button>
                    )}
                  </div>

                  {/* Search and filter tools */}
                  <div className="p-5 rounded-3xl neu-pressed bg-[#e0e5ec]/30 border border-white/20 flex flex-col gap-4 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      
                      {/* Dropdown for selecting exam packet */}
                      <div className="flex flex-col gap-1.5 md:col-span-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Mata Ujian / Paket:</label>
                        <select
                          value={selectedResultExamId}
                          onChange={(e) => setSelectedResultExamId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300/40 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium cursor-pointer shadow-sm transition-all"
                        >
                          <option value="ALL">Semua Paket Ujian ({
                            role === 'teacher' && currentTeacher
                              ? results.filter(r => r.subject.toLowerCase() === currentTeacher.subject.toLowerCase()).length
                              : results.length
                          })</option>
                           {displayedExams.map((ex) => {
                             const count = results.filter(r => r.examId === ex.id).length;
                             return (
                               <option key={ex.id} value={ex.id}>
                                 {ex.title} ({count})
                               </option>
                             );
                           })}
                           {/* Add deleted or historical ones if present in records */}
                           {Array.from(new Set(
                             (role === 'teacher' && currentTeacher 
                               ? results.filter(r => r.subject.toLowerCase() === currentTeacher.subject.toLowerCase()) 
                               : results
                             ).map(r => r.examId)
                           ))
                             .filter(id => !displayedExams.some(ex => ex.id === id))
                             .map(id => {
                               const matches = (role === 'teacher' && currentTeacher 
                                 ? results.filter(r => r.subject.toLowerCase() === currentTeacher.subject.toLowerCase()) 
                                 : results
                               ).filter(r => r.examId === id);
                               const title = matches[0]?.examTitle || `ID: ${id}`;
                               return (
                                 <option key={id} value={id}>
                                   [Terhapus] {title} ({matches.length})
                                 </option>
                               );
                             })}
                        </select>
                      </div>

                      {/* Search input field */}
                      <div className="flex flex-col gap-1.5 md:col-span-5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Cari Nama Siswa / NISN:</label>
                        <div className="flex items-center gap-2.5 bg-white border border-slate-300/40 px-3 py-2 rounded-xl shadow-inner focus-within:ring-1 focus-within:ring-blue-400">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none font-medium"
                            placeholder="Ketik nama siswa atau NISN..."
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Export button aligned next to it */}
                      <div className="md:col-span-3">
                        <button
                          onClick={handleExportResultsCSV}
                          className="w-full clay-blue hover:scale-[1.01] active:scale-[0.99] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer h-[34px]"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Ekspor (.CSV)</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Log results lists */}
                  {filteredResults.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-white/15 rounded-2xl border border-dashed border-white/30">
                      Tidak ada data laporan siswa yang cocok ditemukan.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-white/20 rounded-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#e0e5ec] text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-white/20">
                            <th className="p-4">Nama Siswa / NISN</th>
                            <th className="p-4">Paket Ujian</th>
                            <th className="p-4">Tanggal Selesai</th>
                            <th className="p-4">Jawaban Benar</th>
                            <th className="p-4">Skor</th>
                            <th className="p-4 text-right">Opsi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-xs font-sans text-slate-600">
                          {filteredResults.map((res) => (
                            <tr key={res.id} className="hover:bg-white/10 transition-colors">
                              <td className="p-4">
                                <span className="font-bold text-slate-800 block text-sm">{res.studentName}</span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">{res.studentId || 'KOSONG'}</span>
                              </td>
                              <td className="p-4 font-mono">
                                <span className="font-extrabold text-[#4dabf7] tracking-wider text-[9px] block mb-0.5 uppercase">{res.subject}</span>
                                <span className="font-bold text-slate-700 text-xs">{res.examTitle}</span>
                              </td>
                              <td className="p-4 font-mono text-[11px] text-slate-400">{res.completedAt}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 font-bold font-mono rounded bg-blue-100 text-blue-700 text-[10px]">
                                  {res.correctCount} / {res.totalQuestions}
                                </span>
                              </td>
                              <td className="p-4 text-left">
                                <span className={`text-base font-black ${res.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                                  {res.score}%
                                </span>
                                <span className="text-[9px] font-bold block opacity-60 uppercase font-mono mt-0.5">
                                  {res.score >= 70 ? 'Lulus' : 'Remedial'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => {
                                    setActiveReviewResult(res);
                                    setActiveScreen('review-screen');
                                  }}
                                  className="clay-blue text-white px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider cursor-pointer shadow-sm rounded-lg"
                                >
                                  Tinjau Pembahasan
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SUPABASE INTEGRATION MONITOR */}
              {adminTab === 'supabase' && (
                <div className="flex flex-col gap-6 w-full animate-fadeIn">
                  <div className="neu-flat p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20">
                    <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shrink-0 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4)] ${
                        supabaseStatus.connected ? 'clay-green' : 'bg-rose-500'
                      }`}>
                        <ShieldCheck className="w-9 h-9" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-800">Status Integrasi Supabase</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Menghubungkan aplikasi CBT Anda langsung ke database relational cloud Supabase.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            supabaseStatus.connected 
                              ? 'text-emerald-700 bg-emerald-100 border-emerald-200/50' 
                              : 'text-rose-700 bg-rose-100 border-rose-200/50'
                          }`}>
                            {supabaseStatus.connected ? '● Terhubung' : '○ Terputus / Belum Siap'}
                          </span>
                          <span className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200/50 rounded-full font-mono">
                            ID: gxmhklclgohwwoheldck
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={checkSupabase}
                      disabled={supabaseStatus.checking}
                      className="clay-blue px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white cursor-pointer shadow-md rounded-xl flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${supabaseStatus.checking ? 'animate-spin' : ''}`} />
                      {supabaseStatus.checking ? 'Memeriksa...' : 'Periksa Koneksi'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left details - Table statuses */}
                    <div className="lg:col-span-4 flex flex-col gap-5">
                      <div className="neu-flat p-6 flex flex-col gap-4 border border-white/20">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-white/10 pb-2">
                          Status Tabel Database
                        </h4>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between p-3 bg-white/20 rounded-xl border border-white/40">
                            <div>
                              <span className="text-xs font-black text-slate-700 font-sans block">cbt_exams</span>
                              <span className="text-[10px] text-slate-400 font-mono">Data Paket Ujian & Soal</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded font-mono ${
                              supabaseStatus.examsTable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {supabaseStatus.examsTable ? 'Aktif' : 'Hilang'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white/20 rounded-xl border border-white/40">
                            <div>
                              <span className="text-xs font-black text-slate-700 font-sans block">cbt_results</span>
                              <span className="text-[10px] text-slate-400 font-mono">Riwayat & Hasil Ujian</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded font-mono ${
                              supabaseStatus.resultsTable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {supabaseStatus.resultsTable ? 'Aktif' : 'Hilang'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white/20 rounded-xl border border-white/40">
                            <div>
                              <span className="text-xs font-black text-slate-700 font-sans block">cbt_students</span>
                              <span className="text-[10px] text-slate-400 font-mono">Kredensial Siswa</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded font-mono ${
                              supabaseStatus.studentsTable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {supabaseStatus.studentsTable ? 'Aktif' : 'Hilang'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white/20 rounded-xl border border-white/40">
                            <div>
                              <span className="text-xs font-black text-slate-700 font-sans block">cbt_teachers</span>
                              <span className="text-[10px] text-slate-400 font-mono">Kredensial Guru</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded font-mono ${
                              supabaseStatus.teachersTable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {supabaseStatus.teachersTable ? 'Aktif' : 'Hilang'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-100/60 rounded-xl text-[10px] text-slate-600 leading-relaxed font-sans">
                          <span className="font-bold text-amber-700 block mb-0.5 font-mono">ℹ️ INFORMASI:</span>
                          Koneksi Supabase menggunakan strategi real-time dan background sync. Jika Anda mengubah database Supabase secara eksternal, muat ulang halaman ini untuk menarik perubahan terbaru.
                        </div>
                      </div>
                    </div>

                    {/* Right details - Setup & Script sql */}
                    <div className="lg:col-span-8 flex flex-col gap-5">
                      <div className="neu-flat p-6 flex flex-col gap-4 border border-white/20">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                            Inisialisasi Tabel Supabase (SQL Script)
                          </h4>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(SUPABASE_BOOTSTRAP_SQL);
                              alert('Script SQL berhasil disalin ke clipboard!');
                            }}
                            className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] px-3 py-1 font-bold rounded-lg hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            Salin Script SQL
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          Jika Anda pertama kali menghubungkan Supabase, Anda harus membuat tabel dan memasukkan data awal di SQL Editor Anda di Supabase Dashboard. 
                          Klik tombol di atas untuk menyalin script pembuat tabel otomatis, masuk ke akun Supabase Anda di <strong className="text-indigo-600">gxmhklclgohwwoheldck</strong>, buka bagian <strong className="text-slate-800">SQL Editor</strong>, lalu pasta & jalankan (Run).
                        </p>

                        <div className="relative rounded-2xl bg-slate-900 border border-slate-950 p-4 shadow-inner max-h-[280px] overflow-y-auto">
                          <pre className="text-[10px] font-mono text-indigo-300 leading-relaxed whitespace-pre-wrap select-all">
                            {SUPABASE_BOOTSTRAP_SQL}
                          </pre>
                        </div>
                        
                        <div className="text-xs text-slate-600 mt-1">
                          <strong>URL Proyek:</strong> <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[10px]">https://gxmhklclgohwwoheldck.supabase.co</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Neumorphic Modal Add New Exam */}
              {showAddExamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
                  <div className="neu-flat p-6 sm:p-8 max-w-md w-full flex flex-col gap-5 border border-white/30 rounded-3xl">
                    
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide font-mono">Buat Paket Ujian Baru</h4>
                      <button
                        onClick={() => setShowAddExamModal(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono cursor-pointer"
                      >
                        [Tutup]
                      </button>
                    </div>
 
                    <form onSubmit={handleCreateExam} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Nama / Judul Ujian:</label>
                        <input
                          type="text"
                          required
                          value={newExamTitle}
                          onChange={(e) => setNewExamTitle(e.target.value)}
                          placeholder="Contoh: Penilaian Harian Listrik Dinamis"
                          className="w-full px-3 py-2 border rounded-xl neu-input bg-white text-xs text-slate-700 focus:outline-none border-slate-300/40"
                        />
                      </div>
 
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Mata Pelajaran: </label>
                        <input
                          type="text"
                          required
                          value={newExamSubject}
                          onChange={(e) => setNewExamSubject(e.target.value)}
                          placeholder="Contoh: Fisika, Sejarah"
                          className="w-full px-3 py-2 border rounded-xl neu-input bg-white text-xs text-slate-700 focus:outline-none border-slate-300/40"
                        />
                      </div>
 
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Durasi Waktu (Menit):</label>
                        <input
                          type="number"
                          required
                          value={newExamDuration}
                          onChange={(e) => setNewExamDuration(Number(e.target.value))}
                          placeholder="Min: 1"
                          className="w-full px-3 py-2 border rounded-xl neu-input bg-white text-xs text-slate-700 focus:outline-none border-slate-300/40"
                          min="1"
                        />
                      </div>
 
                      <div className="flex gap-2 justify-end mt-4 border-t border-white/10 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowAddExamModal(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:neu-pressed rounded-lg cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="clay-blue px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md rounded-lg cursor-pointer"
                        >
                          Simpan & Buat
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              {/* Custom Neumorphic Confirmation Dialog */}
              {confirmDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="neu-flat p-6 sm:p-7 max-w-sm w-full flex flex-col gap-5 border border-white/30 rounded-3xl bg-[#e0e5ec] shadow-xl"
                  >
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                        {confirmDialog.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {confirmDialog.message}
                    </p>

                    <div className="flex justify-end gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmDialog(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:neu-pressed rounded-xl cursor-pointer bg-white/20 border border-white/30 active:scale-[0.98] transition-all"
                      >
                        {confirmDialog.cancelText || 'Batal'}
                      </button>
                      <button
                        type="button"
                        onClick={confirmDialog.onConfirm}
                        className="clay-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md rounded-xl cursor-pointer active:scale-[0.98] transition-all"
                      >
                        {confirmDialog.confirmText || 'Hapus'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer information */}
      <footer className="py-6 text-center border-t border-slate-200/50 backdrop-blur-sm text-slate-400 mt-auto text-xs flex gap-5 flex-col xs:justify-center px-4">
  {/*       <span>Gunakan akun <b>NISN sendiri</b> untuk evaluasi mandiri atau login Admin (password: <b>admin</b>).</span>
  */}      <span>© 2026 SMASA-Online. Terintegrasi, Aman, Fleksibel.</span>
      </footer>
    </div>
  );
}
