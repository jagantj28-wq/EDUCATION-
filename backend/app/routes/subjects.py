from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.academic import Subject, Attendance, Assignment
from app.schemas.academic import SubjectCreate, SubjectUpdate, SubjectResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])


@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).order_by(Subject.name).all()
    results = []
    for s in subjects:
        att = db.query(Attendance).filter(Attendance.subject_id == s.id, Attendance.user_id == current_user.id).first()
        pending_count = db.query(Assignment).filter(
            Assignment.subject_id == s.id,
            Assignment.user_id == current_user.id,
            Assignment.status == "pending"
        ).count()

        results.append(
            SubjectResponse(
                id=s.id,
                user_id=s.user_id,
                name=s.name,
                code=s.code,
                teacher=s.teacher,
                credits=s.credits,
                color=s.color,
                created_at=s.created_at,
                attendance_percentage=att.percentage if att else 100.0,
                pending_assignments_count=pending_count
            )
        )
    return results


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = Subject(
        user_id=current_user.id,
        name=data.name.strip(),
        code=data.code.strip().upper(),
        teacher=data.teacher.strip() if data.teacher else None,
        credits=data.credits,
        color=data.color or "#3B82F6"
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    # Initialize default Attendance record
    att = Attendance(
        user_id=current_user.id,
        subject_id=subject.id,
        classes_held=0,
        classes_attended=0,
        target_percentage=75.0
    )
    db.add(att)
    db.commit()

    return SubjectResponse(
        id=subject.id,
        user_id=subject.user_id,
        name=subject.name,
        code=subject.code,
        teacher=subject.teacher,
        credits=subject.credits,
        color=subject.color,
        created_at=subject.created_at,
        attendance_percentage=100.0,
        pending_assignments_count=0
    )


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    att = db.query(Attendance).filter(
        Attendance.subject_id == subject.id,
        Attendance.user_id == current_user.id
    ).first()

    pending_count = db.query(Assignment).filter(
        Assignment.subject_id == subject.id,
        Assignment.user_id == current_user.id,
        Assignment.status == "pending"
    ).count()

    return SubjectResponse(
        id=subject.id,
        user_id=subject.user_id,
        name=subject.name,
        code=subject.code,
        teacher=subject.teacher,
        credits=subject.credits,
        color=subject.color,
        created_at=subject.created_at,
        attendance_percentage=att.percentage if att else 100.0,
        pending_assignments_count=pending_count
    )


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if data.name is not None:
        subject.name = data.name.strip()
    if data.code is not None:
        subject.code = data.code.strip().upper()
    if data.teacher is not None:
        subject.teacher = data.teacher.strip()
    if data.credits is not None:
        subject.credits = data.credits
    if data.color is not None:
        subject.color = data.color

    db.commit()
    db.refresh(subject)

    att = db.query(Attendance).filter(
        Attendance.subject_id == subject.id,
        Attendance.user_id == current_user.id
    ).first()

    pending_count = db.query(Assignment).filter(
        Assignment.subject_id == subject.id,
        Assignment.user_id == current_user.id,
        Assignment.status == "pending"
    ).count()

    return SubjectResponse(
        id=subject.id,
        user_id=subject.user_id,
        name=subject.name,
        code=subject.code,
        teacher=subject.teacher,
        credits=subject.credits,
        color=subject.color,
        created_at=subject.created_at,
        attendance_percentage=att.percentage if att else 100.0,
        pending_assignments_count=pending_count
    )


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(subject)
    db.commit()
    return None
