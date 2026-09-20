import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class StudyTaskBase(BaseModel):
    subject_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_date: datetime.datetime
    duration_minutes: int = Field(45, ge=5, le=360)
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    completed: bool = False


class StudyTaskCreate(StudyTaskBase):
    pass


class StudyTaskUpdate(BaseModel):
    subject_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_date: Optional[datetime.datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=360)
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    completed: Optional[bool] = None


class StudyTaskResponse(StudyTaskBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    subject_name: Optional[str] = "General"
    subject_color: Optional[str] = "#3B82F6"

    model_config = ConfigDict(from_attributes=True)


class StudySessionCreate(BaseModel):
    subject_id: Optional[int] = None
    start_time: datetime.datetime
    end_time: datetime.datetime
    duration_minutes: int


class StudySessionResponse(StudySessionCreate):
    id: int
    user_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
