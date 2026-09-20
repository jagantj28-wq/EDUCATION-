import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.academic import Subject, Assignment, Exam, Attendance
from app.models.study_and_ai import StudyTask
from app.core.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    now = datetime.datetime.utcnow()
    today_date = now.date()

    # 1. Subject-wise attendance
    attendances = db.query(Attendance).filter(Attendance.user_id == current_user.id).all()
    attendance_data = [
        {
            "subject": a.subject.name if a.subject else "General",
            "code": a.subject.code if a.subject else "GEN",
            "attendance": a.percentage,
            "target": a.target_percentage,
            "classes_held": a.classes_held,
            "classes_attended": a.classes_attended,
            "color": a.subject.color if a.subject else "#3B82F6"
        }
        for a in attendances
    ]

    # 2. Assignment completion
    assignments = db.query(Assignment).filter(Assignment.user_id == current_user.id).all()
    completed_count = sum(1 for a in assignments if a.status == "completed")
    pending_count = sum(1 for a in assignments if a.status == "pending" and a.deadline >= now)
    overdue_count = sum(1 for a in assignments if a.status == "pending" and a.deadline < now)

    assignment_distribution = [
        {"name": "Completed", "value": completed_count, "color": "#10B981"},
        {"name": "Pending", "value": pending_count, "color": "#3B82F6"},
        {"name": "Overdue", "value": overdue_count, "color": "#EF4444"},
    ]

    # 3. Weekly study hours trend
    study_hours_trend = []
    for i in range(6, -1, -1):
        day = today_date - datetime.timedelta(days=i)
        day_start = datetime.datetime.combine(day, datetime.time.min)
        day_end = datetime.datetime.combine(day, datetime.time.max)
        tasks = db.query(StudyTask).filter(
            StudyTask.user_id == current_user.id,
            StudyTask.completed == True,
            StudyTask.scheduled_date >= day_start,
            StudyTask.scheduled_date <= day_end
        ).all()
        hours = sum(t.duration_minutes for t in tasks) / 60.0
        study_hours_trend.append({
            "day": day.strftime("%a"),
            "date": day.strftime("%b %d"),
            "hours": round(hours, 1)
        })

    # 4. Subject Credits distribution
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    subject_credits = [
        {
            "name": s.name,
            "code": s.code,
            "credits": s.credits,
            "color": s.color
        }
        for s in subjects
    ]

    # 5. Exam Preparation Readiness
    exams = db.query(Exam).filter(Exam.user_id == current_user.id, Exam.exam_date >= now).all()
    exam_readiness = []
    for e in exams:
        diff_days = (e.exam_date.date() - today_date).days
        # Completed study tasks for this subject
        related_tasks = db.query(StudyTask).filter(
            StudyTask.user_id == current_user.id,
            StudyTask.subject_id == e.subject_id
        ).all()
        total_tasks = len(related_tasks)
        done_tasks = sum(1 for t in related_tasks if t.completed)
        progress = round((done_tasks / total_tasks * 100), 1) if total_tasks > 0 else (50.0 if diff_days > 7 else 25.0)

        exam_readiness.append({
            "exam_title": e.title,
            "subject": e.subject.name if e.subject else "General",
            "days_left": diff_days,
            "progress": min(progress, 100.0)
        })

    has_data = bool(attendances or assignments or subjects or exams)

    return {
        "has_data": has_data,
        "attendance_chart": attendance_data,
        "assignment_distribution": assignment_distribution,
        "study_hours_trend": study_hours_trend,
        "subject_credits": subject_credits,
        "exam_readiness": exam_readiness,
        "summary": {
            "total_subjects": len(subjects),
            "total_assignments": len(assignments),
            "completed_assignments": completed_count,
            "total_exams": len(exams),
            "total_study_hours": round(sum(d["hours"] for d in study_hours_trend), 1)
        }
    }
