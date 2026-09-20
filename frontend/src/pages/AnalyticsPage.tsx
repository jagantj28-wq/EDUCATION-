import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  BarChart3,
  Clock,
  CalendarDays,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/analytics')
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data || !data.has_data) {
    return (
      <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto my-12">
        <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Insufficient Data for Analytics</h2>
        <p className="text-sm text-slate-500 mt-2">
          Start logging assignments, marking attendance, and completing study sessions to generate detailed academic performance insights.
        </p>
      </div>
    );
  }

  const { summary, attendance_chart, assignment_distribution, study_hours_trend, exam_readiness } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Academic Analytics & Performance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Objective data-driven insights into your coursework, study velocity, and exam readiness
        </p>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Enrolled Subjects</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary.total_subjects}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Tasks & Assignments</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{summary.total_assignments}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Scheduled Exams</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{summary.total_exams}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Weekly Study Hours</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{summary.total_study_hours}h</p>
        </div>
      </div>

      {/* Row 1: Attendance & Assignment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance vs Benchmark (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Course-wise Attendance vs 75% Target
              </h3>
              <p className="text-xs text-slate-500">Benchmark eligibility per enrolled subject</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendance_chart} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
                <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="attendance" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assignment Completion Breakdown (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assignment Progress
            </h3>
            <p className="text-xs text-slate-500">Completed vs Pending vs Overdue</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assignment_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assignment_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-center text-xs text-slate-500">
            {summary.completed_assignments} of {summary.total_assignments} assignments completed
          </div>
        </div>
      </div>

      {/* Row 2: Weekly Study Hours & Exam Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Study Hours Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Study Velocity
              </h3>
              <p className="text-xs text-slate-500">Hours spent studying across the past 7 days</p>
            </div>
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={study_hours_trend} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="hours" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="Hours" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exam Preparation Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Exam Preparation Readiness
              </h3>
              <p className="text-xs text-slate-500">Topic mastery & task progress per upcoming exam</p>
            </div>
            <CalendarDays className="w-5 h-5 text-purple-500" />
          </div>

          <div className="space-y-4 pt-2">
            {exam_readiness.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No upcoming exams found.</p>
            ) : (
              exam_readiness.map((e: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{e.exam_title}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({e.subject})</span>
                    </div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {e.progress}% Ready
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${e.progress}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Exam scheduled in {e.days_left <= 0 ? 'today!' : `${e.days_left} days`}
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
