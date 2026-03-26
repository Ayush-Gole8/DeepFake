"""
Analyse endpoint schemas — the canonical data contract.
All team members build against these types.
Version: 1.0.0
Owner: Team Lead (Ayush)

HANDOFF NOTES:
  rPPG Specialist  → populate rppg_result field in AnalysisResult
  FaceMesh Spec    → populate geometry_result field in AnalysisResult
  Whosoever will handle data    → UploadRequest and FileConstraints are already finalised
"""

from __future__ import annotations

import uuid
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, validator, HttpUrl


# ─────────────────────────────────────────────
#  Enumerations — shared across all modules
# ─────────────────────────────────────────────


class MediaType(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"
    IMAGE = "image"


class AnalysisStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Verdict(str, Enum):
    REAL = "real"
    FAKE = "fake"
    INCONCLUSIVE = "inconclusive"


# ─────────────────────────────────────────────
#  File constraint config (centralised, not scattered in route handlers)
# ─────────────────────────────────────────────


class FileConstraints:
    VIDEO_MAX_MB = 200
    AUDIO_MAX_MB = 50
    IMAGE_MAX_MB = 20
    VIDEO_MAX_SECS = 120
    VIDEO_MIN_SECS = 3
    VIDEO_MIN_FPS = 15

    ALLOWED_VIDEO = {
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
        "video/3gpp",
    }
    ALLOWED_AUDIO = {
        "audio/wav",
        "audio/mpeg",
        "audio/mp4",
        "audio/ogg",
        "audio/x-wav",
        "audio/webm",
    }
    ALLOWED_IMAGE = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
        "image/bmp",
        "image/heic",
    }

    @classmethod
    def max_bytes(cls, media_type: MediaType) -> int:
        mapping = {
            MediaType.VIDEO: cls.VIDEO_MAX_MB * 1024 * 1024,
            MediaType.AUDIO: cls.AUDIO_MAX_MB * 1024 * 1024,
            MediaType.IMAGE: cls.IMAGE_MAX_MB * 1024 * 1024,
        }
        return mapping[media_type]

    @classmethod
    def allowed_mimes(cls, media_type: MediaType) -> set[str]:
        mapping = {
            MediaType.VIDEO: cls.ALLOWED_VIDEO,
            MediaType.AUDIO: cls.ALLOWED_AUDIO,
            MediaType.IMAGE: cls.ALLOWED_IMAGE,
        }
        return mapping[media_type]


# ─────────────────────────────────────────────
#  Upload request — what the frontend sends
# ─────────────────────────────────────────────


class UploadMetadata(BaseModel):
    """Optional client-supplied context, all fields nullable."""

    source_label: Optional[str] = Field(
        None, max_length=120, description="Human label, e.g. 'Twitter clip #4'"
    )
    expected_real: Optional[bool] = Field(
        None, description="Client's prior belief — used for calibration research only"
    )


# ─────────────────────────────────────────────
#  Task / status — what the API returns
#  immediately after upload
# ─────────────────────────────────────────────


class AnalysisTask(BaseModel):
    """
    Returned synchronously on POST /analyse/upload.
    Client polls GET /analyse/status/{task_id}.
    """

    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    media_type: MediaType
    status: AnalysisStatus = AnalysisStatus.QUEUED
    message: str = "Upload accepted. Analysis queued."
    poll_url: str = ""  # populated in the route handler

    class Config:
        use_enum_values = True


# ─────────────────────────────────────────────
#  Sub-results — one per specialist stream
#  rPPG Specialist fills rPPG fields.
#  FaceMesh Specialist fills geometry fields.
# ─────────────────────────────────────────────


class RPPGResult(BaseModel):
    """
    Owner: rPPG Specialist/ whoever will handle it.
    Populated by src/rppg/ pipeline.
    All fields Optional — stub returns None until Sprint 2.
    We'll decide all the metrics to include in the next sprint, but these are some examples to start with. -  ayush
    """

    bpm_estimate: Optional[float] = Field(None, ge=20, le=240)
    signal_quality: Optional[float] = Field(
        None, ge=0, le=1, description="SNR-derived quality score"
    )
    spatial_coherence: Optional[float] = Field(
        None, ge=0, le=1, description="Cross-ROI pulse coherence score"
    )
    is_biological: Optional[bool] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    ppg_map_url: Optional[str] = None  # S3/local URL to the PPG map image
    failure_reason: Optional[str] = None


class GeometryResult(BaseModel):
    """
    Owner: FaceMesh Specialist/ whoever will handle it.
    Populated by src/facemesh/ pipeline.
    All fields Optional — stub returns None until Sprint 2.
    We'll decide all the metrics to include in the next sprint, but these are some examples to start with. -  ayush
    """

    ear_mean: Optional[float] = Field(
        None, ge=0, le=1, description="Mean Eye Aspect Ratio across clip"
    )
    blink_rate_per_min: Optional[float] = Field(None, ge=0)
    landmark_jitter: Optional[float] = Field(
        None, ge=0, le=1, description="Normalised temporal jitter score"
    )
    lip_nose_coupling: Optional[float] = Field(None, ge=0, le=1)
    anomaly_score: Optional[float] = Field(None, ge=0, le=1)
    confidence: Optional[float] = Field(None, ge=0, le=1)
    landmark_map_url: Optional[str] = None
    failure_reason: Optional[str] = None


# ─────────────────────────────────────────────
#  Final fused result — what the frontend shows
# ─────────────────────────────────────────────


class AnalysisResult(BaseModel):
    """
    The final response. Fusion head combines stream scores.
    Version stamp allows frontend to handle schema evolution gracefully.
    """

    task_id: str
    status: AnalysisStatus
    media_type: MediaType
    verdict: Optional[Verdict] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    processing_ms: Optional[int] = None

    # Stream-specific sub-results (nullable until streams are live as we develop them in parallel)
    rppg_result: Optional[RPPGResult] = None
    geometry_result: Optional[GeometryResult] = None

    # Explainability assets to help users understand the verdict — nullable until we decide what to include here in the next sprint
    heatmap_url: Optional[str] = None
    report_url: Optional[str] = None

    # Error info if status == failed
    error_code: Optional[str] = None
    error_detail: Optional[str] = None

    # Schema version — frontend checks this to handle upgrades gracefully so no misinterpretation of fields if we add/remove fields in the future. Updated manually by Ayush when we make non-backwards-compatible changes to the schema.
    schema_version: str = "1.0.0"

    class Config:
        use_enum_values = True
