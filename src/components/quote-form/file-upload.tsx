"use client";

import * as React from "react";
import { IconFileText, IconPhoto, IconUpload, IconX } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  UPLOAD_ACCEPT,
  UPLOAD_MAX_FILES_PER_FIELD,
  UPLOAD_MAX_TOTAL_BYTES,
  isAllowedUploadName,
} from "@/lib/quote-form/constants";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageName(name: string): boolean {
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

export type FileUploadFieldProps = {
  id: string;
  files: File[];
  onChange: (files: File[]) => void;
  /** Bytes already used by the *other* upload field (shared 4 MB budget). */
  otherBytes?: number;
  className?: string;
};

/**
 * Drag & drop / click-to-browse upload for the quote form (script + reference
 * assets). Client-side validation mirrors `/api/quote`: extension allowlist,
 * per-field file count, shared total-size budget.
 */
export function FileUploadField({
  id,
  files,
  onChange,
  otherBytes = 0,
  className,
}: FileUploadFieldProps) {
  const { t } = useLanguage();
  const u = t.quoteForm.upload;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function addFiles(incoming: FileList | File[]) {
    const next = [...files];
    let nextError: string | null = null;
    let total =
      otherBytes + next.reduce((sum, f) => sum + f.size, 0);

    for (const file of Array.from(incoming)) {
      // Skip duplicates first (repeated drops must not trip count/size errors).
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      if (next.length >= UPLOAD_MAX_FILES_PER_FIELD) {
        nextError = u.errorCount;
        break;
      }
      if (!isAllowedUploadName(file.name)) {
        nextError = u.errorType;
        continue;
      }
      if (total + file.size > UPLOAD_MAX_TOTAL_BYTES) {
        nextError = u.errorTooLarge;
        continue;
      }
      next.push(file);
      total += file.size;
    }

    setError(nextError);
    onChange(next);
  }

  function removeFile(index: number) {
    setError(null);
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${u.drop} ${u.browse}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed px-4 py-6 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          dragOver
            ? "border-primary/70 bg-primary/5"
            : "border-border/70 bg-card/40 hover:border-primary/40 hover:bg-card/70"
        )}
      >
        <span
          className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <IconUpload className="size-4.5" />
        </span>
        <p className="text-sm text-foreground">
          {u.drop}{" "}
          <span className="font-semibold text-section-accent">{u.browse}</span>
        </p>
        <p className="text-xs text-muted-foreground">{u.hint}</p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          multiple
          accept={UPLOAD_ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            // Allow re-selecting the same file after removing it.
            e.target.value = "";
          }}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/70 px-3 py-2"
            >
              <span className="text-muted-foreground" aria-hidden>
                {isImageName(file.name) ? (
                  <IconPhoto className="size-4.5" />
                ) : (
                  <IconFileText className="size-4.5" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={u.remove}
                title={u.remove}
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <IconX className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
