"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cropImageToFile } from "@/lib/crop-image";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

export type ImageCropAspect = "square" | "video";

const ASPECT: Record<ImageCropAspect, number> = {
  square: 1,
  video: 16 / 9,
};

type Endpoint = "profileImage" | "serviceImage";

export function ImageCropUpload({
  endpoint,
  aspect,
  value,
  onChange,
  label,
  className,
}: {
  endpoint: Endpoint;
  aspect: ImageCropAspect;
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      const url = res[0]?.ufsUrl ?? res[0]?.url;
      if (url) onChange(url);
      cleanup();
    },
    onUploadError: (err) => {
      setError(err.message);
    },
  });

  function cleanup() {
    if (src) URL.revokeObjectURL(src);
    setSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onSelectFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const url = URL.createObjectURL(file);
    setSrc(url);
    setOpen(true);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initial = centerCrop(
      makeAspectCrop(
        { unit: "%", width: 90 },
        ASPECT[aspect],
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(initial);
  }

  async function onConfirmCrop() {
    if (!imgRef.current || !completedCrop) return;
    setError(null);
    try {
      const file = await cropImageToFile(
        imgRef.current,
        completedCrop,
        aspect === "square" ? "profile.jpg" : "service.jpg",
      );
      await startUpload([file]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Crop failed");
    }
  }

  const previewClass =
    aspect === "square"
      ? "aspect-square w-28 rounded-full"
      : "aspect-video w-full max-w-md rounded-xl";

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-sm font-medium">{label}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div
          className={cn(
            "relative overflow-hidden border border-border bg-muted",
            previewClass,
          )}
        >
          {value ? (
            <Image
              src={value}
              alt={label ?? "Uploaded image"}
              fill
              className="object-cover"
              sizes={aspect === "square" ? "112px" : "448px"}
              unoptimized={false}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onSelectFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {aspect === "square"
              ? "Square crop for your profile."
              : "16:9 crop for service photos."}
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) cleanup();
          else setOpen(true);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {aspect === "square" ? "Crop profile photo" : "Crop service photo"}
            </DialogTitle>
          </DialogHeader>
          {src ? (
            <div className="max-h-[60vh] overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={ASPECT[aspect]}
                circularCrop={aspect === "square"}
              >
                {/* Local object URL — next/image not needed for crop source */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={src}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-h-[55vh] w-full object-contain"
                />
              </ReactCrop>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={cleanup}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!completedCrop || isUploading}
              onClick={() => void onConfirmCrop()}
            >
              {isUploading ? "Uploading…" : "Use photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
