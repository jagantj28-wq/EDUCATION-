from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.study import StudyTaskResponse


class UpcomingEventItem(BaseModel):
    id: int
    title: str
    type: str  # 'assignment' | 'exam'
    date: str
    badge_text: str
    subject_name: str
    subject_color: str


class SubjectAttendanceStat(BaseModel):
    name: str
    attendance: float
    target: float


class StudyHoursStat(BaseModel):
    day: str
    hours: float


class PerformanceStats(BaseModel):
    subject_attendance: List[SubjectAttendanceStat]
    study_hours: List[StudyHoursStat]


class DashboardStatsResponse(BaseModel):
    greeting: str
    subtitle: str = "Here's what you need to focus on today."
    user_name: str
    today_classes: int
    pending_assignments: int
    upcoming_exams: int
    overall_attendance: float
    today_plan: List[StudyTaskResponse]
    upcoming_events: List[UpcomingEventItem]
    performance: PerformanceStats

    model_config = ConfigDict(from_attributes=True)
