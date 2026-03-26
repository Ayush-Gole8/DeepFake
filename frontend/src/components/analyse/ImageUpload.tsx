/**
 * ImageUpload.tsx
 *
 * Thin wrapper over UploadZone with image-specific defaults.
 */

import UploadZone, { type UploadZoneProps } from "./UploadZone";

type ImageUploadProps = Omit<
  UploadZoneProps,
  "label" | "mediaType" | "accept" | "helperText"
> & {
  accept?: string;
  helperText?: string;
};

function ImageUpload({
  accept = "image/*",
  helperText = "Upload an image file",
  ...props
}: ImageUploadProps) {
  return (
    <UploadZone
      label="Image"
      mediaType="image"
      accept={accept}
      helperText={helperText}
      {...props}
    />
  );
}

export default ImageUpload;
