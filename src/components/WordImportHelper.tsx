import React, { useState, useRef } from 'react';
import { FileUp, Clipboard, Eye, CheckCircle2, AlertCircle, Trash2, HelpCircle, Download } from 'lucide-react';
import { Question } from '../types';
import { parseDocxFile, parseExamText } from '../utils/wordParser';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

interface WordImportHelperProps {
  onQuestionsImported: (questions: Question[]) => void;
  onCancel: () => void;
}

export default function WordImportHelper({ onQuestionsImported, onCancel }: WordImportHelperProps) {
  const [dragActive, setDragActive] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [showFormatHelp, setShowFormatHelp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "TEMPLATE SOAL UJIAN SMASA-ONLINE",
                    bold: true,
                    size: 28, // 14pt (in half-points)
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Sistem Evaluasi SMASA-Online - Template Dokumen Microsoft Word (.docx)",
                    italics: true,
                    size: 20, // 10pt
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }), // spacer
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "PETUNJUK PENULISAN SOAL (HARAP DIBACA):",
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "1. Gunakan penomoran angka berurutan di awal baris untuk setiap soal baru, diikuti tanda titik atau kurung (misalnya: '1. Pertanyaan Anda' atau '1) Pertanyaan Anda').",
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "2. Masukkan 5 pilihan jawaban (A sampai E) berurutan dengan format huruf besar di awal baris, diikuti tanda titik atau spasi (contoh: 'A. Pilihan A').",
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "3. Tulis jawaban benar langsung di bawah opsi E dengan format 'Kunci: [HURUF]', contoh: 'Kunci: B'.",
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "4. Anda dapat menyertakan ulasan atau penjelasan opsi secara opsional dengan format 'Pembahasan: [TEKS PEMBAHASAN]', contoh: 'Pembahasan: Rumus fisika untuk daya adalah P = W / t.'",
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "5. Jangan memasukkan gambar di template ini. Jika ingin menambahkan materi teks pendukung, letakkan sejajar di bawah nomor pertanyaan.",
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({ text: "" }), // spacer
              new Paragraph({
                children: [
                  new TextRun({
                    text: "-------------------------------- SOAL DIMULAI DIBAWAH INI --------------------------------",
                    color: "E61B23", // custom red alert color
                    bold: true,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }), // spacer

              // SOAL 1
              new Paragraph({
                children: [
                  new TextRun({
                    text: "1. Siapa penemu lampu pijar pertama kali yang diakui secara luas dalam sejarah teknologi?",
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: "A. Nikola Tesla", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "B. Thomas Alva Edison", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "C. Alexander Graham Bell", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "D. Albert Einstein", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "E. Benjamin Franklin", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "Kunci: B", bold: true, size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "Pembahasan: Thomas Alva Edison diakui sebagai penemu utama lampu pijar komersial yang praktis setelah mematenkannya pada tahun 1879.", size: 20, italics: true })] }),

              new Paragraph({ text: "" }), // spacer

              // SOAL 2
              new Paragraph({
                children: [
                  new TextRun({
                    text: "2. Unsur kimia dengan simbol fisik 'O' dan memiliki nomor atom 8 di dalam draf tabel periodik adalah...",
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: "A. Nitrogen", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "B. Hidrogen", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "C. Oksigen", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "D. Karbon", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "E. Helium", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "Kunci: C", bold: true, size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "Pembahasan: Simbol 'O' di dalam tabel periodik merujuk secara khusus ke unsur esensial Oksigen.", size: 20, italics: true })] }),

              new Paragraph({ text: "" }), // spacer

              // SOAL 3
              new Paragraph({
                children: [
                  new TextRun({
                    text: "3. Berapa hasil dari perhitungan operasi matematika sederhana 15 + 23?",
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: "A. 35", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "B. 38", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "C. 39", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "D. 40", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "E. 42", size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "Kunci: B", bold: true, size: 21 })] }),
              new Paragraph({ children: [new TextRun({ text: "Pembahasan: Hasil penjumlahan dari 15 ditambah 23 secara aritmatika dasar adalah 38.", size: 20, italics: true })] }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template_soal_neocbt.docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Terjadi kegagalan saat membuat file template. Coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccessMsg(null);
    
    // Check if DOCX
    if (!file.name.endsWith('.docx')) {
      setError('Format file tidak didukung. Harap unggah file Microsoft Word (.docx).');
      return;
    }

    try {
      const qList = await parseDocxFile(file);
      if (qList.length === 0) {
        setError('Tidak berhasil mengurai soal dari file Word tersebut. Pastikan format penulisan sesuai panduan.');
      } else {
        setParsedQuestions(qList);
        setSuccessMsg(`Berhasil mengurai ${qList.length} soal dari file "${file.name}"!`);
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat membaca file Word. Pastikan file tidak rusak.');
    }
  };

  const handlePasteParse = () => {
    setError(null);
    setSuccessMsg(null);
    
    if (!pasteText.trim()) {
      setError('Silakan tempel teks soal terlebih dahulu.');
      return;
    }

    try {
      const qList = parseExamText(pasteText);
      if (qList.length === 0) {
        setError('Format teks tidak cocok. Mohon ikuti standar panduan penulisan soal.');
      } else {
        setParsedQuestions(qList);
        setSuccessMsg(`Berhasil mengurai ${qList.length} soal dari teks yang ditempel!`);
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat parsing teks.');
    }
  };

  const handleDeleteParsedQuestion = (index: number) => {
    const list = [...parsedQuestions];
    list.splice(index, 1);
    setParsedQuestions(list);
    if (list.length === 0) {
      setSuccessMsg(null);
    } else {
      setSuccessMsg(`Tersisa ${list.length} soal siap diimpor.`);
    }
  };

  const handleSaveImport = () => {
    if (parsedQuestions.length === 0) {
      setError('Belum ada soal terurai untuk disimpan!');
      return;
    }
    onQuestionsImported(parsedQuestions);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const sampleFormatString = `1. Ibu kota negara Republik Indonesia secara resmi saat ini adalah...
A. Surabaya
B. Bandung
C. Jakarta
D. Nusantara
E. Yogyakarta
Kunci: C
Pembahasan: Ibu kota negara Indonesia secara resmi sejak deklarasi kemerdekaan adalah Jakarta.

2. Hasil kalkulasi dari penjumlahan 15 + 23 adalah...
A. 35
B. 38
C. 39
D. 40
E. 42
Kunci: B
Pembahasan: 15 + 23 = 38.`;

  return (
    <div className="neu-flat border border-white/20 p-6 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 font-display">Import Soal Terintegrasi Word</h3>
          <p className="text-xs text-slate-500 mt-1">
            Mendukung pengunggahan berkas Microsoft Word (.docx) atau menyalin-menempel teks soal secara langsung.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloading}
            className="px-3.5 py-2 rounded-xl clay-green text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:translate-y-0.5 cursor-pointer uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Mengunduh...' : 'Download Template .docx'}</span>
          </button>
          <button
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors duration-200 shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showFormatHelp ? 'Tutup Panduan' : 'Panduan Format'}</span>
          </button>
        </div>
      </div>

      {/* Format Help Sheet */}
      {showFormatHelp && (
        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100/80 text-xs text-slate-700 flex flex-col gap-3 animate-fadeIn">
          <span className="font-bold text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Format Standar Penulisan Soal (Wajib Diikuti):
          </span>
          <p className="leading-relaxed">
            Sistem kami mendukung parser otomatis yang sangat toleran. Agar parsing berjalan mulus, susun tulisan Anda di Word dengan panduan berikut:
          </p>
          <ul className="list-disc list-inside space-y-1.5 bg-white/70 p-3 rounded-xl border border-slate-100">
            <li>Gunakan nomor berurutan untuk tiap soal, contoh: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">1. Pertanyaan</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">1) Pertanyaan</code></li>
            <li>Pilihan ganda berjumlah 5 baris dengan awalan huruf <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">A.</code> sampai <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">E.</code></li>
            <li>Cantumkan kunci jawaban menggunakan format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Kunci: C</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Jawaban: C</code></li>
            <li>Tulis pembahasan (opsional) menggunakan kata kunci: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Pembahasan: isi teks pembahasan</code></li>
          </ul>
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-slate-800">Contoh salinan teks:</span>
            <pre className="p-3 bg-slate-800 text-slate-200 rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre">
              {sampleFormatString}
            </pre>
          </div>
        </div>
      )}

      {/* Main Import Interface */}
      {parsedQuestions.length === 0 ? (
        <div className="flex flex-col gap-5">
          {/* Tabs for Import Type */}
          <div className="flex bg-[#e0e5ec] p-1.5 rounded-2xl w-full max-w-sm self-center border border-white/20 shadow-inner">
            <button
              onClick={() => { setActiveTab('upload'); setError(null); }}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-1.5 transition-all duration-300 ${activeTab === 'upload' ? 'clay-blue text-white shadow-md' : 'text-slate-500 hover:text-slate-800 cursor-pointer'}`}
            >
              <FileUp className="w-3.5 h-3.5" />
              Unggah File Word
            </button>
            <button
              onClick={() => { setActiveTab('paste'); setError(null); }}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-1.5 transition-all duration-300 ${activeTab === 'paste' ? 'clay-blue text-white shadow-md' : 'text-slate-500 hover:text-slate-800 cursor-pointer'}`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              Salin & Tempel Teks
            </button>
          </div>

          {/* Area Upload File */}
          {activeTab === 'upload' && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all duration-300 ${dragActive ? 'border-blue-400 bg-blue-50/30 scale-[0.99] shadow-inner' : 'border-slate-300 hover:border-slate-400 hover:bg-white/10 shadow-sm'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".docx"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 shadow-inner flex items-center justify-center mb-4 transition-transform hover:scale-110">
                <FileUp className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-slate-800 text-center">
                Seret & Taruh berkas Word disini
              </span>
              <span className="text-xs text-slate-400 text-center mt-1">
                atau klik untuk memilih file dari komputer Anda
              </span>
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-full mt-4 border border-blue-100">
                Mendukung dokumen .docx saja
              </span>
            </div>
          )}

          {/* Area Paste Text */}
          {activeTab === 'paste' && (
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-mono">Tempel Teks Soal Ujian:</label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Tempel teks soal di sini sejalan dengan petunjuk contoh...\n\n1. Pertanyaan anda...\nA. Opsi A\nB. Opsi B\nC. Opsi C\nD. Opsi D\nE. Opsi E\nKunci: A\nPembahasan: isi pembahasan...`}
                className="w-full h-64 p-4 rounded-2xl border border-slate-300/40 text-xs font-medium neu-input bg-white text-slate-700 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasteParse}
                  className="clay-blue text-white px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span>Proses & Urai Teks</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        /* Preview Parsed Questions List before Saving */
        <div className="flex flex-col gap-5">
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Preview Soal Hasil Integrasi ({parsedQuestions.length} Soal)
            </span>
            <button
              onClick={() => setParsedQuestions([])}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset & Muat File Lain</span>
            </button>
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-2 flex flex-col gap-4 border border-slate-100 p-2 rounded-2xl bg-slate-50/50">
            {parsedQuestions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm flex gap-3 relative group">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 flex flex-col gap-2.5">
                  <p className="text-slate-800 text-xs font-medium leading-relaxed whitespace-pre-wrap">{q.text}</p>
                  
                  {/* Options layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                    {(Object.keys(q.options) as Array<'A' | 'B' | 'C' | 'D' | 'E'>).map((key) => {
                      const isCorrect = q.correctAnswer === key;
                      return (
                        <div
                          key={key}
                          className={`p-2 rounded-lg text-xs leading-dense border flex items-start gap-1.5 break-all ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200/50 text-slate-600'}`}
                        >
                          <span className={`font-bold shrink-0 ${isCorrect ? 'text-emerald-700' : 'text-slate-400'}`}>{key}.</span>
                          <span>{q.options[key]}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Kunci & Pembahasan preview */}
                  <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-900 flex flex-col gap-1">
                    <span className="font-bold flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px]">KUNCI: {q.correctAnswer}</span>
                    </span>
                    <p className="italic text-slate-600 mt-0.5 whitespace-pre-wrap"><span className="font-semibold text-indigo-900 not-italic">Pembahasan: </span>{q.discussion || 'Tidak ada pembahasan.'}</p>
                  </div>
                </div>

                {/* Individual Question delete option */}
                <button
                  type="button"
                  onClick={() => handleDeleteParsedQuestion(idx)}
                  className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus soal ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Error inside Preview page */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons in final step */}
          <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveImport}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:translate-y-0.5 text-white font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-[0_4px_10px_rgba(79,70,229,0.3)] transition-all duration-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Impor {parsedQuestions.length} Soal ke Ujian</span>
            </button>
          </div>
        </div>
      )}

      {/* Standard cancel button if not in preview */}
      {parsedQuestions.length === 0 && (
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all duration-200"
          >
            Kembali ke Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
