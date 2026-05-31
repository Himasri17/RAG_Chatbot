from fastapi import FastAPI
from api.routes.process_videos import router

app = FastAPI()

app.include_router(router)

@app.get("/")
def health():
    return {"status": "running"}