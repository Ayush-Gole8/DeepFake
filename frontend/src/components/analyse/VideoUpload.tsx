/**
 * VideoUpload.tsx
 *
 * Thin wrapper over UploadZone with video-specific defaults.
 */

import UploadZone, { type UploadZoneProps } from "./UploadZone";

type VideoUploadProps = Omit<
  UploadZoneProps,
  "label" | "mediaType" | "accept" | "helperText"
> & {
  accept?: string;
  helperText?: string;
};

function VideoUpload({
  accept = "video/*",
  helperText = "Upload a video file",
  ...props
}: VideoUploadProps) {
  return (
    <UploadZone
      label="Video"
      mediaType="video"
      accept={accept}
      helperText={helperText}
      {...props}
    />
  );
}

export default VideoUpload;
