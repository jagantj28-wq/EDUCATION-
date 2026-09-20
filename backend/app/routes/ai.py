import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.study_and_ai import Note, Quiz, QuizQuestion
from app.models.academic import Subject
from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    SummarizeRequest,
    SummarizeResponse,
    QuizGenerateRequest,
    QuizResponse,
    QuizQuestionItem
)
from app.services.ai_service import AIService
from app.core.security import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note_context = None
    note_title = None

    if data.note_id:
        note = db.query(Note).filter(Note.id == data.note_id, Note.user_id == current_user.id).first()
        if note:
            note_context = note.extracted_text
            note_title = note.title
    elif data.subject_id:
        # Search student's notes for this subject
        notes = db.query(Note).filter(Note.subject_id == data.subject_id, Note.user_id == current_user.id).all()
        if notes:
            note_context = "\n---\n".join([n.extracted_text or "" for n in notes[:3]])
            note_title = f"{notes[0].subject.name if notes[0].subject else 'Subject'} Notes"

    result = await AIService.chat(
        message=data.message,
        note_context=note_context,
        note_title=note_title
    )
    return ChatResponse(**result)


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_note(
    data: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == data.note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    text_to_summarize = note.extracted_text or note.title

    result = await AIService.summarize(
        title=note.title,
        text=text_to_summarize
    )

    # Persist summary onto Note so it doesn't need to be regenerated every time
    note.summary = result["summary"]
    db.commit()

    return SummarizeResponse(
        note_id=note.id,
        title=note.title,
        summary=result["summary"],
        key_concepts=result["key_concepts"],
        definitions=result["definitions"],
        formulas=result["formulas"],
        exam_tips=result["exam_tips"]
    )


@router.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(
    data: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = "Academic Quiz"
    note_text = None

    if data.note_id:
        note = db.query(Note).filter(Note.id == data.note_id, Note.user_id == current_user.id).first()
        if note:
            title = f"{note.title} Quiz"
            note_text = note.extracted_text
            data.subject_id = note.subject_id
    elif data.subject_id:
        subject = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
        if subject:
            title = f"{subject.name} Review Quiz"

    raw_questions = await AIService.generate_quiz(
        title=title,
        text=note_text,
        num_questions=data.num_questions,
        difficulty=data.difficulty
    )

    # Save Quiz to DB
    quiz = Quiz(
        user_id=current_user.id,
        subject_id=data.subject_id,
        title=title
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    # Save Questions
    question_items = []
    for q in raw_questions:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question=q["question"],
            option_a=q["option_a"],
            option_b=q["option_b"],
            option_c=q["option_c"],
            option_d=q["option_d"],
            correct_answer=q["correct_answer"],
            explanation=q["explanation"]
        )
        db.add(qq)
        question_items.append(qq)

    db.commit()
    for qq in question_items:
        db.refresh(qq)

    subject_name = quiz.subject.name if quiz.subject else "General"

    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        subject_id=quiz.subject_id,
        subject_name=subject_name,
        questions=[
            QuizQuestionItem(
                id=qq.id,
                question=qq.question,
                option_a=qq.option_a,
                option_b=qq.option_b,
                option_c=qq.option_c,
                option_d=qq.option_d,
                correct_answer=qq.correct_answer,
                explanation=qq.explanation
            )
            for qq in question_items
        ]
    )


@router.get("/quizzes", response_model=List[QuizResponse])
def get_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).all()
    results = []
    for q in quizzes:
        results.append(
            QuizResponse(
                id=q.id,
                title=q.title,
                subject_id=q.subject_id,
                subject_name=q.subject.name if q.subject else "General",
                questions=[
                    QuizQuestionItem(
                        id=qq.id,
                        question=qq.question,
                        option_a=qq.option_a,
                        option_b=qq.option_b,
                        option_c=qq.option_c,
                        option_d=qq.option_d,
                        correct_answer=qq.correct_answer,
                        explanation=qq.explanation
                    )
                    for qq in q.questions
                ]
            )
        )
    return results
