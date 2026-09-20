import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.academic import Assignment, Exam, Attendance
from app.models.study_and_ai import Notification
from app.core.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.datetime.utcnow()
    today_date = now.date()

    # Compute dynamic notifications
    generated = []

    # 1. Urgent assignments (due in <= 2 days)
    urgent_asgns = db.query(Assignment).filter(
        Assignment.user_id == current_user.id,
        Assignment.status == "pending",
        Assignment.deadline >= now
    ).all()
    for a in urgent_asgns:
        diff_days = (a.deadline.date() - today_date).days
        if diff_days <= 2:
            time_text = "today" if diff_days == 0 else f"in {diff_days} day{'s' if diff_days > 1 else ''}"
            generated.append({
                "id": f"asgn_{a.id}",
                "title": f"Assignment Due: {a.title}",
                "message": f"{a.subject.name if a.subject else 'General'} assignment is due {time_text}.",
                "type": "warning" if diff_days <= 1 else "info",
                "link": "/assignments",
                "read": False,
                "created_at": a.created_at.isoformat()
            })

    # 2. Low attendance warnings (< 75%)
    low_att = db.query(Attendance).filter(Attendance.user_id == current_user.id).all()
    for att in low_att:
        if att.classes_held > 0 and att.percentage < att.target_percentage:
            generated.append({
                "id": f"att_{att.id}",
                "title": f"Low Attendance Warning: {att.subject.name if att.subject else 'Subject'}",
                "message": f"Your attendance is at {att.percentage}% (target {att.target_percentage}%). Attend next {att.classes_needed_to_target} classes to recover.",
                "type": "alert",
                "link": "/attendance",
                "read": False,
                "created_at": att.updated_at.isoformat() if att.updated_at else now.isoformat()
            })

    # 3. Upcoming exams (<= 3 days)
    urgent_exams = db.query(Exam).filter(
        Exam.user_id == current_user.id,
        Exam.exam_date >= now
    ).all()
    for e in urgent_exams:
        diff_days = (e.exam_date.date() - today_date).days
        if diff_days <= 3:
            time_text = "today!" if diff_days == 0 else f"in {diff_days} day{'s' if diff_days > 1 else ''}"
            generated.append({
                "id": f"exam_{e.id}",
                "title": f"Upcoming Exam: {e.title}",
                "message": f"{e.subject.name if e.subject else 'General'} {e.exam_type} is scheduled {time_text}.",
                "type": "warning",
                "link": "/exams",
                "read": False,
                "created_at": e.created_at.isoformat()
            })

    return generated
