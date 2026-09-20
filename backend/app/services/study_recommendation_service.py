import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.academic import Subject, Assignment, Exam, Attendance
from app.models.study_and_ai import StudyTask


class StudyRecommendationService:
    @staticmethod
    def generate_daily_recommendations(user_id: int, db: Session, target_date: datetime.date = None) -> List[StudyTask]:
        """
        Deterministic recommendation engine calculating academic urgency:
        1. Exam proximity (<= 3 days -> High urgency, <= 7 days -> Medium)
        2. Assignment deadlines (<= 1 day -> High urgency, <= 3 days -> Medium)
        3. Low attendance (< 75% -> Priority boost for revision)
        """
        if target_date is None:
            target_date = datetime.date.today()

        now = datetime.datetime.utcnow()
        today_start = datetime.datetime.combine(target_date, datetime.time.min)
        today_end = datetime.datetime.combine(target_date, datetime.time.max)

        # Check existing tasks for today
        existing_tasks = db.query(StudyTask).filter(
            StudyTask.user_id == user_id,
            StudyTask.scheduled_date >= today_start,
            StudyTask.scheduled_date <= today_end
        ).all()

        if existing_tasks:
            return existing_tasks

        # Gather context
        subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
        if not subjects:
            return []

        exams = db.query(Exam).filter(Exam.user_id == user_id, Exam.exam_date >= now).order_by(Exam.exam_date.asc()).all()
        assignments = db.query(Assignment).filter(
            Assignment.user_id == user_id,
            Assignment.status == "pending",
            Assignment.deadline >= now
        ).order_by(Assignment.deadline.asc()).all()
        attendances = {
            a.subject_id: a for a in db.query(Attendance).filter(Attendance.user_id == user_id).all()
        }

        generated_tasks: List[StudyTask] = []
        covered_subject_ids = set()

        # 1. High Urgency Exams (Within 3 days)
        for ex in exams:
            days_left = (ex.exam_date.date() - target_date).days
            if 0 <= days_left <= 3 and ex.subject_id not in covered_subject_ids:
                topic = f"{ex.subject.name}: Intensive Exam Prep ({ex.title})"
                if ex.syllabus:
                    first_part = ex.syllabus.split('\n')[0][:50]
                    topic = f"{ex.subject.name} — Review: {first_part}"
                
                task = StudyTask(
                    user_id=user_id,
                    subject_id=ex.subject_id,
                    title=topic,
                    description=f"High Priority: Exam scheduled in {days_left} day(s). Focus on core formulas & questions.",
                    scheduled_date=datetime.datetime.combine(target_date, datetime.time(9, 0)),
                    duration_minutes=60,
                    priority="high",
                    completed=False
                )
                generated_tasks.append(task)
                covered_subject_ids.add(ex.subject_id)

        # 2. Urgent Assignments (Due tomorrow or within 2 days)
        for asgn in assignments:
            days_left = (asgn.deadline.date() - target_date).days
            if 0 <= days_left <= 2 and asgn.subject_id not in covered_subject_ids:
                task = StudyTask(
                    user_id=user_id,
                    subject_id=asgn.subject_id,
                    title=f"{asgn.subject.name} — Assignment: {asgn.title}",
                    description=f"Due in {days_left} day(s). Complete problem sets & draft documentation.",
                    scheduled_date=datetime.datetime.combine(target_date, datetime.time(14, 0)),
                    duration_minutes=45,
                    priority="high" if days_left <= 1 else "medium",
                    completed=False
                )
                generated_tasks.append(task)
                covered_subject_ids.add(asgn.subject_id)

        # 3. Medium Urgency Exams (Within 7 days)
        for ex in exams:
            days_left = (ex.exam_date.date() - target_date).days
            if 3 < days_left <= 7 and ex.subject_id not in covered_subject_ids and len(generated_tasks) < 4:
                task = StudyTask(
                    user_id=user_id,
                    subject_id=ex.subject_id,
                    title=f"{ex.subject.name} — Syllabus Revision",
                    description=f"Exam approaching in {days_left} days. Work through textbook notes.",
                    scheduled_date=datetime.datetime.combine(target_date, datetime.time(16, 30)),
                    duration_minutes=45,
                    priority="medium",
                    completed=False
                )
                generated_tasks.append(task)
                covered_subject_ids.add(ex.subject_id)

        # 4. Weak / Low Attendance Subjects (< 75%)
        for s in subjects:
            att = attendances.get(s.id)
            if att and att.is_below_target and s.id not in covered_subject_ids and len(generated_tasks) < 4:
                task = StudyTask(
                    user_id=user_id,
                    subject_id=s.id,
                    title=f"{s.name} — Concept Catch-up",
                    description=f"Attendance at {att.percentage}%. Reinforce missed lecture material.",
                    scheduled_date=datetime.datetime.combine(target_date, datetime.time(19, 0)),
                    duration_minutes=30,
                    priority="medium",
                    completed=False
                )
                generated_tasks.append(task)
                covered_subject_ids.add(s.id)

        # 5. Default General Study Task if student has few deadlines
        if len(generated_tasks) < 2:
            for s in subjects:
                if s.id not in covered_subject_ids and len(generated_tasks) < 3:
                    task = StudyTask(
                        user_id=user_id,
                        subject_id=s.id,
                        title=f"{s.name} — Daily Review & Practice",
                        description="Regular spaced repetition and review of recent chapter concepts.",
                        scheduled_date=datetime.datetime.combine(target_date, datetime.time(17, 0)),
                        duration_minutes=30,
                        priority="low",
                        completed=False
                    )
                    generated_tasks.append(task)
                    covered_subject_ids.add(s.id)

        # Save generated tasks to database
        for t in generated_tasks:
            db.add(t)
        db.commit()

        # Return refreshed tasks
        for t in generated_tasks:
            db.refresh(t)

        return generated_tasks
