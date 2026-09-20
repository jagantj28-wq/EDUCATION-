import React, { useEffect, useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Minus,
  Edit2,
  X,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Attendance } from '../types';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAtt, setEditingAtt] = useState<Attendance | null>(null);

  // Edit form state
  const [editHeld, setEditHeld] = useState(0);
  const [editAttended, setEditAttended] = useState(0);
  const [editTarget, setEditTarget] = useState(75.0);
  const [updating, setUpdating] = useState(false);

  const fetchAttendance = () => {
    api.get<Attendance[]>('/attendance')
      .then((res) => setAttendances(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleQuickMark = async (subjectId: number, present: boolean) => {
    try {
      const updated = await api.post<Attendance>(`/attendance/${subjectId}/mark?present=${present}`);
      setAttendances(attendances.map((a) => (a.subject_id === subjectId ? updated : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (att: Attendance) => {
    setEditingAtt(att);
    setEditHeld(att.classes_held);
    setEditAttended(att.classes_attended);
    setEditTarget(att.target_percentage || 75.0);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAtt) return;

    if (editAttended > editHeld) {
      alert('Attended classes cannot exceed classes held.');
      return;
    }

    setUpdating(true);
    try {
      const updated = await api.put<Attendance>(`/attendance/${editingAtt.subject_id}`, {
        classes_held: Number(editHeld),
        classes_attended: Number(editAttended),
        target_percentage: Number(editTarget),
      });
      setAttendances(attendances.map((a) => (a.subject_id === editingAtt.subject_id ? updated : a)));
      setEditingAtt(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    } finally {
      setUpdating(false);
    }
  };

  const totalHeld = attendances.reduce((acc, a) => acc + a.classes_held, 0);
  const totalAttended = attendances.reduce((acc, a) => acc + a.classes_attended, 0);
  const overallPercentage = totalHeld > 0 ? ((totalAttended / totalHeld) * 100).toFixed(1) : '100.0';
  const belowTargetCount = attendances.filter((a) => a.is_below_target).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attendance Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor subject percentages, log lectures, and calculate target recovery
          </p>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Attendance</p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {overallPercentage}%
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              {totalAttended} of {totalHeld} total classes attended
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className={`p-4 rounded-2xl ${belowTargetCount > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Warning Status</p>
            <h2 className={`text-3xl font-black mt-0.5 ${belowTargetCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {belowTargetCount} {belowTargetCount === 1 ? 'Subject' : 'Subjects'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              {belowTargetCount > 0 ? 'Below minimum target threshold' : 'All subjects meet attendance target'}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Standard</p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              75.0%
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Official university minimum eligibility
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : attendances.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No courses tracked</h3>
          <p className="text-sm text-slate-500 mt-1">Enroll in subjects to start logging class attendance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attendances.map((att) => {
            const isDanger = att.is_below_target;
            return (
              <div
                key={att.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm transition flex flex-col justify-between ${
                  isDanger
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Subject Tag & Edit */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: att.subject_color }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {att.subject_code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(att)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit Attendance Counts"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subject Name */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-snug truncate">
                    {att.subject_name}
                  </h3>

                  {/* Percentage & Counts */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span
                        className={`text-3xl font-black tracking-tight ${
                          isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {att.percentage}%
                      </span>
                      <span className="text-xs font-semibold text-slate-400 ml-1.5">
                        (target {att.target_percentage}%)
                      </span>
                    </div>

                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {att.classes_attended} / {att.classes_held}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDanger ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(att.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Recovery Warning Box */}
                  {isDanger ? (
                    <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <p className="font-bold">Below Attendance Target!</p>
                        <p className="mt-0.5 leading-relaxed">
                          Attend the next <span className="font-extrabold underline">{att.classes_needed}</span> consecutive classes to reach {att.target_percentage}%.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>On track for exam clearance!</span>
                    </div>
                  )}
                </div>

                {/* Quick Log Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-400">Quick Log:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickMark(att.subject_id, true)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Present</span>
                    </button>
                    <button
                      onClick={() => handleQuickMark(att.subject_id, false)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Minus className="w-3 h-3" />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingAtt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">
                  {editingAtt.subject_code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Update Attendance Record
                </h3>
              </div>
              <button
                onClick={() => setEditingAtt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Total Held
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editHeld}
                    onChange={(e) => setEditHeld(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Classes Attended
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editAttended}
                    onChange={(e) => setEditAttended(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Percentage (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="0.5"
                  required
                  value={editTarget}
                  onChange={(e) => setEditTarget(parseFloat(e.target.value) || 75.0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAtt(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
