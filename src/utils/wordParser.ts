import mammoth from 'mammoth';
import { Question } from '../types';

/**
 * Parses raw text from a copy-pasted source or Word document into Question items
 */
export function parseExamText(rawText: string): Question[] {
  const lines = rawText.split('\n');
  const questions: Question[] = [];
  
  let currentQuestion: Partial<Question> | null = null;
  let currentField: 'text' | 'A' | 'B' | 'C' | 'D' | 'E' | 'discussion' | null = null;

  const optionRegex = /^\s*([A-E])[\.\)\-\:\s]\s*(.*)$/i;
  const questionNumRegex = /^\s*(\d+)[\.\)\-\s]\s*(.*)$/;
  const keyRegex = /^\s*(kunci|jawaban|kunci jawaban|key)\s*[\:\-\=\s]\s*([A-E])\s*$/i;
  const discRegex = /^\s*(pembahasan|penjelasan|discussion|solusi)\s*[\:\-\=\s]\s*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for a new question
    const qMatch = line.match(questionNumRegex);
    if (qMatch) {
      // Save previously completed question
      if (currentQuestion && isPartialQuestionValid(currentQuestion)) {
        questions.push(finalizeQuestion(currentQuestion));
      }
      
      currentQuestion = {
        id: `q-imported-${Date.now()}-${questions.length}`,
        text: qMatch[2].trim(),
        options: { A: '', B: '', C: '', D: '', E: '' },
        correctAnswer: 'A',
        discussion: '',
      };
      currentField = 'text';
      continue;
    }

    // Check for options (A-E)
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      const optionLetter = optMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
      if (currentQuestion.options) {
        currentQuestion.options[optionLetter] = optMatch[2].trim();
      }
      currentField = optionLetter;
      continue;
    }

    // Check for Key Answer
    const keyMatch = line.match(keyRegex);
    if (keyMatch && currentQuestion) {
      currentQuestion.correctAnswer = keyMatch[2].toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
      currentField = null; // stop appending to options
      continue;
    }

    // Check for Discussion
    const discMatch = line.match(discRegex);
    if (discMatch && currentQuestion) {
      currentQuestion.discussion = discMatch[2].trim();
      currentField = 'discussion';
      continue;
    }

    // Append to previous field if no match (supports multi-line questions, options or discussion)
    if (currentQuestion) {
      if (currentField === 'text') {
        currentQuestion.text += '\n' + line;
      } else if (currentField && ['A', 'B', 'C', 'D', 'E'].includes(currentField)) {
        const letter = currentField as 'A' | 'B' | 'C' | 'D' | 'E';
        if (currentQuestion.options) {
          currentQuestion.options[letter] += ' ' + line;
        }
      } else if (currentField === 'discussion') {
        currentQuestion.discussion += '\n' + line;
      } else {
        // Default to appending to question text if field is unknown
        currentQuestion.text += '\n' + line;
      }
    }
  }

  // Push the final question
  if (currentQuestion && isPartialQuestionValid(currentQuestion)) {
    questions.push(finalizeQuestion(currentQuestion));
  }

  return questions;
}

function isPartialQuestionValid(q: Partial<Question>): boolean {
  return !!(q.text && q.options && q.options.A && q.options.B);
}

function finalizeQuestion(q: Partial<Question>): Question {
  return {
    id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
    text: q.text || 'Tanpa teks pertanyaan.',
    options: {
      A: q.options?.A || 'Pilihan A',
      B: q.options?.B || 'Pilihan B',
      C: q.options?.C || 'Pilihan C',
      D: q.options?.D || 'Pilihan D',
      E: q.options?.E || 'Pilihan E',
    },
    correctAnswer: q.correctAnswer || 'A',
    discussion: q.discussion || 'Tidak ada pembahasan.',
  };
}

/**
 * Extracts raw text from a .docx file and parses it into Questions
 */
export async function parseDocxFile(file: File): Promise<Question[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return parseExamText(result.value);
}
