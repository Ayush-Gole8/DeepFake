/**
 * client.ts
 *
 * Centralized API client for analysis endpoints.
 * All network requests are routed through this module.
 */

import axios, { AxiosError } from "axios";
import type { AnalysisResult, AnalysisTask, UploadConstraints } from "../types/analysis";

type BackendErrorPayload = {
  detail?: string;
  error_detail?: string;
  message?: string;
};

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000,
});

function toApiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const payload = (error as AxiosError<BackendErrorPayload>).response?.data;
    const message = payload?.error_detail || payload?.detail || payload?.message || error.message;
    return new Error(message || "Request failed");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unexpected API error");
}

export async function uploadFile(file: File, sourceLabel?: string): Promise<AnalysisTask> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    if (sourceLabel?.trim()) {
      formData.append("source_label", sourceLabel.trim());
    }

    const { data } = await api.post<AnalysisTask>("/api/v1/analyse/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getStatus(taskId: string): Promise<AnalysisResult> {
  try {
    const { data } = await api.get<AnalysisResult>(`/api/v1/analyse/status/${taskId}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getConstraints(): Promise<UploadConstraints> {
  try {
    const { data } = await api.get<UploadConstraints>("/api/v1/analyse/constraints");
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
