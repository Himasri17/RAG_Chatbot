from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import time

from services.vectorstore.retriever import retrieve
from services.rag.prompts import build_prompt
from services.rag.generator import generate_answer

router = APIRouter()


class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequestWithHistory(BaseModel):
    query: str
    history: Optional[List[HistoryMessage]] = []


@router.post("/chat")
def chat(req: ChatRequestWithHistory):

    total_start = time.time()

    print("\n" + "=" * 50)
    print("CHAT REQUEST STARTED")
    print("=" * 50)

    # --------------------------------
    # RETRIEVAL
    # --------------------------------

    retrieval_start = time.time()

    results = retrieve(req.query)

    print(
        f"Retrieval Time: "
        f"{time.time() - retrieval_start:.2f}s"
    )

    # --------------------------------
    # CONTEXT BUILDING
    # --------------------------------

    context_start = time.time()

    chunks = []

    for r in results:

        p = r.payload

        print("\nPAYLOAD:")
        print(p)

        chunk_context = f"""
Title: {p.get('title')}
Platform: {p.get('platform')}
Creator: {p.get('creator')}

Views: {p.get('views')}
Likes: {p.get('likes')}
Comments: {p.get('comments')}
Followers: {p.get('followers')}
Engagement Rate: {p.get('engagement_rate')}

Transcript:
{p.get('text')}
"""

        chunks.append(chunk_context)

    history = [
        {
            "role": m.role,
            "content": m.content
        }
        for m in (req.history or [])
    ]

    prompt = build_prompt(
        req.query,
        chunks,
        history
    )

    print(
        f"Prompt Build Time: "
        f"{time.time() - context_start:.2f}s"
    )

    print(
        f"Prompt Length: "
        f"{len(prompt)} characters"
    )

    # --------------------------------
    # LLM GENERATION
    # --------------------------------

    llm_start = time.time()

    answer = generate_answer(prompt)

    print(
        f"LLM Generation Time: "
        f"{time.time() - llm_start:.2f}s"
    )

    # --------------------------------
    # TOTAL TIME
    # --------------------------------

    print(
        f"TOTAL CHAT TIME: "
        f"{time.time() - total_start:.2f}s"
    )

    print("=" * 50)

    return {
        "answer": answer,
        "sources": list(
            set(
                r.payload["title"]
                for r in results
            )
        )
    }