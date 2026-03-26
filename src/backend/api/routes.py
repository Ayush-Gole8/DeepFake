"""
Owner: Team Lead (Ayush)
Version: 1.0.0

Routes: Analysis API (Version 1 - Upload Only)
This module implements the initial ingestion API for the deepfake detection system.
Scope (V1):
- Accept file uploads from /analyse frontend
- Validate file type and size
- Store file temporarily
- Create async analysis task
- Provide polling endpoint

Non-goals (Deferred to later sprints):
- rPPG extraction
- FaceMesh processing
- Model inference
- Fusion logic

Task Lifecycle:
1. Upload received
2. MIME type sniffed (libmagic)
3. Validation (type + size)
4. File saved to temporary storage
5. Task created and stored in-memory
6. Background stub execution triggered
7. Result stored and accessible via polling

Notes:
- Uses in-memory task store (NOT production safe)
- Uses FastAPI BackgroundTasks (NOT Celery yet)
- Designed for single-instance development only

Future Replacements:
- _task_store → Redis / Postgres
- temp storage → S3 / GCS
- BackgroundTasks → Celery / worker queue
- stub → real multimodal pipeline
"""

import os
import uuid
import magic
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from .schemas import (
    AnalysisTask,
    AnalysisResult,
    AnalysisStatus,
    FileConstraints,
    MediaType,
    RPPGResult,
    GeometryResult,
    Verdict,
)

router = APIRouter(prefix="/api/v1/analyse", tags=["analyse"])

# Temporary upload directory for storing incoming files.
# Using /tmp for simplicity; will be replaced with object storage (S3/GCS) in production.
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/deepfake_uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory task store for tracking analysis status and results.
# WARNING:
# - Not persistent
# - Cleared on restart
# - Not safe for multi-worker environments
_task_store: dict[str, AnalysisResult] = {}


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────


def _sniff_media_type(
    file_bytes: bytes, filename: str
) -> tuple[str, Optional[MediaType]]:
    """
    Detect actual MIME type using libmagic.

    This is a security-critical step to prevent spoofed file uploads.

    Args:
        file_bytes: Raw file content

    Returns:
        Tuple of:
        - detected MIME string (e.g., 'video/mp4')
        - mapped MediaType enum OR None if unsupported

    Notes:
        - Do NOT rely on client-provided Content-Type
        - This is the first validation layer to reject unsupported files before any further processing - Ayush
    """

    try:
        mime = magic.from_buffer(file_bytes[:2048], mime=True)
    except Exception:
        ext = Path(filename).suffix.lower()
        ext_map = {
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".mov": "video/quicktime",
            ".wav": "audio/wav",
            ".mp3": "audio/mpeg",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        mime = ext_map.get(ext, "application/octet-stream")

    if mime.startswith("video/"):
        return mime, MediaType.VIDEO
    if mime.startswith("audio/"):
        return mime, MediaType.AUDIO
    if mime.startswith("image/"):
        return mime, MediaType.IMAGE
    return mime, None


def _validate_file(
    content: bytes, filename: str, declared_media_type: Optional[MediaType] = None
) -> tuple[str, MediaType]:
    """
    Validate uploaded file against system constraints.

    Validation Order (IMPORTANT):
    1. MIME sniffing (source of truth)
    2. Declared vs detected mismatch check
    3. Allowed type enforcement
    4. File size enforcement

    Args:
        file_bytes: Raw file content
        declared_type: Optional client-provided MIME type

    Raises:
        HTTPException:
            - 415 → unsupported media type
            - 400 → mismatch or invalid file
            - 413 → file too large

    Notes:
        - Duration/FPS validation is NOT implemented in V1
        - Decode-level validation deferred to later versions
    """
    mime, sniffed_type = _sniff_media_type(content, filename)

    if sniffed_type is None:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {mime}. "
            f"Accepted: video (mp4/webm), audio (wav/mp3), image (jpg/png/webp)",
        )

    if declared_media_type and declared_media_type != sniffed_type:
        raise HTTPException(
            status_code=422,
            detail=f"Declared type '{declared_media_type}' does not match "
            f"detected type '{sniffed_type.value}'. Do not spoof content-type.",
        )

    if mime not in FileConstraints.allowed_mimes(sniffed_type):
        raise HTTPException(
            status_code=415,
            detail=f"File subtype '{mime}' not in allowed list: "
            f"{FileConstraints.allowed_mimes(sniffed_type)}",
        )

    max_bytes = FileConstraints.max_bytes(sniffed_type)
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum for {sniffed_type.value}: "
            f"{max_bytes // (1024*1024)} MB. Got: {len(content) // (1024*1024)} MB",
        )

    return mime, sniffed_type


# ─────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────


