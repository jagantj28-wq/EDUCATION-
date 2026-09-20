# 🎓 LifeDesk — AI-Powered Personal Academic Assistant

> **LifeDesk** is a modern, responsive full-stack SaaS web application designed to empower college students to master their academics. It centralizes subjects, class timetables, assignments, exam schedules, attendance tracking with threshold warnings, automated smart study planning, lecture note/PDF processing, and grounded AI study tools (summarization, document Q&A, and auto-generated MCQ practice quizzes).

---

## 🌟 Key Highlights & Capabilities

1. **📊 Executive Dashboard**
   - Live KPI overview (overall attendance %, upcoming assignments, imminent exams, today's schedule).
   - Priority alerts banner for exams within 3 days and attendance falling below academic criteria.
   - Quick action shortcuts (Schedule Exam, Add Assignment, AI Chat, Upload Notes).

2. **📚 Subject & Timetable Hub**
   - Manage courses with professor contact details, course codes, custom color codes, and credits.
   - Weekly timetable schedule view for lecture timing and classroom locations.
   - Course detail drill-down showing all linked assignments, exams, notes, and attendance rates.

3. **✅ Assignment Tracker**
   - Full lifecycle management: `Pending`, `In Progress`, `Completed`.
   - Priority grading (`High`, `Medium`, `Low`) with automatic deadline countdowns and overdue indicators.

4. **🎯 Exam Countdown & Syllabus Explorer**
   - Midterm, Final, Quiz, and Practical exam trackers with color-coded subject tags.
   - Prominent days-until-exam countdown and collapsible syllabus viewer.

5. **📈 Smart Attendance Calculator**
   - Live subject-by-subject attendance percentages with safety threshold indicator (e.g. 75%).
   - Dynamic formula: Calculates exact number of consecutive classes required to reach or restore your target attendance.
   - Quick 1-click **Present / Absent / Cancelled** logging.

6. **🧠 Automated AI Study Planner**
   - Deterministic recommendation engine analyzing upcoming exams, impending assignment deadlines, and low-attendance subjects.
   - Daily and weekly planning board with task completion toggles and estimated study durations.

7. **📄 Notes & PDF Material Hub**
   - In-app text extraction for lecture slides and study notes using `pypdf`.
   - One-click AI summarization and instant document question answering.

8. **🤖 AI Academic Assistant**
   - **Grounded Q&A**: Ask questions grounded directly on uploaded study materials or lecture notes.
   - **Note Summarizer**: Generate bulleted key takeaways, core definitions, and formulas.
   - **MCQ Practice Quizzes**: Auto-generate multiple-choice quizzes with randomized questions, options, explanations, and immediate score feedback.
   - Intelligent dual-mode engine: Integrates with Google Gemini / OpenAI, with an offline academic heuristic engine when API keys are not supplied.

9. **📊 Visual Academic Analytics**
   - Attendance distribution comparison charts across all courses.
   - Assignment completion velocity and study hours distribution powered by Recharts.

10. **🌓 Dark Mode & Accessibility**
    - Seamless switching between Light, Dark, and System appearance.
    - Fully responsive across mobile (360px+), tablet, and desktop viewports.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom academic palette and dark mode
- **Routing**: React Router v6
- **Data Visualizations**: Recharts
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Database**: SQLAlchemy 2.0 with automatic SQLite fallback / PostgreSQL support
- **Schema Validation**: Pydantic v2
- **Authentication**: JWT tokens (HMAC-SHA256) with bcrypt password hashing
- **PDF Extraction**: `pypdf`
- **Testing**: Pytest with automated in-memory SQLite fixtures

---

## 📁 Repository Structure

```
EDUCATION-/
├── docker-compose.yml          # PostgreSQL 16 local container configuration
├── .env.example                # Template environment variables
├── .gitignore                  # Git ignore rules for Python, Node, and environments
├── PROJECT_PLAN.md             # Development plan and roadmap
├── README.md                   # Repository documentation
├── backend/
│   ├── requirements.txt        # Python production & test dependencies
│   ├── pytest.ini             # Pytest suite configuration
│   ├── .env.example            # Backend environment template
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint, CORS, lifespan, routes
│   │   ├── core/               # App configuration, JWT security, password hashing
│   │   ├── database/           # SQLAlchemy session engine & Base model
│   │   ├── models/             # ORM entities (User, Subject, Assignment, Exam, etc.)
│   │   ├── schemas/            # Pydantic request/response validation schemas
│   │   ├── services/           # AI Engine (Gemini/fallback) & Study Recommendations
│   │   └── routes/             # 12 Modular REST API routers
│   ├── scripts/
│   │   └── seed.py             # Database seeder with realistic collegiate demo data
│   └── tests/                  # Integration & unit test suites (12 tests)
└── frontend/
    ├── package.json            # Frontend dependencies and npm scripts
    ├── vite.config.ts          # Vite bundler configuration
    ├── tsconfig.json           # TypeScript strict configuration
    ├── tailwind.config.js      # Tailwind CSS theme setup
    ├── index.html              # HTML entrypoint
    └── src/
        ├── types/              # Unified TypeScript domain definitions
        ├── services/           # Typed API HTTP client
        ├── context/            # AuthContext & ThemeContext
        ├── layouts/            # Dashboard layout with desktop & mobile nav
        ├── components/         # Reusable modals, badges, protected routes
        └── pages/              # 10 full-featured application pages
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js LTS (v18+ or v20+)** and **npm**
- *(Optional)* **Docker & Docker Compose** for PostgreSQL

---

### 1. Backend Setup

1. Open a terminal in the `backend/` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your local environment file:
   ```bash
   # Windows
   copy .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```
   *(By default, `DATABASE_URL` uses SQLite (`sqlite:///./lifedesk.db`) so no database setup is required to run immediately).*

5. Seed the database with realistic demo courses, assignments, exams, and attendance:
   ```bash
   python scripts/seed.py
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API running at: `http://localhost:8000`
   - Interactive Swagger docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

1. In a new terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Web application available at: `http://localhost:5173`

---

## 🔑 Demo Account Credentials

A pre-populated demo account is automatically provisioned by `python scripts/seed.py`:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Demo Student** | `jagan@university.edu` | `DemoPass123!` |

*(You can also click **Create an account** on the login page to register a fresh student profile).*

---

## 🧪 Running Automated Tests

The backend includes comprehensive integration tests verifying JWT authentication, subject CRUD, attendance percentage formulas, deadline algorithms, study recommendations, and AI endpoints:

```bash
cd backend
pytest -v
```

All 12 test suites execute in-memory with zero side-effects to your local database:
```
tests/test_academic.py::test_subject_crud PASSED
tests/test_academic.py::test_assignment_workflow PASSED
tests/test_academic.py::test_attendance_calculation PASSED
tests/test_academic.py::test_recommendation_and_dashboard PASSED
tests/test_academic.py::test_ai_chat_and_summarize PASSED
tests/test_auth.py::test_register_user_success PASSED
tests/test_auth.py::test_register_duplicate_email PASSED
tests/test_auth.py::test_register_password_mismatch PASSED
tests/test_auth.py::test_login_success_and_me_endpoint PASSED
tests/test_auth.py::test_login_invalid_password PASSED
tests/test_auth.py::test_me_unauthorized PASSED
tests/test_health.py::test_health_check PASSED
```

To verify the frontend TypeScript and production build:
```bash
cd frontend
npm run build
```

---

## 🐳 Optional: PostgreSQL with Docker Compose

If you prefer running a dedicated PostgreSQL container instead of SQLite:

1. Launch PostgreSQL via Docker Compose from the root directory:
   ```bash
   docker compose up -d
   ```
2. In `backend/.env`, set:
   ```env
   DATABASE_URL=postgresql://lifedesk:lifedesk_secret@localhost:5432/lifedesk_db
   ```
3. Run the seed script:
   ```bash
   python scripts/seed.py
   ```

---

## 🔒 Security & Privacy

- **Password Security**: Passwords are never stored in plaintext; salted and hashed using `bcrypt`.
- **Stateless Authentication**: Protected API endpoints enforce JWT bearer tokens with standard expiration.
- **Tenant Isolation**: All database queries strictly scope records by `user_id` to guarantee multi-student data privacy.
- **Upload Safety**: PDF and text notes are validated and isolated in a user-specific storage directory.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
