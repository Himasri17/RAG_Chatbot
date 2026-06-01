from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.process_videos import router
from api.routes.chat import router as chat_router

app = FastAPI()

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)

app.include_router(router)
app.include_router(chat_router)

@app.get("/")
def health():
    return {"status": "running"}