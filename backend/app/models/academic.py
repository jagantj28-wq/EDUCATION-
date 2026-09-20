import datetime
import math
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Subject(BaseModel):
    __tablename__ = "subjects"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(30), nullable=False)
    teacher = Column(String(120), nullable=True)
    credits = Column(Integer, default=3, nullable=False)
    color = Column(String(30), default="#3B82F6", nullable=False)

    user = relationship("User", back_populates="subjects")
    schedules = relationship("ClassSchedule", back_populates="subject", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="subject", cascade="all, delete-orphan")
    study_tasks = relationship("StudyTask", back_populates="subject", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="subject", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="subject", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="subject", cascade="all, delete-orphan")


class ClassSchedule(BaseModel):
    __tablename__ = "class_schedules"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(String(20), nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    room = Column(String(50), nullable=True)

    subject = relationship("Subject", back_populates="schedules")


class Assignment(BaseModel):
    __tablename__ = "assignments"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=False)
    priority = Column(String(20), default="medium", nullable=False)
    status = Column(String(20), default="pending", nullable=False)

    user = relationship("User", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")


class Exam(BaseModel):
    __tablename__ = "exams"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    exam_date = Column(DateTime, nullable=False)
    exam_type = Column(String(50), default="Midterm", nullable=False)
    syllabus = Column(Text, nullable=True)

    user = relationship("User", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")


class Attendance(BaseModel):
    __tablename__ = "attendances"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    classes_held = Column(Integer, default=0, nullable=False)
    classes_attended = Column(Integer, default=0, nullable=False)
    target_percentage = Column(Float, default=75.0, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="attendances")
    subject = relationship("Subject", back_populates="attendances")

    @property
    def percentage(self) -> float:
        if self.classes_held <= 0:
            return 100.0
        return round((self.classes_attended / self.classes_held) * 100, 1)

    @property
    def is_below_target(self) -> bool:
        return self.classes_held > 0 and self.percentage < self.target_percentage

    @property
    def classes_needed_to_target(self) -> int:
        if not self.is_below_target:
            return 0
        if self.target_percentage >= 100:
            return 999
        t = self.target_percentage / 100.0
        needed = math.ceil((t * self.classes_held - self.classes_attended) / (1.0 - t))
        return max(0, needed)
