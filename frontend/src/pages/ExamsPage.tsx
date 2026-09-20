import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Trash2,
  FileText,
  X,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Exam, Subject } from '../types';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExamSyllabus, setSelectedExamSyllabus] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | ''>('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamType, setNewExamType] = useState('Midterm');
  const [newSyllabus, setNewSyllabus] = useState('');

  const fetchExams = async () => {
    try {
      const [exData, subData] = await Promise.all([
        api.get<Exam[]>('/exams'),
        api.get<Subject[]>('/subjects'),
      ]);
      setExams(exData);
      setSubjects(subData);
      if (subData.length > 0 && !newSubjectId) {
        setNewSubjectId(subData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this exam entry?')) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams(exams.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectId) {
      alert('Please select a subject');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/exams', {
        subject_id: Number(newSubjectId),
        title: newTitle,
        exam_date: new Date(newExamDate).toISOString(),
        exam_type: newExamType,
        syllabus: newSyllabus || undefined,
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewSyllabus('');
      setNewExamDate('');
      fetchExams();
    } catch (err: any) {
      alert(err.message || 'Could not schedule exam');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Exams & Assessments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Exam schedules, syllabus breakdowns, and countdown timers
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-500/20 transition active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Exam</span>
        </button>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <CalendarDays className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No upcoming exams</h3>
          <p className="text-sm text-slate-500 mt-1">Schedule your midterm or final exams to unlock AI study plans.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const days = exam.days_until_exam ?? 0;
            const isImminent = days <= 3;
            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                      style={{
                        backgroundColor: `${exam.subject_color || '#8B5CF6'}18`,
                        color: exam.subject_color || '#8B5CF6',
                      }}
                    >
                      {exam.subject_name}
                    </span>

                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition opacity-0 group-hover:opacity-100"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Countdown Highlight */}
                  <div className="mt-4 flex items-baseline gap-2">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        isImminent
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {days <= 0
                        ? 'Exam Today!'
                        : `In ${days} days`}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ({exam.exam_type})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(exam.exam_date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {exam.syllabus ? (
                    <button
                      onClick={() => setSelectedExamSyllabus(exam)}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Syllabus</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No syllabus attached</span>
                  )}

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isImminent ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {isImminent ? 'High Urgency' : 'Scheduled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Syllabus Modal */}
      {selectedExamSyllabus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-7 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  {selectedExamSyllabus.subject_name}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedExamSyllabus.title} — Syllabus
                </h3>
              </div>
              <button
                onClick={() => setSelectedExamSyllabus(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {selectedExamSyllabus.syllabus}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedExamSyllabus(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule an Exam</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject
                </label>
                <select
                  required
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  Exam Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Midterm 1: Relational Algebra & SQL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Exam Type
                  </label>
                  <select
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Lab Exam">Lab Exam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Syllabus / Topics Covered
                </label>
                <textarea
                  rows={3}
                  value={newSyllabus}
                  onChange={(e) => setNewSyllabus(e.target.value)}
                  placeholder="Paste chapters, formulas, or key topics to review..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Exam</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
