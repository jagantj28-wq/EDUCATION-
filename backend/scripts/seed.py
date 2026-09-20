"""
LifeDesk Development Seed Script
Populates the database with realistic sample subjects, assignments, exams, attendance,
and study tasks for demo/testing purposes.
"""
import sys
import os
import datetime

# Ensure utf-8 stdout
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal, Base, engine
from app.models.user import User
from app.models.academic import Subject, Assignment, Exam, Attendance, ClassSchedule
from app.models.study_and_ai import StudyTask, Note
from app.core.security import hash_password


def seed_data():
    print("[*] Initializing LifeDesk Development Seed Data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if demo user exists
        demo_email = "jagan@university.edu"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            user = User(
                name="Jagan",
                email=demo_email,
                password_hash=hash_password("DemoPass123!")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[+] Created demo student account: {demo_email} (Password: DemoPass123!)")
        else:
            print(f"[*] Demo user {demo_email} already exists. Populating coursework...")

        # Subjects definition
        subjects_data = [
            {"name": "Operating Systems", "code": "CS301", "teacher": "Dr. Aris Thorne", "credits": 4, "color": "#3B82F6"},
            {"name": "Database Management Systems", "code": "CS302", "teacher": "Prof. Elena Rostova", "credits": 4, "color": "#10B981"},
            {"name": "Computer Networks", "code": "CS303", "teacher": "Dr. Marcus Vance", "credits": 3, "color": "#F59E0B"},
            {"name": "Mathematics & Discrete Structures", "code": "MATH201", "teacher": "Dr. Sarah Chen", "credits": 4, "color": "#8B5CF6"},
            {"name": "Software Engineering", "code": "CS305", "teacher": "Prof. David Miller", "credits": 3, "color": "#EC4899"},
        ]

        created_subjects = {}
        for s_data in subjects_data:
            s = db.query(Subject).filter(Subject.code == s_data["code"], Subject.user_id == user.id).first()
            if not s:
                s = Subject(user_id=user.id, **s_data)
                db.add(s)
                db.commit()
                db.refresh(s)
            created_subjects[s_data["code"]] = s

        print(f"[+] Configured {len(created_subjects)} core subjects.")

        # Attendance setup
        attendance_configs = {
            "CS301": {"held": 48, "attended": 42, "target": 75.0},  # 87.5%
            "CS302": {"held": 40, "attended": 36, "target": 75.0},  # 90.0%
            "CS303": {"held": 36, "attended": 24, "target": 75.0},  # 66.7% (Under target!)
            "MATH201": {"held": 50, "attended": 46, "target": 75.0}, # 92.0%
            "CS305": {"held": 30, "attended": 27, "target": 75.0},  # 90.0%
        }

        for code, att_cfg in attendance_configs.items():
            s = created_subjects[code]
            att = db.query(Attendance).filter(Attendance.subject_id == s.id, Attendance.user_id == user.id).first()
            if not att:
                att = Attendance(
                    user_id=user.id,
                    subject_id=s.id,
                    classes_held=att_cfg["held"],
                    classes_attended=att_cfg["attended"],
                    target_percentage=att_cfg["target"]
                )
                db.add(att)
            else:
                att.classes_held = att_cfg["held"]
                att.classes_attended = att_cfg["attended"]
                att.target_percentage = att_cfg["target"]
        db.commit()
        print("[+] Configured subject attendance records.")

        # Class Schedules
        schedules_data = [
            {"code": "CS301", "day": "Monday", "start": "09:00", "end": "10:00", "room": "LH-101"},
            {"code": "CS302", "day": "Monday", "start": "11:00", "end": "12:00", "room": "Lab-2"},
            {"code": "CS303", "day": "Tuesday", "start": "10:00", "end": "11:00", "room": "LH-104"},
            {"code": "MATH201", "day": "Wednesday", "start": "09:00", "end": "10:30", "room": "LH-201"},
            {"code": "CS305", "day": "Thursday", "start": "14:00", "end": "15:30", "room": "LH-102"},
        ]
        for sch in schedules_data:
            s = created_subjects[sch["code"]]
            existing = db.query(ClassSchedule).filter(
                ClassSchedule.subject_id == s.id,
                ClassSchedule.day_of_week == sch["day"],
                ClassSchedule.user_id == user.id
            ).first()
            if not existing:
                cs = ClassSchedule(
                    user_id=user.id,
                    subject_id=s.id,
                    day_of_week=sch["day"],
                    start_time=sch["start"],
                    end_time=sch["end"],
                    room=sch["room"]
                )
                db.add(cs)
        db.commit()

        # Assignments
        now = datetime.datetime.utcnow()
        assignments_data = [
            {
                "code": "CS301",
                "title": "Deadlock Avoidance & Banker's Algorithm Simulation",
                "description": "Implement the multi-resource safety algorithm and test deadlock detection matrices.",
                "deadline": now + datetime.timedelta(days=2),
                "priority": "high",
                "status": "pending"
            },
            {
                "code": "CS302",
                "title": "Database Normalization & ER Diagram Modeling",
                "description": "Decompose unnormalized relations into 3NF and BCNF with functional dependency proofs.",
                "deadline": now + datetime.timedelta(days=5),
                "priority": "medium",
                "status": "pending"
            },
            {
                "code": "CS303",
                "title": "Socket Programming: Multi-client Chat Server",
                "description": "Build asynchronous TCP socket server handling simultaneous client broadcasts.",
                "deadline": now + datetime.timedelta(days=8),
                "priority": "medium",
                "status": "pending"
            },
            {
                "code": "MATH201",
                "title": "Discrete Probability & Combinatorics Problem Set",
                "description": "Solve Bayes' Theorem exercises and recurrence relation proofs.",
                "deadline": now - datetime.timedelta(days=1),
                "priority": "high",
                "status": "completed"
            },
        ]
        for a_data in assignments_data:
            s = created_subjects[a_data["code"]]
            existing = db.query(Assignment).filter(Assignment.title == a_data["title"], Assignment.user_id == user.id).first()
            if not existing:
                asgn = Assignment(
                    user_id=user.id,
                    subject_id=s.id,
                    title=a_data["title"],
                    description=a_data["description"],
                    deadline=a_data["deadline"],
                    priority=a_data["priority"],
                    status=a_data["status"]
                )
                db.add(asgn)
        db.commit()
        print("[+] Configured realistic student assignments.")

        # Exams
        exams_data = [
            {
                "code": "CS302",
                "title": "DBMS Midterm Examination",
                "date": now + datetime.timedelta(days=4),
                "type": "Midterm",
                "syllabus": "Relational Algebra, SQL Joins, Indexing (B+ Trees), Transactions & ACID properties, Normalization (1NF, 2NF, 3NF, BCNF)."
            },
            {
                "code": "CS301",
                "title": "Operating Systems Midterm",
                "date": now + datetime.timedelta(days=9),
                "type": "Midterm",
                "syllabus": "Process Synchronization (Semaphores, Mutex), CPU Scheduling algorithms, Deadlock prevention and Banker's algorithm."
            },
            {
                "code": "MATH201",
                "title": "Discrete Mathematics Quiz 2",
                "date": now + datetime.timedelta(days=15),
                "type": "Quiz",
                "syllabus": "Graph Theory, Eulerian and Hamiltonian paths, Tree traversals, Recurrence relations."
            },
        ]
        for e_data in exams_data:
            s = created_subjects[e_data["code"]]
            existing = db.query(Exam).filter(Exam.title == e_data["title"], Exam.user_id == user.id).first()
            if not existing:
                ex = Exam(
                    user_id=user.id,
                    subject_id=s.id,
                    title=e_data["title"],
                    exam_date=e_data["date"],
                    exam_type=e_data["type"],
                    syllabus=e_data["syllabus"]
                )
                db.add(ex)
        db.commit()
        print("[+] Configured upcoming exam countdowns.")

        # Sample Notes
        sample_note_text = (
            "OPERATING SYSTEMS LECTURE 14: DEADLOCKS AND RESOURCE MANAGEMENT\n\n"
            "Definition of Deadlock:\n"
            "A process in operating systems is in deadlock when it is waiting on an event that only another blocked process can cause.\n\n"
            "Coffman Conditions:\n"
            "1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.\n"
            "2. Hold and Wait: A process must hold at least one resource and wait for other resources held by others.\n"
            "3. No Preemption: Resources cannot be preempted; only released voluntarily.\n"
            "4. Circular Wait: A closed chain of processes exist with each waiting for a resource held by the next.\n\n"
            "Banker's Algorithm Formula:\n"
            "Need[i, j] = Max[i, j] - Allocation[i, j]\n"
            "A system is in a safe state if there exists at least one safe execution sequence.\n"
        )
        s_os = created_subjects["CS301"]
        existing_note = db.query(Note).filter(Note.title == "OS Unit 3 - Deadlocks & Synchronization", Note.user_id == user.id).first()
        if not existing_note:
            note = Note(
                user_id=user.id,
                subject_id=s_os.id,
                title="OS Unit 3 - Deadlocks & Synchronization",
                file_name="OS_Lecture_14_Deadlocks.txt",
                file_path="./uploads/OS_Lecture_14_Deadlocks.txt",
                extracted_text=sample_note_text,
                summary=(
                    "Detailed coverage of Deadlock fundamentals, the 4 Coffman conditions "
                    "(Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait), and Banker's Algorithm "
                    "with safety matrix verification."
                )
            )
            db.add(note)
            db.commit()
            print("[+] Created sample lecture note for AI summarization & quiz generation.")

        print("\n[*] Seed complete! You can now log into LifeDesk using:")
        print(f"    Email:    {demo_email}")
        print("    Password: DemoPass123!\n")

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
