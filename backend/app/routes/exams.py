import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.academic import Exam, Subject
from app.schemas.academic import ExamCreate, ExamUpdate, ExamResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/exams", tags=["Exams"])


def _format_exam(e: Exam) -> ExamResponse:
    now = datetime.datetime.utcnow()
    diff_days = (e.exam_date.date() - now.date()).days

    return ExamResponse(
        id=e.id,
        user_id=e.user_id,
        subject_id=e.subject_id,
        subject_name=e.subject.name if e.subject else "General",
        subject_color=e.subject.color if e.subject else "#3B82F6",
        title=e.title,
        exam_date=e.exam_date,
        exam_type=e.exam_type,
        syllabus=e.syllabus,
        created_at=e.created_at,
        days_until_exam=diff_days
    )


@router.get("", response_model=List[ExamResponse])
def get_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exams = db.query(Exam).filter(Exam.user_id == current_user.id).order_by(Exam.exam_date.asc()).all()
    return [_format_exam(e) for e in exams]


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Invalid subject specified.")

    exam = Exam(
        user_id=current_user.id,
        subject_id=data.subject_id,
        title=data.title.strip(),
        exam_date=data.exam_date,
        exam_type=data.exam_type.strip(),
        syllabus=data.syllabus.strip() if data.syllabus else None
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return _format_exam(exam)


@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: int,
    data: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.user_id == current_user.id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if data.subject_id is not None:
        subject = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
        if not subject:
            raise HTTPException(status_code=400, detail="Invalid subject specified.")
        exam.subject_id = data.subject_id

    if data.title is not None:
        exam.title = data.title.strip()
    if data.exam_date is not None:
        exam.exam_date = data.exam_date
    if data.exam_type is not None:
        exam.exam_type = data.exam_type.strip()
    if data.syllabus is not None:
        exam.syllabus = data.syllabus.strip() if data.syllabus else None

    db.commit()
    db.refresh(exam)
    return _format_exam(exam)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.user_id == current_user.id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    db.delete(exam)
    db.commit()
    return None
