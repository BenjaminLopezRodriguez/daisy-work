import type { PixelCrop } from "react-image-crop";

/** Renders the cropped region of an image into a File. */
export async function cropImageToFile(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
  mimeType = "image/jpeg",
): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelWidth = Math.max(1, Math.floor(crop.width * scaleX));
  const pixelHeight = Math.max(1, Math.floor(crop.height * scaleY));

  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    pixelWidth,
    pixelHeight,
    0,
    0,
    pixelWidth,
    pixelHeight,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
      mimeType,
      0.92,
    );
  });

  return new File([blob], fileName, { type: mimeType });
}
