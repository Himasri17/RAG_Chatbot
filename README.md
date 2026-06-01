# RAG Video Comparison Chatbot

An AI-powered Retrieval-Augmented Generation (RAG) application that compares YouTube videos and Instagram Reels using transcripts, metadata, vector search, and Large Language Models.

The system extracts video content, generates embeddings, stores them in Qdrant, retrieves relevant context, and uses Mistral (via Ollama) to answer questions and compare videos.

---

## Features

### Video Processing

* YouTube video ingestion
* Instagram Reel ingestion
* Metadata extraction
* Transcript extraction
* Automatic caption fallback for silent Instagram reels

### RAG Pipeline

* Transcript cleaning
* Text chunking
* Embedding generation using Sentence Transformers
* Vector storage using Qdrant
* Semantic retrieval

### AI Chat

* Question answering over video content
* Multi-video comparison
* Context-aware retrieval
* Local LLM inference using Ollama + Mistral

### Frontend

* Modern Next.js interface
* Video comparison dashboard
* Interactive AI chat panel
* Source-aware responses

---

# Architecture

User URL
↓
Metadata Extraction
↓
Transcript Extraction
↓
Cleaning & Chunking
↓
Sentence Transformer Embeddings
↓
Qdrant Vector Database
↓
Retriever
↓
Prompt Builder
↓
Mistral (Ollama)
↓
AI Answer

---

# Tech Stack

## Backend

* FastAPI
* Python 3.11

## AI / ML

* Sentence Transformers
* Faster Whisper
* Mistral
* Ollama

## Vector Database

* Qdrant

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Media Extraction

* yt-dlp
* YouTube Data API
* Instaloader

---

# Project Structure

```text
RAG_Chatbot/
│
├── backend/
│   ├── api/
│   │   └── routes/
│   │       ├── process_videos.py
│   │       └── chat.py
│   │
│   ├── models/
│   │   ├── video_request.py
│   │   └── chat_request.py
│   │
│   ├── preprocessing/
│   │   ├── cleaner.py
│   │   └── chunker.py
│   │
│   ├── services/
│   │   ├── youtube/
│   │   ├── instagram/
│   │   ├── embeddings/
│   │   ├── vectorstore/
│   │   └── rag/
│   │
│   └── app.py
│
├── frontend/
│
├── notebooks/
│
├── .env
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
cd RAG_Chatbot
```

---

# Backend Setup

Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# Environment Variables

Create:

```bash
.env
```

Example:

```env
YOUTUBE_API_KEY=your_youtube_api_key

QDRANT_URL=http://localhost:6333

QDRANT_API_KEY=
```

---

# Install Ollama

Linux:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Pull Mistral:

```bash
ollama pull mistral
```

Verify:

```bash
ollama list
```

Expected:

```text
mistral:latest
```

---

# Start Qdrant

Using Docker:

```bash
docker run -d \
--name qdrant \
-p 6333:6333 \
qdrant/qdrant
```

Verify:

```bash
curl http://localhost:6333
```

---

# Run Backend

```bash
cd backend

uvicorn app:app --reload
```

Backend:

```text
http://localhost:8000
```

Swagger Docs:

```text
http://localhost:8000/docs
```

---

# Run Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# API Endpoints

## Process Video

POST

```http
/process-video
```

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Response:

```json
{
  "platform": "youtube",
  "title": "Rick Astley - Never Gonna Give You Up",
  "creator": "Rick Astley",
  "views": 1778000000,
  "num_chunks": 3,
  "message": "Stored successfully in Qdrant"
}
```

---

## Chat

POST

```http
/chat
```

Request:

```json
{
  "query": "Compare the themes of Video A and Video B."
}
```

Response:

```json
{
  "answer": "...",
  "sources": [
    "Video A",
    "Video B"
  ]
}
```

---

# Example Questions

### Summaries

* Summarize Video A
* Summarize Video B

### Comparison

* Compare the themes of Video A and Video B
* What are the major differences?
* Which video is more entertainment focused?
* Compare audience engagement

### Content Analysis

* What food is shown in Video B?
* What is Video A about?
* Which video contains spoken content?

---

# Future Improvements

* Multi-video indexing
* Chat history memory
* User authentication
* Cloud deployment
* Streaming responses
* Hybrid search
* Advanced analytics dashboard

---

# Author

Himasri Pithani

AI Engineer Project – Retrieval-Augmented Video Comparison Chatbot
