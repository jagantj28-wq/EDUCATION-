from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    subject_id: Optional[int] = None
    note_id: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    based_on_notes: bool = False
    cited_note_title: Optional[str] = None


class SummarizeRequest(BaseModel):
    note_id: int


class SummarizeResponse(BaseModel):
    note_id: int
    title: str
    summary: str
    key_concepts: List[str] = []
    definitions: List[str] = []
    formulas: List[str] = []
    exam_tips: List[str] = []


class QuizQuestionItem(BaseModel):
    id: Optional[int] = None
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str

    model_config = ConfigDict(from_attributes=True)


class QuizGenerateRequest(BaseModel):
    subject_id: Optional[int] = None
    note_id: Optional[int] = None
    num_questions: int = Field(5, ge=1, le=20)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")


class QuizResponse(BaseModel):
    id: int
    title: str
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    questions: List[QuizQuestionItem]

    model_config = ConfigDict(from_attributes=True)