"""
Upload endpoint for analysis pipeline (V1: ingestion only).

Accepts:
    - Multipart file upload
    - Optional metadata fields

Form Fields:
    file: Uploaded file (video/image/audio)
    source_label: Optional metadata label (currently unused)
    expected_real: Optional ground truth hint (future use)

Returns:
    AnalysisTask:
        - task_id
        - status (queued)
        - poll_url

Workflow:
    - Read file
    - Validate file
    - Save to temp storage
    - Create task entry
    - Trigger background stub

Notes:
    - No actual analysis is performed in V1
    - Metadata fields are placeholders for future training/evaluation
"""


@router.post(
    "/upload",
    response_model=AnalysisTask,
    status_code=202,
    summary="Upload a media file for deepfake analysis (returns task_id immediately)",
    description="""
    Accepts video, audio or image files.
    Returns a system generated task_id immediately. Poll /status/{task_id} for results.
    
    **Limits:**
    - Video: 200 MB, 3–120 seconds, mp4/webm/mov
    - Audio: 50 MB, wav/mp3/m4a/ogg
    - Image: 20 MB, jpg/png/webp
    """,
)
async def upload_for_analysis(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Media file to analyse"),
    source_label: Optional[str] = Form(None),
    expected_real: Optional[bool] = Form(None),
):
    content = await file.read()
    mime, media_type = _validate_file(content, file.filename or "upload")

    # Save to disk
    task_id = str(uuid.uuid4())
    ext = Path(file.filename or "file").suffix or f".{mime.split('/')[-1]}"
    save_path = UPLOAD_DIR / f"{task_id}{ext}"
    save_path.write_bytes(content)

    # Initialise result stub in task store
    _task_store[task_id] = AnalysisResult(
        task_id=task_id,
        status=AnalysisStatus.QUEUED,
        media_type=media_type,
    )

    # Queue background task (Sprint 1 = sync stub; Sprint 2 = Celery)
    background_tasks.add_task(_run_analysis_stub, task_id, save_path, media_type)

    return AnalysisTask(
        task_id=task_id,
        media_type=media_type,
        status=AnalysisStatus.QUEUED,
        poll_url=f"/api/v1/analyse/status/{task_id}",
    )


@router.get(
    "/status/{task_id}",
    response_model=AnalysisResult,
    summary="Poll the status of an analysis task",
)
async def get_analysis_status(task_id: str):
    result = _task_store.get(task_id)
    if result is None:
        raise HTTPException(
            status_code=404, detail=f"Task '{task_id}' not found. It may have expired."
        )
    return result


@router.get(
    "/constraints",
    summary="Get current file upload constraints",
    description="Frontend uses this to drive upload UI limits dynamically — "
    "no hardcoding limits in React.",
)
async def get_constraints():
    """
    This returns upload constraints so the frontend never hardcodes limits.
    When limits change backend-side, frontend auto-updates.
    """
    return {
        "video": {
            "max_mb": FileConstraints.VIDEO_MAX_MB,
            "max_seconds": FileConstraints.VIDEO_MAX_SECS,
            "min_seconds": FileConstraints.VIDEO_MIN_SECS,
            "allowed_types": list(FileConstraints.ALLOWED_VIDEO),
        },
        "audio": {
            "max_mb": FileConstraints.AUDIO_MAX_MB,
            "allowed_types": list(FileConstraints.ALLOWED_AUDIO),
        },
        "image": {
            "max_mb": FileConstraints.IMAGE_MAX_MB,
            "allowed_types": list(FileConstraints.ALLOWED_IMAGE),
        },
    }


# ─────────────────────────────────────────────
#  Stub pipeline — replaced per sprint
# ─────────────────────────────────────────────


async def _run_analysis_stub(task_id: str, file_path: Path, media_type: MediaType):
    """
    Sprint 1 stub. Returns dummy verdicts after a 1s delay.
    Sprint 2: rPPG Specialist replaces rppg_result.
    Sprint 3: FaceMesh Specialist replaces geometry_result.
    Sprint 4: Fusion head combines both into verdict + confidence.
    """
    import asyncio

    await asyncio.sleep(1.0)  # simulate processing

    _task_store[task_id] = AnalysisResult(
        task_id=task_id,
        status=AnalysisStatus.COMPLETED,
        media_type=media_type,
        verdict=Verdict.INCONCLUSIVE,
        confidence=None,
        processing_ms=1000,
        # Stubs — specialist teams populate these
        rppg_result=RPPGResult() if media_type == MediaType.VIDEO else None,
        geometry_result=(
            GeometryResult()
            if media_type in (MediaType.VIDEO, MediaType.IMAGE)
            else None
        ),
        schema_version="1.0.0",
    )
