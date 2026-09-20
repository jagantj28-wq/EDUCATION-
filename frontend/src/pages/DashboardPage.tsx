import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckSquare,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Circle,
  Flame,
  Sparkles,
  TrendingUp,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats } from '../types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);

  const fetchDashboard = () => {
    api.get<DashboardStats>('/dashboard')
      .then((res) => setData(res))
      .catch((err) => console.error('Error fetching dashboard:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (taskId: number) => {
    setTogglingTaskId(taskId);
    try {
      await api.patch(`/study-plan/${taskId}/toggle`);
      if (data) {
        const updatedPlan = data.today_plan.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        setData({ ...data, today_plan: updatedPlan });
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    } finally {
      setTogglingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your academic dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Classes",
      value: data?.today_classes ?? 0,
      subtext: 'Scheduled for today',
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/40',
      link: '/subjects'
    },
    {
      title: 'Pending Assignments',
      value: data?.pending_assignments ?? 0,
      subtext: 'Require your attention',
      icon: CheckSquare,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/40',
      link: '/assignments'
    },
    {
      title: 'Upcoming Exams',
      value: data?.upcoming_exams ?? 0,
      subtext: 'Next 30 days',
      icon: CalendarDays,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      border: 'border-purple-100 dark:border-purple-900/40',
      link: '/exams'
    },
    {
      title: 'Overall Attendance',
      value: `${data?.overall_attendance ?? 100}%`,
      subtext: (data?.overall_attendance ?? 100) >= 75 ? 'Above target benchmark' : 'Warning: Below target',
      icon: TrendingUp,
      color: (data?.overall_attendance ?? 100) >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      bg: (data?.overall_attendance ?? 100) >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-rose-50 dark:bg-rose-950/40',
      border: (data?.overall_attendance ?? 100) >= 75 ? 'border-emerald-100 dark:border-emerald-900/40' : 'border-rose-100 dark:border-rose-900/40',
      link: '/attendance'
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-500/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Academic Assistant Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {data?.greeting}, {data?.user_name} 👋
          </h1>
          <p className="mt-1 text-blue-100 text-sm md:text-base font-normal">
            Here's what you need to focus on today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/ai-assistant"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Ask AI Assistant</span>
          </Link>
          <Link
            to="/planner"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold backdrop-blur-sm transition"
          >
            <span>Study Planner</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border ${card.border} shadow-sm hover:shadow-md transition group`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition transform group-hover:translate-x-1" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  {card.title}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {card.subtext}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Today's Plan & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Recommended Plan */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Today's Recommended Plan
                </h2>
                <p className="text-xs text-slate-500">
                  Prioritized by exams, assignments, and attendance
                </p>
              </div>
            </div>
            <Link
              to="/planner"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(!data?.today_plan || data.today_plan.length === 0) ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All tasks completed for today!</p>
                <p className="text-xs text-slate-500 mt-1">Visit the Study Planner to schedule new tasks or generate recommendations.</p>
              </div>
            ) : (
              data.today_plan.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                    task.completed
                      ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-70'
                      : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      disabled={togglingTaskId === task.id}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition flex-shrink-0"
                      title={task.completed ? 'Mark pending' : 'Mark completed'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${task.subject_color || '#3B82F6'}15`,
                            color: task.subject_color || '#3B82F6',
                          }}
                        >
                          {task.subject_name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-semibold text-slate-800 dark:text-slate-200 truncate ${
                          task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{task.duration_minutes}m</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines & Events */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Upcoming
              </h2>
            </div>
            <Link
              to="/assignments"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {(!data?.upcoming_events || data.upcoming_events.length === 0) ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl my-auto">
                <p className="text-sm font-medium text-slate-500">No urgent deadlines approaching</p>
              </div>
            ) : (
              data.upcoming_events.map((evt) => (
                <div
                  key={`${evt.type}-${evt.id}`}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${evt.subject_color}15`,
                          color: evt.subject_color,
                        }}
                      >
                        {evt.subject_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {evt.date}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {evt.title}
                    </p>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl whitespace-nowrap ${
                      evt.badge_text.includes('today') || evt.badge_text.includes('Today') || evt.badge_text.includes('1 day')
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    {evt.badge_text}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/notes"
              className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>Review Lecture Notes & PDFs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mini Performance Charts Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Attendance Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subject-wise Attendance vs 75% Target
            </h3>
            <Link to="/attendance" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Manage
            </Link>
          </div>
          <div className="h-64 w-full">
            {data?.performance?.subject_attendance && data.performance.subject_attendance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.performance.subject_attendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickLine={false} />
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
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                No attendance recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Study Hours Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Study Time (Recent Days)
            </h3>
            <Link to="/analytics" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Detailed Analytics
            </Link>
          </div>
          <div className="h-64 w-full">
            {data?.performance?.study_hours && data.performance.study_hours.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.performance.study_hours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
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
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Complete study tasks to view your study hours trend.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
