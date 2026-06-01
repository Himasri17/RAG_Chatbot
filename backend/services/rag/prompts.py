def build_prompt(query: str, chunks: list[str], history: list[dict] = None) -> str:
    context = "\n\n".join(chunks)

    history_block = ""
    if history:
        formatted = []
        for msg in history:
            role = "User" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role}: {msg['content']}")
        history_block = "\n".join(formatted)

    if history_block:
        return f"""You are an AI assistant that compares two videos.

The context contains:
- Transcript chunks
- Metadata
- Views
- Likes
- Comments
- Followers
- Engagement Rate

Answer ONLY from the provided context.
If a metric is present, use it directly.
Answer the question using ONLY the provided context. Use conversation history for follow-up questions.

Context (retrieved transcript chunks):
{context}

Conversation History:
{history_block}

Current Question:
{query}

Answer:"""
    else:
        return f"""You are an AI assistant that compares two videos using transcript data.
Answer the question using ONLY the provided context.

Context (retrieved transcript chunks):
{context}

Question:
{query}

Answer:"""