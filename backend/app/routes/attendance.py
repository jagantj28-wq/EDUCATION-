from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.academic import Attendance, Subject
from app.schemas.academic import AttendanceUpdate, AttendanceResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def _format_attendance(att: Attendance) -> AttendanceResponse:
    pct = att.percentage
    target = att.target_percentage
    needed = att.classes_needed_to_target

    return AttendanceResponse(
        id=att.id,
        user_id=att.user_id,
        subject_id=att.subject_id,
        subject_name=att.subject.name if att.subject else "General",
        subject_code=att.subject.code if att.subject else "GEN",
        subject_color=att.subject.color if att.subject else "#3B82F6",
        classes_held=att.classes_held,
        classes_attended=att.classes_attended,
        target_percentage=target,
        percentage=pct,
        classes_needed=needed,
        is_below_target=pct < target,
        updated_at=att.updated_at
    )


@router.get("", response_model=List[AttendanceResponse])
def get_attendance_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure all user's subjects have an Attendance row
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    for s in subjects:
        existing = db.query(Attendance).filter(Attendance.subject_id == s.id, Attendance.user_id == current_user.id).first()
        if not existing:
            new_att = Attendance(
                user_id=current_user.id,
                subject_id=s.id,
                classes_held=0,
                classes_attended=0,
                target_percentage=75.0
            )
            db.add(new_att)
    db.commit()

    records = db.query(Attendance).filter(Attendance.user_id == current_user.id).all()
    return [_format_attendance(a) for a in records]


@router.put("/{subject_id}", response_model=AttendanceResponse)
def update_attendance(
    subject_id: int,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.classes_attended > data.classes_held:
        raise HTTPException(
            status_code=400,
            detail="Attended classes cannot exceed total classes held."
        )

    att = db.query(Attendance).filter(
        Attendance.subject_id == subject_id,
        Attendance.user_id == current_user.id
    ).first()

    if not att:
        # Check if subject exists
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        att = Attendance(
            user_id=current_user.id,
            subject_id=subject_id,
            classes_held=data.classes_held,
            classes_attended=data.classes_attended,
            target_percentage=data.target_percentage or 75.0
        )
        db.add(att)
    else:
        att.classes_held = data.classes_held
        att.classes_attended = data.classes_attended
        if data.target_percentage is not None:
            att.target_percentage = data.target_percentage

    db.commit()
    db.refresh(att)
    return _format_attendance(att)


@router.post("/{subject_id}/mark", response_model=AttendanceResponse)
def mark_quick_attendance(
    subject_id: int,
    present: bool = Query(..., description="True if present, False if absent"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    att = db.query(Attendance).filter(
        Attendance.subject_id == subject_id,
        Attendance.user_id == current_user.id
    ).first()

    if not att:
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        att = Attendance(
            user_id=current_user.id,
            subject_id=subject_id,
            classes_held=1,
            classes_attended=1 if present else 0,
            target_percentage=75.0
        )
        db.add(att)
    else:
        att.classes_held += 1
        if present:
            att.classes_attended += 1

    db.commit()
    db.refresh(att)
    return _format_attendance(att)
