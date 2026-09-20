import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Sparkles,
  Trash2,
  Eye,
  X,
  Loader2,
  HelpCircle,
  BrainCircuit
} from 'lucide-react';
import { api } from '../services/api';
import { Note, Subject } from '../types';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [uploading, setUploading] = useState(false);

  // Note Viewer Modal
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const navigate = useNavigate();

  const fetchNotes = async () => {
    try {
      const [nData, sData] = await Promise.all([
        api.get<Note[]>('/notes'),
        api.get<Subject[]>('/subjects'),
      ]);
      setNotes(nData);
      setSubjects(sData);
      if (sData.length > 0 && !subjectId) setSubjectId(sData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please choose a PDF or TXT file.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      if (subjectId) formData.append('subject_id', String(subjectId));

      await api.post('/notes/upload', formData);
      setIsUploadOpen(false);
      setFile(null);
      setTitle('');
      fetchNotes();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this note and its extracted content?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((n) => n.id !== id));
      if (viewingNote?.id === id) setViewingNote(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSummarize = async (note: Note) => {
    setSummarizing(true);
    try {
      const res = await api.post<any>('/ai/summarize', { note_id: note.id });
      // update note in list
      setNotes(notes.map((n) => (n.id === note.id ? { ...n, summary: res.summary } : n)));
      if (viewingNote) setViewingNote({ ...viewingNote, summary: res.summary });
    } catch (err: any) {
      alert(err.message || 'Summarization failed');
    } finally {
      setSummarizing(false);
    }
  };

  const handleAskAIAboutNote = (note: Note) => {
    navigate('/ai-assistant', { state: { noteId: note.id, noteTitle: note.title } });
  };

  const handleGenerateQuizForNote = (note: Note) => {
    navigate('/ai-assistant', { state: { quizMode: true, noteId: note.id, noteTitle: note.title } });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notes & PDF Repository
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload lecture notes, extract text, produce AI summaries, and generate test quizzes
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition active:scale-[0.99]"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Lecture Note</span>
        </button>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No notes uploaded yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Upload course slides or notes (.pdf or .txt) to enable AI question answering and automated summaries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                    {note.subject_name}
                  </span>

                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition opacity-0 group-hover:opacity-100"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-2xl flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {note.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {note.file_name}
                    </p>
                  </div>
                </div>

                {note.summary ? (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">AI Summary:</span>
                    {note.summary}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-400 italic">
                    Text extracted. Ready for AI analysis and quiz generation.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingNote(note)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Read</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSummarize(note)}
                    disabled={summarizing}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    title="Summarize Note"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Summarize</span>
                  </button>

                  <button
                    onClick={() => handleGenerateQuizForNote(note)}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 hover:bg-purple-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    title="Generate Quiz"
                  >
                    <BrainCircuit className="w-3 h-3" />
                    <span>Quiz</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Reader Modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between mb-4 flex-shrink-0">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">
                  {viewingNote.subject_name}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {viewingNote.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{viewingNote.file_name}</p>
              </div>
              <button
                onClick={() => setViewingNote(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 flex-wrap">
              <button
                onClick={() => handleSummarize(viewingNote)}
                disabled={summarizing}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{viewingNote.summary ? 'Regenerate Summary' : 'Generate AI Summary'}</span>
              </button>

              <button
                onClick={() => handleGenerateQuizForNote(viewingNote)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Create Practice Quiz</span>
              </button>

              <button
                onClick={() => handleAskAIAboutNote(viewingNote)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ask AI Questions</span>
              </button>
            </div>

            {/* Extracted Text Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {viewingNote.summary && (
                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl">
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>AI Executive Summary</span>
                  </h4>
                  <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {viewingNote.summary}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Extracted Document Text
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-xs md:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                  {viewingNote.extracted_text || 'No text could be extracted from this document.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Note / PDF</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 2: CPU Scheduling & Deadlocks"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  File (.pdf or .txt)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  required
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Upload & Extract</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
