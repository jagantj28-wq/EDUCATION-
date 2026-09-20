import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.study_and_ai import StudyTask, StudySession
from app.models.academic import Subject
from app.schemas.study import (
    StudyTaskCreate,
    StudyTaskUpdate,
    StudyTaskResponse,
    StudySessionCreate,
    StudySessionResponse,
)
from app.services.study_recommendation_service import StudyRecommendationService
from app.core.security import get_current_user

router = APIRouter(prefix="/api/study-plan", tags=["Study Planner"])


def _format_task(t: StudyTask) -> StudyTaskResponse:
    return StudyTaskResponse(
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
        subject_name=t.subject.name if t.subject else "General",
        subject_color=t.subject.color if t.subject else "#3B82F6"
    )


@router.get("", response_model=List[StudyTaskResponse])
def get_study_tasks(
    date_str: Optional[str] = Query(None, description="Filter by date YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(StudyTask).filter(StudyTask.user_id == current_user.id)
    if date_str:
        try:
            d = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
            start = datetime.datetime.combine(d, datetime.time.min)
            end = datetime.datetime.combine(d, datetime.time.max)
            query = query.filter(StudyTask.scheduled_date >= start, StudyTask.scheduled_date <= end)
        except ValueError:
            pass

    tasks = query.order_by(StudyTask.scheduled_date.asc(), StudyTask.completed.asc()).all()
    return [_format_task(t) for t in tasks]


@router.post("", response_model=StudyTaskResponse, status_code=status.HTTP_201_CREATED)
def create_study_task(
    data: StudyTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.subject_id:
        s = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
        if not s:
            raise HTTPException(status_code=400, detail="Invalid subject.")

    task = StudyTask(
        user_id=current_user.id,
        subject_id=data.subject_id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        scheduled_date=data.scheduled_date,
        duration_minutes=data.duration_minutes,
        priority=data.priority,
        completed=data.completed
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _format_task(task)


@router.post("/recommend", response_model=List[StudyTaskResponse])
def generate_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = StudyRecommendationService.generate_daily_recommendations(current_user.id, db)
    return [_format_task(t) for t in tasks]


@router.patch("/{task_id}/toggle", response_model=StudyTaskResponse)
def toggle_study_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(StudyTask).filter(
        StudyTask.id == task_id,
        StudyTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = not task.completed
    db.commit()
    db.refresh(task)
    return _format_task(task)


@router.put("/{task_id}", response_model=StudyTaskResponse)
def update_study_task(
    task_id: int,
    data: StudyTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(StudyTask).filter(
        StudyTask.id == task_id,
        StudyTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if data.subject_id is not None:
        if data.subject_id > 0:
            s = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
            if not s:
                raise HTTPException(status_code=400, detail="Invalid subject.")
            task.subject_id = data.subject_id
        else:
            task.subject_id = None

    if data.title is not None:
        task.title = data.title.strip()
    if data.description is not None:
        task.description = data.description.strip() if data.description else None
    if data.scheduled_date is not None:
        task.scheduled_date = data.scheduled_date
    if data.duration_minutes is not None:
        task.duration_minutes = data.duration_minutes
    if data.priority is not None:
        task.priority = data.priority
    if data.completed is not None:
        task.completed = data.completed

    db.commit()
    db.refresh(task)
    return _format_task(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(StudyTask).filter(
        StudyTask.id == task_id,
        StudyTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
