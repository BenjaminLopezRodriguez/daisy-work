"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

export type UploadedDoc = {
  url: string;
  name: string;
  key?: string;
};

function isImageUrl(url: string, name: string) {
  return (
    /\.(png|jpe?g|gif|webp|avif)$/i.test(name) ||
    /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url)
  );
}

export function DocumentUpload({
  value = [],
  onChange,
  label = "Documents",
  className,
  maxFiles = 4,
}: {
  value?: UploadedDoc[];
  onChange: (docs: UploadedDoc[]) => void;
  label?: string;
  className?: string;
  maxFiles?: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const remaining = maxFiles - value.length;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">
          {value.length}/{maxFiles}
        </p>
      </div>

      {value.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {value.map((doc) => (
            <li
              key={doc.url}
              className="border-border bg-card flex items-center gap-2 rounded-lg border p-2"
            >
              {isImageUrl(doc.url, doc.name) ? (
                <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={doc.url}
                    alt={doc.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-md">
                  <FileText className="text-muted-foreground size-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.name}</p>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline"
                >
                  Open
                </a>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Remove ${doc.name}`}
                onClick={() => onChange(value.filter((d) => d.url !== doc.url))}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining > 0 ? (
        <UploadButton
          endpoint="deliverableFile"
          appearance={{
            button:
              "ut-ready:bg-primary ut-uploading:cursor-not-allowed rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground after:bg-primary/80",
            allowedContent: "text-xs text-muted-foreground",
          }}
          onClientUploadComplete={(res) => {
            setError(null);
            const next = res.map((f) => ({
              url: f.ufsUrl,
              name: f.name,
              key: f.key,
            }));
            onChange([...value, ...next].slice(0, maxFiles));
          }}
          onUploadError={(err) => setError(err.message)}
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
