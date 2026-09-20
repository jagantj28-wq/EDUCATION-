from app.models.base import BaseModel
from app.models.user import User
from app.models.academic import Subject, ClassSchedule, Assignment, Exam, Attendance
from app.models.study_and_ai import StudyTask, StudySession, Note, Quiz, QuizQuestion, Notification

__all__ = [
    "BaseModel",
    "User",
    "Subject",
    "ClassSchedule",
    "Assignment",
    "Exam",
    "Attendance",
    "StudyTask",
    "StudySession",
    "Note",
    "Quiz",
    "QuizQuestion",
    "Notification",
]
