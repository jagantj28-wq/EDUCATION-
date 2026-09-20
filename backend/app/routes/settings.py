from pydantic import BaseModel, Field
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.academic import Attendance
from app.core.security import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])


class UserSettingsUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    attendance_target: Optional[float] = Field(None, ge=50.0, le=100.0)


@router.get("")
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    first_att = db.query(Attendance).filter(Attendance.user_id == current_user.id).first()
    target = first_att.target_percentage if first_att else 75.0

    return {
        "name": current_user.name,
        "email": current_user.email,
        "attendance_target": target,
        "college": "Department of Computer Science & Engineering",
        "semester": "Semester 5"
    }


@router.put("")
def update_user_settings(
    data: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.name:
        current_user.name = data.name.strip()

    if data.attendance_target:
        # Update target across all user's subjects
        attendances = db.query(Attendance).filter(Attendance.user_id == current_user.id).all()
        for a in attendances:
            a.target_percentage = data.attendance_target

    db.commit()
    db.refresh(current_user)

    first_att = db.query(Attendance).filter(Attendance.user_id == current_user.id).first()
    target = first_att.target_percentage if first_att else 75.0

    return {
        "name": current_user.name,
        "email": current_user.email,
        "attendance_target": target,
        "college": "Department of Computer Science & Engineering",
        "semester": "Semester 5"
    }
