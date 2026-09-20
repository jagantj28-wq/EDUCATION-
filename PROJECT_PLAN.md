# LifeDesk — AI-Powered Student Assistant
## Project Roadmap & Implementation Plan

LifeDesk is a personal academic assistant web application designed for college students to manage subjects, classes, assignments, exams, attendance, study schedules, notes/PDFs, AI summarization, quizzes, and academic performance tracking.

---

### Phase Roadmap

#### Phase 1: Project Setup & Environment Architecture
- **Backend Setup**:
  - FastAPI modular application structure (`backend/app/main.py`, `core/`, `models/`, `schemas/`, `routes/`, `services/`, `database/`).
  - Database layer with SQLAlchemy (supporting PostgreSQL with seamless fallback/support for SQLite for instant out-of-the-box local testing).
  - Pydantic v2 settings configuration (`core/config.py`).
  - CORS, error handling middleware, logging.
  - Docker Compose configuration for PostgreSQL.
  - Verification with automated tests and healthcheck endpoint.
- **Frontend Setup**:
  - React + TypeScript + Vite project.
  - Tailwind CSS setup with custom theme variables, typography, and dark/light mode classes.
  - React Router v6 DOM setup with routes and responsive layout shell.
  - Lucide React icon integration, Axios/fetch client configuration.
  - Package builds and verified clean runs.

#### Phase 2: Authentication & User Management
- User database schema with bcrypt password hashing (`passlib`/`bcrypt`).
- JWT authentication (`access_token`, expiry, user payload).
- Backend endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.
- Frontend Auth Context / Store with token persistence in localStorage and automatic header injection.
- UI: Registration form, Login form with client-side validation, error handling, password reveal, protected route wrappers.
- Authorization tests & security verification.

#### Phase 3: Core Academic Management (Subjects, Assignments, Exams, Attendance)
- Models & Schemas:
  - `Subject` (name, code, teacher, credits, color, user_id).
  - `ClassSchedule` (day_of_week, start_time, end_time, room).
  - `Assignment` (title, description, deadline, priority, status).
  - `Exam` (title, exam_date, exam_type, syllabus).
  - `Attendance` (classes_held, classes_attended, target_percentage, attendance_percentage calculation).
- REST Endpoints with full CRUD and user tenancy isolation.
- Frontend pages & interactive components:
  - Subjects view (card grid, color badges, creation modal, detail view).
  - Assignments view (status filters, priority tags, "Due in X days" / "Overdue" badges, mark completed toggle).
  - Exams view (upcoming list, countdown badges, syllabus modal).
  - Attendance tracker (percentage rings, warning alerts for < 75%, class catch-up calculator: consecutive classes needed to hit target).

#### Phase 4: Main Dashboard
- High-impact dashboard layout:
  - Top greeting: "Good morning/afternoon, {Name} 👋 — Here's what you need to focus on today."
  - Metric summary cards: Today's Classes, Pending Assignments, Upcoming Exams, Overall Attendance.
  - Today's Plan widget: actionable tasks with checkboxes, priority badges, duration.
  - Upcoming events & deadlines timeline.
  - Quick performance preview with mini charts.

#### Phase 5: Study Planner & Smart Recommendation Engine
- Models: `StudyTask` and `StudySession`.
- `StudyRecommendationService`:
  - Algorithmic prioritization based on exam proximity (<=3 days high, <=7 days medium), assignment deadlines, low attendance warnings, and weak subjects.
  - Generates recommended daily study schedules with suggested time blocks and durations.
- Daily & Weekly planner UI with drag/drop or easy time slot assignment, completion checkboxes, and task creation.

#### Phase 6: Notes & PDF Processing Module
- Models: `Note` (title, file_name, file_path, extracted_text).
- Secure file upload handling (`.pdf`, `.txt`) with mime-type validation and size limits (max 15MB).
- Text extraction pipeline using `pypdf` for PDFs.
- Note reader UI: split-view showing extracted content, metadata, and quick action bar (Summarize, Generate Quiz, Ask AI).

#### Phase 7: AI Assistant, Summarizer & Quiz Generator
- `AIService` abstraction layer:
  - Supports configurable providers (`gemini`, `openai`, `anthropic`, and an offline smart fallback provider for testing without API keys).
- Features:
  - **AI Chat**: Context-aware academic assistant. Answers general questions or retrieves relevant snippets from uploaded notes for note-grounded Q&A.
  - **AI Summarizer**: Extracts short summary, core concepts, key definitions, formulas, and exam-focused points. Persists summary to database.
  - **AI Quiz Generator**: Generates MCQs (question, 4 options, correct answer, explanation).
  - **Quiz Taking Interface**: Interactive multi-step quiz interface with instant feedback, final score card, review of correct/incorrect answers and explanations.

#### Phase 8: Academic Analytics
- Recharts visualizations:
  - Subject-wise attendance bar chart against target benchmark.
  - Subject-wise marks / performance distribution.
  - Daily & weekly study hours trend.
  - Assignment completion ratio (completed vs overdue vs pending).
  - Exam readiness index.
  - Graceful empty states when data is fresh.

#### Phase 9: In-App Notifications System
- Model: `Notification` (type, title, message, read status, link, created_at).
- Automatic triggers:
  - Assignments due within 24–48 hours.
  - Attendance drops below configurable threshold (default 75%).
  - Exams scheduled within 3 days.
- In-app notification bell with popover dropdown, unread counter, and mark-as-read actions.

#### Phase 10: Polish, Production Readiness & Documentation
- Theme switcher (Dark / Light / System) with persistence.
- Responsive mobile layout (collapsible sidebar, bottom navigation for mobile, verified at 360px, 768px, 1024px, 1440px).
- Realistic seed data script (`backend/scripts/seed.py`) with sample subjects, assignments, notes, and attendance.
- Comprehensive `README.md` with architecture diagram, setup instructions, and API docs.
- Test suite passing backend and frontend linting/typechecks.
