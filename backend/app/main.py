from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.destination import router as destinaiton_router
from app.routers.trip import router as trip_router

app = FastAPI()

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

@app.get("/")
def root():
    return {"message": "Hello World"}