/**
 * Analyse.tsx
 *
 * End-to-end analysis page for the /analyse route.
 * Responsibilities:
 * - fetch backend upload constraints
 * - validate selected files client-side
 * - delegate upload/polling to useAnalysis
 * - display task state, errors, and final result
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import UploadZone from "../components/analyse/UploadZone";
import ResultPanel from "../components/analyse/ResultPanel";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import { getConstraints } from "../api/client";
import { useAnalysis } from "../hooks/useAnalysis";
import type { MediaType, UploadConstraints } from "../types/analysis";

type SelectedFiles = {
  video?: File;
  audio?: File;
  image?: File;
};

type FileErrors = {
  video?: string | null | undefined;
  audio?: string | null | undefined;
  image?: string | null | undefined;
};

function bytesFromMb(maxMb: number) {
  return maxMb * 1024 * 1024;
}

function mediaSpec(constraints: UploadConstraints, media: MediaType) {
  switch (media) {
    case "video":
      return constraints.video;
    case "audio":
      return constraints.audio;
    case "image":
      return constraints.image;
    default:
      throw new Error(`Unsupported media type: ${media}`);
  }
}

function formatAllowedTypes(types: string[]) {
  return types.join(", ");
}

function mediaMimePrefix(media: MediaType) {
  if (media === "video") return "video/";
  if (media === "audio") return "audio/";
  return "image/";
}

function validateMediaFamily(file: File, media: MediaType): string | null {
  const expectedPrefix = mediaMimePrefix(media);
  if (file.type && !file.type.startsWith(expectedPrefix)) {
    return `Expected a ${media} file, got ${file.type}`;
  }
  return null;
}

function Analyse() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({});
  const [fileErrors, setFileErrors] = useState<FileErrors>({});
  const [sourceLabel, setSourceLabel] = useState("");
  const [constraints, setConstraints] = useState<UploadConstraints | null>(
    null,
  );

  const { status, task, result, error, isLoading, upload } = useAnalysis();

  const loadConstraints = useCallback(async () => {
    try {
      const data = await getConstraints();
      setConstraints(data);
    } catch {
      // Constraints are optional for UX; backend validation still applies.
    }
  }, []);

  useEffect(() => {
    void loadConstraints();
  }, [loadConstraints]);

  useEffect(() => {
    if (!constraints) return;

    setSelectedFiles((prevFiles) => {
      const updatedFiles = { ...prevFiles } as SelectedFiles;
      const newErrors: FileErrors = {};

      (["video", "audio", "image"] as MediaType[]).forEach((media) => {
        const file = prevFiles[media];
        if (!file) return;

        const error = validateFile(file, media, constraints);

        if (error) {
          updatedFiles[media] = undefined; // clear invalid file
          newErrors[media] = error;
        } else {
          newErrors[media] = null;
        }
      });

      // Update errors atomically
      setFileErrors((prevErrors) => ({
        ...prevErrors,
        ...newErrors,
      }));

      return updatedFiles;
    });
  }, [constraints]);

  const hasAnyFile = Boolean(
    selectedFiles.video || selectedFiles.audio || selectedFiles.image,
  );

  const canSubmit =
    hasAnyFile &&
    !isLoading &&
    !fileErrors.video &&
    !fileErrors.audio &&
    !fileErrors.image;

  const backendError = error ?? result?.error_detail ?? null;

  const statusBadgeVariant = useMemo(() => {
    if (status === "failed") return "danger" as const;
    if (status === "completed") return "success" as const;
    if (status === "processing" || status === "queued") return "info" as const;
    return "neutral" as const;
  }, [status]);

  function validateFile(
    file: File,
    media: MediaType,
    currentConstraints: UploadConstraints,
  ): string | null {
    const mediaTypeError = validateMediaFamily(file, media);
    if (mediaTypeError) {
      return mediaTypeError;
    }

    const spec = mediaSpec(currentConstraints, media);
    const allowedSet = new Set(spec.allowed_types);
    const maxBytes = bytesFromMb(spec.max_mb);

    if (file.type && !allowedSet.has(file.type)) {
      return `Unsupported MIME type: ${file.type}`;
    }

    if (file.size > maxBytes) {
      return `File exceeds ${spec.max_mb} MB limit`;
    }

    return null;
  }

  function setSelected(media: MediaType, file?: File) {
    setSelectedFiles((prev) => ({ ...prev, [media]: file }));
  }

  function removeFile(media: MediaType) {
    setSelected(media, undefined);
    setFileErrors((prev) => ({ ...prev, [media]: null }));
  }

  function handleSelect(media: MediaType, file: File) {
    // Allow selection immediately. If constraints are already present
    // validate synchronously; otherwise store selection as pending and
    // validate retroactively when constraints arrive.
    setSelected(media, file);

    const mediaTypeError = validateMediaFamily(file, media);
    if (mediaTypeError) {
      setFileErrors((prev) => ({ ...prev, [media]: mediaTypeError }));
      setSelected(media, undefined);
      return;
    }

    if (!constraints) {
      // leave error entry undefined to indicate "pending validation"
      setFileErrors((prev) => {
        const next = { ...prev } as FileErrors;
        delete (next as any)[media];
        return next;
      });
      return;
    }

    const validation = validateFile(file, media, constraints);
    if (validation) {
      setFileErrors((prev) => ({ ...prev, [media]: validation }));
      setSelected(media, undefined);
      return;
    }

    setFileErrors((prev) => ({ ...prev, [media]: null }));
  }

  async function handleAnalyse() {
    if (!canSubmit) {
      return;
    }

    await upload(selectedFiles, sourceLabel.trim() || undefined);
  }

  const videoAccept = constraints
    ? formatAllowedTypes(constraints.video.allowed_types)
    : "video/*";
  const audioAccept = constraints
    ? formatAllowedTypes(constraints.audio.allowed_types)
    : "audio/*";
  const imageAccept = constraints
    ? formatAllowedTypes(constraints.image.allowed_types)
    : "image/*";

  const videoHelper = constraints
    ? `Allowed: ${formatAllowedTypes(constraints.video.allowed_types)} | Max ${constraints.video.max_mb} MB`
    : "Click to browse or drag and drop.";
  const audioHelper = constraints
    ? `Allowed: ${formatAllowedTypes(constraints.audio.allowed_types)} | Max ${constraints.audio.max_mb} MB`
    : "Click to browse or drag and drop.";
  const imageHelper = constraints
    ? `Allowed: ${formatAllowedTypes(constraints.image.allowed_types)} | Max ${constraints.image.max_mb} MB`
    : "Click to browse or drag and drop.";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 sm:text-3xl">
              Analyse Media
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Upload one file at a time. The backend validates the content type,
              stores the request, and queues analysis.
            </p>
          </div>
          <Badge variant={statusBadgeVariant}>
            Status: {status.toUpperCase()}
          </Badge>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-400">
          If multiple files are selected, the hook prioritizes video over audio
          and audio over image.
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <UploadZone
            label="Video"
            mediaType="video"
            accept={videoAccept}
            helperText={videoHelper}
            file={selectedFiles.video}
            error={fileErrors.video}
            disabled={isLoading}
            onSelect={(file) => handleSelect("video", file)}
            onRemove={() => removeFile("video")}
          />

          <UploadZone
            label="Audio"
            mediaType="audio"
            accept={audioAccept}
            helperText={audioHelper}
            file={selectedFiles.audio}
            error={fileErrors.audio}
            disabled={isLoading}
            onSelect={(file) => handleSelect("audio", file)}
            onRemove={() => removeFile("audio")}
          />

          <UploadZone
            label="Image"
            mediaType="image"
            accept={imageAccept}
            helperText={imageHelper}
            file={selectedFiles.image}
            error={fileErrors.image}
            disabled={isLoading}
            onSelect={(file) => handleSelect("image", file)}
            onRemove={() => removeFile("image")}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Source label (optional)
            </span>
            <input
              type="text"
              value={sourceLabel}
              onChange={(event) => setSourceLabel(event.target.value)}
              placeholder="e.g. social_clip_17"
              className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/50 focus:ring"
            />
          </label>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleAnalyse()}
            aria-disabled={!canSubmit}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-400 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {isLoading ? "Analysing..." : "Analyse"}
          </button>
        </div>
      </section>

      {isLoading ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-sm text-cyan-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            Polling analysis status every 2 seconds
          </div>
          <ProgressBar label="Running multimodal analysis" />
          {task ? (
            <p className="mt-2 text-xs text-cyan-100/80">
              Task ID: {task.task_id}
            </p>
          ) : null}
        </motion.section>
      ) : null}

      {backendError ? (
        <section className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 text-sm text-rose-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <p>{backendError}</p>
          </div>
        </section>
      ) : null}

      {status === "completed" && result ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Analysis completed</span>
          </div>
          <ResultPanel result={result} />
        </motion.div>
      ) : null}
    </div>
  );
}

export default Analyse;
