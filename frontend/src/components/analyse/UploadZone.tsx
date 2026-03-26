/**
 * UploadZone.tsx
 *
 * Reusable drag/drop + browse upload zone with preview and validation messaging.
 */

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FileAudio2, FileImage, FileVideo2, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import type { MediaType } from "../../types/analysis";

export type UploadZoneProps = {
  label: string;
  mediaType: MediaType;
  accept: string;
  helperText: string;
  file?: File;
  error?: string | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

function iconFor(type: MediaType) {
  if (type === "video") return <FileVideo2 className="h-5 w-5 text-cyan-200" />;
  if (type === "audio") return <FileAudio2 className="h-5 w-5 text-cyan-200" />;
  return <FileImage className="h-5 w-5 text-cyan-200" />;
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function UploadZone({
  label,
  mediaType,
  accept,
  helperText,
  file,
  error,
  disabled,
  onSelect,
  onRemove,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file || mediaType === "audio") {
      return null;
    }
    return URL.createObjectURL(file);
  }, [file, mediaType]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function openPicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);

    if (disabled) {
      return;
    }

    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      onSelect(dropped);
    }
  }

  function handleBrowse(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!selected || disabled) {
      return;
    }

    onSelect(selected);
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={[
        "rounded-2xl border p-4 transition",
        isDragActive ? "border-cyan-300 bg-cyan-500/10" : "border-white/10 bg-slate-900/70",
        disabled ? "opacity-70" : "",
      ].join(" ")}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragActive(true);
        }
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {iconFor(mediaType)}
          <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
        </div>

        {file ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex rounded-md border border-white/15 p-1 text-slate-300 hover:bg-white/10"
            aria-label={`Remove ${label} file`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleBrowse}
      />

      {!file ? (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 px-3 py-6 text-center hover:border-cyan-300/50"
        >
          <Upload className="mb-2 h-5 w-5 text-cyan-200" />
          <span className="text-sm font-medium text-slate-200">Drag and drop or click to browse</span>
          <span className="mt-1 text-xs text-slate-400">{helperText}</span>
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/70 p-3">
          {mediaType === "audio" ? (
            <div className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-white/15 bg-slate-900/80">
              <FileAudio2 className="h-8 w-8 text-cyan-300" />
            </div>
          ) : null}

          {previewUrl && mediaType === "image" ? (
            <img src={previewUrl} alt="Selected preview" className="h-28 w-full rounded-lg object-cover" />
          ) : null}

          {previewUrl && mediaType === "video" ? (
            <video src={previewUrl} className="h-28 w-full rounded-lg object-cover" muted playsInline />
          ) : null}

          <div className="space-y-1 text-left">
            <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
            <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
          </div>
        </div>
      )}

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </motion.div>
  );
}

export default UploadZone;