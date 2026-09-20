import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NoteResponse(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    subject_name: Optional[str] = "General"
    title: str
    file_name: str
    file_path: str
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
