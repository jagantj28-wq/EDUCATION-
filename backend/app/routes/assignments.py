import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.academic import Assignment, Subject
from app.schemas.academic import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])


def _format_assignment(a: Assignment) -> AssignmentResponse:
    now = datetime.datetime.utcnow()
    # Normalize deadline comparison
    is_overdue = a.status == "pending" and a.deadline < now
    diff_days = (a.deadline.date() - now.date()).days

    return AssignmentResponse(
        id=a.id,
        user_id=a.user_id,
        subject_id=a.subject_id,
        subject_name=a.subject.name if a.subject else "General",
        subject_color=a.subject.color if a.subject else "#3B82F6",
        title=a.title,
        description=a.description,
        deadline=a.deadline,
        priority=a.priority,
        status=a.status,
        created_at=a.created_at,
        is_overdue=is_overdue,
        due_in_days=diff_days
    )


@router.get("", response_model=List[AssignmentResponse])
def get_assignments(
    subject_id: Optional[int] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Assignment).filter(Assignment.user_id == current_user.id)

    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)
    if priority:
        query = query.filter(Assignment.priority == priority)
    if status:
        query = query.filter(Assignment.status == status)

    assignments = query.order_by(Assignment.deadline.asc()).all()
    return [_format_assignment(a) for a in assignments]


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify subject belongs to current user
    subject = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Invalid subject specified.")

    assignment = Assignment(
        user_id=current_user.id,
        subject_id=data.subject_id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        deadline=data.deadline,
        priority=data.priority,
        status=data.status
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return _format_assignment(assignment)


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if data.subject_id is not None:
        subject = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
        if not subject:
            raise HTTPException(status_code=400, detail="Invalid subject specified.")
        assignment.subject_id = data.subject_id

    if data.title is not None:
        assignment.title = data.title.strip()
    if data.description is not None:
        assignment.description = data.description.strip() if data.description else None
    if data.deadline is not None:
        assignment.deadline = data.deadline
    if data.priority is not None:
        assignment.priority = data.priority
    if data.status is not None:
        assignment.status = data.status

    db.commit()
    db.refresh(assignment)
    return _format_assignment(assignment)


@router.patch("/{assignment_id}/toggle-status", response_model=AssignmentResponse)
def toggle_assignment_status(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = "completed" if assignment.status == "pending" else "pending"
    db.commit()
    db.refresh(assignment)
    return _format_assignment(assignment)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return None
