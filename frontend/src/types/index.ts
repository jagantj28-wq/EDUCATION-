export type Priority = 'low' | 'medium' | 'high';
export type AssignmentStatus = 'pending' | 'completed';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Subject {
  id: number;
  user_id: number;
  name: string;
  code: string;
  teacher?: string;
  credits: number;
  color: string;
  created_at: string;
  attendance_percentage?: number;
  pending_assignments_count?: number;
}

export interface ClassSchedule {
  id: number;
  user_id: number;
  subject_id: number;
  subject_name?: string;
  subject_color?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface Assignment {
  id: number;
  user_id: number;
  subject_id: number;
  subject_name?: string;
  subject_color?: string;
  title: string;
  description?: string;
  deadline: string;
  priority: Priority;
  status: AssignmentStatus;
  created_at: string;
  is_overdue?: boolean;
  due_in_days?: number;
}

export interface Exam {
  id: number;
  user_id: number;
  subject_id: number;
  subject_name?: string;
  subject_color?: string;
  title: string;
  exam_date: string;
  exam_type: string;
  syllabus?: string;
  created_at: string;
  days_until_exam?: number;
}

export interface Attendance {
  id: number;
  user_id: number;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  subject_color?: string;
  classes_held: number;
  classes_attended: number;
  percentage: number;
  target_percentage?: number;
  classes_needed?: number;
  is_below_target?: boolean;
  updated_at: string;
}

export interface StudyTask {
  id: number;
  user_id: number;
  subject_id?: number;
  subject_name?: string;
  subject_color?: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  priority: Priority;
  completed: boolean;
}

export interface Note {
  id: number;
  user_id: number;
  subject_id?: number;
  subject_name?: string;
  title: string;
  file_name: string;
  file_path: string;
  extracted_text?: string;
  summary?: string;
  created_at: string;
}

export interface QuizQuestion {
  id?: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface Quiz {
  id: number;
  user_id: number;
  subject_id?: number;
  subject_name?: string;
  title: string;
  created_at: string;
  questions: QuizQuestion[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  read: boolean;
  link?: string;
  created_at: string;
}

export interface DashboardStats {
  greeting: string;
  user_name: string;
  today_classes: number;
  pending_assignments: number;
  upcoming_exams: number;
  overall_attendance: number;
  today_plan: StudyTask[];
  upcoming_events: {
    id: number;
    title: string;
    type: 'assignment' | 'exam';
    date: string;
    badge_text: string;
    subject_name: string;
    subject_color: string;
  }[];
  performance: {
    subject_attendance: { name: string; attendance: number; target: number }[];
    study_hours: { day: string; hours: number }[];
  };
}
