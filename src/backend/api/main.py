"""
Owner: Team Lead (Ayush)
Version: 1.0.0
Application entrypoint for the Deepfake Detection API.

Responsibilities:
- create the FastAPI application instance
- configure middleware
- register routers
- expose lightweight operational endpoints

Version 1 scope:
- backend shell for /analyse frontend integration
- no model inference here
- no dataset logic here
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router as analyse_router

app = FastAPI(
    title="Deepfake Detection API",
    version="0.1.0",
    description="Multimodal deepfake detection — rPPG + FaceMesh dual-stream system",
)

# Development-only CORS policy for the local Vite frontend.
# In production, replace with a stricter allowlist from settings/env.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyse_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
