import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import settings
from app.models.user import User
from app.models.study_and_ai import Note
from app.models.academic import Subject
from app.schemas.note import NoteResponse
from app.utils.pdf_extractor import extract_text_from_file
from app.core.security import get_current_user

router = APIRouter(prefix="/api/notes", tags=["Notes & PDFs"])


def _format_note(n: Note) -> NoteResponse:
    return NoteResponse(
        id=n.id,
        user_id=n.user_id,
        subject_id=n.subject_id,
        subject_name=n.subject.name if n.subject else "General",
        title=n.title,
        file_name=n.file_name,
        file_path=n.file_path,
        extracted_text=n.extracted_text,
        summary=n.summary,
        created_at=n.created_at
    )


@router.get("", response_model=List[NoteResponse])
def get_notes(
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Note).filter(Note.user_id == current_user.id)
    if subject_id:
        query = query.filter(Note.subject_id == subject_id)
    notes = query.order_by(Note.created_at.desc()).all()
    return [_format_note(n) for n in notes]


@router.post("/upload", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_note(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF or TXT file."
        )

    # Validate subject if provided
    if subject_id:
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
        if not subject:
            raise HTTPException(status_code=400, detail="Invalid subject.")

    # Save file with unique name
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex}_{file.filename}"
    saved_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    file_bytes = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB.")

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Extract text
    extracted = extract_text_from_file(saved_path)

    note = Note(
        user_id=current_user.id,
        subject_id=subject_id,
        title=title.strip(),
        file_name=file.filename,
        file_path=saved_path,
        extracted_text=extracted
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return _format_note(note)


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return _format_note(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Safely delete file if exists
    if note.file_path and os.path.exists(note.file_path):
        try:
            os.remove(note.file_path)
        except Exception:
            pass

    db.delete(note)
    db.commit()
    return None
