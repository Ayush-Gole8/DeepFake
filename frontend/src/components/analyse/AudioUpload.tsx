/**
 * AudioUpload.tsx
 *
 * Thin wrapper over UploadZone with audio-specific defaults.
 */

import UploadZone, { type UploadZoneProps } from "./UploadZone";

type AudioUploadProps = Omit<
  UploadZoneProps,
  "label" | "mediaType" | "accept" | "helperText"
> & {
  accept?: string;
  helperText?: string;
};

function AudioUpload({
  accept = "audio/*",
  helperText = "Upload an audio file",
  ...props
}: AudioUploadProps) {
  return (
    <UploadZone
      label="Audio"
      mediaType="audio"
      accept={accept}
      helperText={helperText}
      {...props}
    />
  );
}

export default AudioUpload;
