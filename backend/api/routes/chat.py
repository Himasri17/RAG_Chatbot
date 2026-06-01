from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from models.chat_request import ChatRequest
from services.vectorstore.retriever import retrieve
from services.rag.prompts import build_prompt
from services.rag.generator import generate_answer

router = APIRouter()


class HistoryMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequestWithHistory(BaseModel):
    query: str
    history: Optional[List[HistoryMessage]] = []


@router.post("/chat")
def chat(req: ChatRequestWithHistory):
    results = retrieve(req.query)

    chunks = [r.payload["text"] for r in results]

    # Convert history to plain dicts for prompt builder
    history = [{"role": m.role, "content": m.content} for m in (req.history or [])]

    prompt = build_prompt(req.query, chunks, history)

    answer = generate_answer(prompt)

    return {
        "answer": answer,
        "sources": [r.payload["title"] for r in results],
    }