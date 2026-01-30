# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.user import router as user_router

app = FastAPI(title="Employee Performance Monitoring and Reporting System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # safe for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes FIRST
app.include_router(user_router, prefix="/api")

# Frontend LAST
app.mount("/", StaticFiles(directory="static", html=True), name="static")
