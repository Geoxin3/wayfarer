from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers.auth import router as auth_router
from app.routers.destination import router as destinaiton_router
from app.routers.trip import router as trip_router
from app.routers.recommendation import router as recommendation_router
from app.routers.destination_images import router as destination_images_router

app = FastAPI()

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(destinaiton_router)
app.include_router(trip_router)
app.include_router(recommendation_router)
app.include_router(destination_images_router)

@app.get("/")
def root():
    return {"message": "Hello World"}