import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# --- Subjects ---
class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    code: str = Field(..., min_length=1, max_length=30)
    teacher: Optional[str] = Field(None, max_length=120)
    credits: int = Field(3, ge=1, le=10)
    color: str = Field("#3B82F6", max_length=30)


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    code: Optional[str] = Field(None, min_length=1, max_length=30)
    teacher: Optional[str] = None
    credits: Optional[int] = Field(None, ge=1, le=10)
    color: Optional[str] = None


class SubjectResponse(SubjectBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    attendance_percentage: Optional[float] = 100.0
    pending_assignments_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# --- Class Schedules ---
class ClassScheduleBase(BaseModel):
    subject_id: int
    day_of_week: str = Field(..., max_length=20)
    start_time: str = Field(..., max_length=10)
    end_time: str = Field(..., max_length=10)
    room: Optional[str] = None


class ClassScheduleCreate(ClassScheduleBase):
    pass


class ClassScheduleResponse(ClassScheduleBase):
    id: int
    user_id: int
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Assignments ---
class AssignmentBase(BaseModel):
    subject_id: int
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    deadline: datetime.datetime
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    status: str = Field("pending", pattern="^(pending|completed)$")


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    subject_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    deadline: Optional[datetime.datetime] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    status: Optional[str] = Field(None, pattern="^(pending|completed)$")


class AssignmentResponse(AssignmentBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    is_overdue: bool = False
    due_in_days: int = 0

    model_config = ConfigDict(from_attributes=True)


# --- Exams ---
class ExamBase(BaseModel):
    subject_id: int
    title: str = Field(..., min_length=1, max_length=200)
    exam_date: datetime.datetime
    exam_type: str = Field("Midterm", max_length=50)
    syllabus: Optional[str] = None


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    subject_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    exam_date: Optional[datetime.datetime] = None
    exam_type: Optional[str] = None
    syllabus: Optional[str] = None


class ExamResponse(ExamBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    days_until_exam: int = 0

    model_config = ConfigDict(from_attributes=True)


# --- Attendance ---
class AttendanceUpdate(BaseModel):
    classes_held: int = Field(..., ge=0)
    classes_attended: int = Field(..., ge=0)
    target_percentage: Optional[float] = Field(75.0, ge=1.0, le=100.0)


class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    subject_id: int
    subject_name: str
    subject_code: str
    subject_color: str
    classes_held: int
    classes_attended: int
    target_percentage: float
    percentage: float
    classes_needed: int
    is_below_target: bool
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
