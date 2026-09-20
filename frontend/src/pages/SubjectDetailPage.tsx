import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  CheckSquare,
  CalendarDays,
  FileText,
  Plus,
  Loader2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { api } from '../services/api';
import { Subject, Assignment, Exam, Note, Attendance } from '../types';

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const [subData, asgnsData, examsData, notesData, attData] = await Promise.all([
          api.get<Subject>(`/subjects/${id}`),
          api.get<Assignment[]>(`/assignments?subject_id=${id}`),
          api.get<Exam[]>('/exams'),
          api.get<Note[]>(`/notes?subject_id=${id}`),
          api.get<Attendance[]>('/attendance')
        ]);

        setSubject(subData);
        setAssignments(asgnsData);
        setExams(examsData.filter((e) => e.subject_id === parseInt(id)));
        setNotes(notesData);
        const matchedAtt = attData.find((a) => a.subject_id === parseInt(id));
        setAttendance(matchedAtt || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  const handleToggleAssignment = async (asgnId: number) => {
    try {
      const updated = await api.patch<Assignment>(`/assignments/${asgnId}/toggle-status`);
      setAssignments(assignments.map((a) => (a.id === asgnId ? updated : a)));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Subject not found.</p>
        <button onClick={() => navigate('/subjects')} className="mt-4 text-xs font-bold text-blue-600">
          Back to Subjects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/subjects')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Subjects</span>
      </button>

      {/* Hero Card */}
      <div className="p-7 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: subject.color }}
            />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {subject.code}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {subject.name}
          </h1>
          {subject.teacher && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{subject.teacher}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Credits</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{subject.credits}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Attendance</p>
            <p className={`text-2xl font-bold mt-0.5 ${(attendance?.percentage ?? 100) < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {attendance?.percentage ?? 100}%
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Pending Work</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {assignments.filter((a) => a.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assignments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Assignments</h2>
            </div>
            <Link to="/assignments" className="text-xs font-semibold text-blue-600 hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No assignments created for this subject.</p>
            ) : (
              assignments.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleAssignment(a.id)}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 transition"
                    >
                      {a.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold text-slate-800 dark:text-slate-200 truncate ${a.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                        {a.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Due {new Date(a.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    a.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {a.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Exams */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-purple-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Scheduled Exams</h2>
            </div>
            <Link to="/exams" className="text-xs font-semibold text-blue-600 hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {exams.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No exams scheduled for this subject.</p>
            ) : (
              exams.map((e) => (
                <div
                  key={e.id}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
                      {e.exam_type}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {e.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(e.exam_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {(e.days_until_exam ?? 0) <= 0 ? 'Today' : `In ${e.days_until_exam} days`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notes & PDFs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Notes & Study Materials</h2>
            </div>
            <Link to="/notes" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Material</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center col-span-full">
                No notes or PDFs uploaded for this subject yet.
              </p>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50"
                >
                  <FileText className="w-6 h-6 text-blue-500 mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    {n.file_name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
