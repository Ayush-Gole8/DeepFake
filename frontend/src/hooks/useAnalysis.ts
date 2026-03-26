/**
 * useAnalysis.ts
 *
 * Upload + polling lifecycle controller for /analyse.
 * Keeps network orchestration out of UI components.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getStatus, uploadFile } from "../api/client";
import type { AnalysisResult, AnalysisTask, TaskStatus } from "../types/analysis";

export type UploadSelection = {
  video?: File;
  audio?: File;
  image?: File;
};

export type AnalysisLifecycleState = {
  status: TaskStatus | "idle";
  task: AnalysisTask | null;
  result: AnalysisResult | null;
  error: string | null;
  isLoading: boolean;
};

const POLL_INTERVAL_MS = 2000;

export function useAnalysis() {
  const [status, setStatus] = useState<AnalysisLifecycleState["status"]>("idle");
  const [task, setTask] = useState<AnalysisTask | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollTimerRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollUntilDone = useCallback(
    async (taskId: string) => {
      try {
        const latest = await getStatus(taskId);
        setResult(latest);
        setStatus(latest.status);

        if (latest.status === "completed" || latest.status === "failed") {
          stopPolling();
          setIsLoading(false);
          if (latest.error_detail) {
            setError(latest.error_detail);
          }
        }
      } catch (err) {
        stopPolling();
        setIsLoading(false);
        setError(err instanceof Error ? err.message : "Failed to fetch task status");
      }
    },
    [stopPolling],
  );

  const upload = useCallback(
    async (files: UploadSelection, sourceLabel?: string) => {
      const selected = files.video || files.audio || files.image;

      if (!selected) {
        setError("Select at least one media file before running analysis.");
        return;
      }

      stopPolling();
      setError(null);
      setTask(null);
      setResult(null);
      setStatus("idle");
      setIsLoading(true);

      try {
        const createdTask = await uploadFile(selected, sourceLabel);
        setTask(createdTask);
        setStatus(createdTask.status);

        await pollUntilDone(createdTask.task_id);

        pollTimerRef.current = window.setInterval(() => {
          void pollUntilDone(createdTask.task_id);
        }, POLL_INTERVAL_MS);
      } catch (err) {
        stopPolling();
        setIsLoading(false);
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [pollUntilDone, stopPolling],
  );

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    task,
    result,
    error,
    isLoading,
    upload,
  };
}
