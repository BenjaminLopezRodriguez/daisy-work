import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "@/server/auth";

const f = createUploadthing();

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UploadThingError("Unauthorized");
  }
  return { userId: session.user.id };
}

export const ourFileRouter = {
  /** Square-cropped profile photos. */
  profileImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(requireUser)
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: metadata.userId,
      url: file.ufsUrl,
    })),

  /** 16:9 service / portfolio / ad creative. */
  serviceImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(requireUser)
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: metadata.userId,
      url: file.ufsUrl,
    })),

  /** Deliverable docs (PDF, images, common office). */
  deliverableFile: f({
    image: { maxFileSize: "8MB", maxFileCount: 4 },
    pdf: { maxFileSize: "16MB", maxFileCount: 4 },
    text: { maxFileSize: "2MB", maxFileCount: 4 },
    blob: { maxFileSize: "16MB", maxFileCount: 4 },
  })
    .middleware(requireUser)
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: metadata.userId,
      url: file.ufsUrl,
      name: file.name,
      key: file.key,
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
