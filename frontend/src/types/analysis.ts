/**
 * analysis.ts
 *
 * Frontend mirror of backend schema contract:
 * src/backend/api/schemas.py
 *
 * Version: 1.0.0
 * Owner: Team Lead (Ayush)
 *
 * Rules:
 * - Keep this file synchronized with backend schema changes in the same PR.
 * - Do not add business logic here.
 * - Use only for API contracts, UI typing, and request/response validation.
 */
export const SCHEMA_VERSION = "1.0.0";

export type MediaType = "video" | "audio" | "image";
export type Verdict = "real" | "fake" | "inconclusive";
export type TaskStatus = "queued" | "processing" | "completed" | "failed";

export interface AnalysisTask {
  task_id: string;
  media_type: MediaType;
  status: TaskStatus;
  message: string;
  poll_url: string;
}

export interface RPPGResult {
  bpm_estimate: number | null;
  signal_quality: number | null;
  spatial_coherence: number | null;
  is_biological: boolean | null;
  confidence: number | null;
  ppg_map_url: string | null;
  failure_reason: string | null;
}

export interface GeometryResult {
  ear_mean: number | null;
  blink_rate_per_min: number | null;
  landmark_jitter: number | null;
  lip_nose_coupling: number | null;
  anomaly_score: number | null;
  confidence: number | null;
  landmark_map_url: string | null;
  failure_reason: string | null;
}

export interface AnalysisResult {
  task_id: string;
  status: TaskStatus;
  media_type: MediaType;
  verdict: Verdict | null;
  confidence: number | null;
  processing_ms: number | null;
  rppg_result: RPPGResult | null;
  geometry_result: GeometryResult | null;
  heatmap_url: string | null;
  report_url: string | null;
  error_code: string | null;
  error_detail: string | null;
  schema_version: string;
}

export interface UploadConstraints {
  video: {
    max_mb: number;
    max_seconds: number;
    min_seconds: number;
    allowed_types: string[];
  };
  audio: { max_mb: number; allowed_types: string[] };
  image: { max_mb: number; allowed_types: string[] };
}

export default AnalysisResult;
