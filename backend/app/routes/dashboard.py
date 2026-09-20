import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.academic import Subject, Assignment, Exam, Attendance, ClassSchedule
from app.models.study_and_ai import StudyTask, StudySession
from app.schemas.dashboard import (
    DashboardStatsResponse,
    UpcomingEventItem,
    SubjectAttendanceStat,
    StudyHoursStat,
    PerformanceStats,
)
from app.schemas.study import StudyTaskResponse
from app.services.study_recommendation_service import StudyRecommendationService
from app.core.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _get_time_greeting() -> str:
    hour = datetime.datetime.now().hour
    if 5 <= hour < 12:
        return "Good morning"
    elif 12 <= hour < 17:
        return "Good afternoon"
    else:
        return "Good evening"


@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.datetime.utcnow()
    today_date = now.date()
    today_weekday = today_date.strftime("%A")

    # 1. Today's Classes
    today_classes_count = db.query(ClassSchedule).filter(
        ClassSchedule.user_id == current_user.id,
        ClassSchedule.day_of_week.ilike(today_weekday)
    ).count()

    # 2. Pending Assignments
    pending_assignments_count = db.query(Assignment).filter(
        Assignment.user_id == current_user.id,
        Assignment.status == "pending"
    ).count()

    # 3. Upcoming Exams (within next 30 days)
    upcoming_exams_count = db.query(Exam).filter(
        Exam.user_id == current_user.id,
        Exam.exam_date >= now
    ).count()

    # 4. Overall Attendance Percentage
    attendances = db.query(Attendance).filter(Attendance.user_id == current_user.id).all()
    if attendances:
        total_held = sum(a.classes_held for a in attendances)
        total_attended = sum(a.classes_attended for a in attendances)
        overall_attendance = round((total_attended / total_held * 100), 1) if total_held > 0 else 100.0
    else:
        overall_attendance = 100.0

    # 5. Today's Plan Tasks
    plan_tasks = StudyRecommendationService.generate_daily_recommendations(current_user.id, db, today_date)
    formatted_plan = []
    for t in plan_tasks:
        s_name = t.subject.name if t.subject else "General"
        s_color = t.subject.color if t.subject else "#3B82F6"
        formatted_plan.append(
            StudyTaskResponse(
                id=t.id,
                user_id=t.user_id,
                subject_id=t.subject_id,
                title=t.title,
                description=t.description,
                scheduled_date=t.scheduled_date,
                duration_minutes=t.duration_minutes,
                priority=t.priority,
                completed=t.completed,
                created_at=t.created_at,
                subject_name=s_name,
                subject_color=s_color
            )
        )

    # 6. Upcoming Events (Merged & Sorted: Assignments & Exams)
    upcoming_events = []

    assignments = db.query(Assignment).filter(
        Assignment.user_id == current_user.id,
        Assignment.status == "pending",
        Assignment.deadline >= now
    ).order_by(Assignment.deadline.asc()).limit(5).all()

    for a in assignments:
        diff_days = (a.deadline.date() - today_date).days
        badge = "Due today" if diff_days == 0 else f"Due in {diff_days} day{'s' if diff_days != 1 else ''}"
        upcoming_events.append(
            UpcomingEventItem(
                id=a.id,
                title=a.title,
                type="assignment",
                date=a.deadline.strftime("%b %d, %I:%M %p"),
                badge_text=badge,
                subject_name=a.subject.name if a.subject else "General",
                subject_color=a.subject.color if a.subject else "#3B82F6"
            )
        )

    exams = db.query(Exam).filter(
        Exam.user_id == current_user.id,
        Exam.exam_date >= now
    ).order_by(Exam.exam_date.asc()).limit(5).all()

    for e in exams:
        diff_days = (e.exam_date.date() - today_date).days
        badge = "Today" if diff_days == 0 else f"In {diff_days} day{'s' if diff_days != 1 else ''}"
        upcoming_events.append(
            UpcomingEventItem(
                id=e.id,
                title=f"{e.exam_type}: {e.title}",
                type="exam",
                date=e.exam_date.strftime("%b %d, %Y"),
                badge_text=badge,
                subject_name=e.subject.name if e.subject else "General",
                subject_color=e.subject.color if e.subject else "#8B5CF6"
            )
        )

    # 7. Performance Charts
    subject_attendance_data = [
        SubjectAttendanceStat(
            name=a.subject.code if a.subject else "SUB",
            attendance=a.percentage,
            target=a.target_percentage
        )
        for a in attendances
    ]

    # Weekly Study Hours (Last 7 days)
    weekdays_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    study_hours_data = []
    for i in range(6, -1, -1):
        day = today_date - datetime.timedelta(days=i)
        day_label = day.strftime("%a")
        # Sum completed tasks minutes / 60
        day_start = datetime.datetime.combine(day, datetime.time.min)
        day_end = datetime.datetime.combine(day, datetime.time.max)
        day_tasks = db.query(StudyTask).filter(
            StudyTask.user_id == current_user.id,
            StudyTask.completed == True,
            StudyTask.scheduled_date >= day_start,
            StudyTask.scheduled_date <= day_end
        ).all()
        hours = sum(t.duration_minutes for t in day_tasks) / 60.0
        study_hours_data.append(StudyHoursStat(day=day_label, hours=round(hours, 1)))

    return DashboardStatsResponse(
        greeting=_get_time_greeting(),
        subtitle="Here's what you need to focus on today.",
        user_name=current_user.name.split()[0] if current_user.name else "Student",
        today_classes=today_classes_count,
        pending_assignments=pending_assignments_count,
        upcoming_exams=upcoming_exams_count,
        overall_attendance=overall_attendance,
        today_plan=formatted_plan,
        upcoming_events=upcoming_events,
        performance=PerformanceStats(
            subject_attendance=subject_attendance_data,
            study_hours=study_hours_data
        )
    )
