"use client";

import { FilePdfIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
} from "@/lib/schemas/request";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Drag-and-drop plus click. Type and size are checked here, before the request,
 * mirroring the server rules in SPEC §7 — the server still validates, this is
 * just so the user finds out immediately.
 *
 * Progress is deliberately indeterminate: `fetch` exposes no upload progress
 * event, so a percentage would be a lie. A real percentage needs a custom
 * `queryFn` around XMLHttpRequest — not worth pulling in another HTTP client.
 */

function rejectionReason(file: File): string | null {
  const typeOk =
    (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type) &&
    ACCEPTED_EXTENSIONS.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );
  if (!typeOk) return "must be a PDF, JPG or PNG";
  if (file.size > MAX_FILE_SIZE) return "is larger than 5 MB";
  return null;
}

function ImageThumb({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);

  // The object URL is written straight to the DOM node rather than held in
  // state: no cascading render, and the cleanup revokes it so the blob is not
  // leaked when the row is removed or the file swapped.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const image = imageRef.current;
    if (image) image.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob: preview, next/image cannot optimise it
    <img
      ref={imageRef}
      alt=""
      className="size-9 shrink-0 bg-muted object-cover"
      aria-hidden
    />
  );
}

export function DocumentUploader({
  files,
  onChange,
  disabled,
  uploading = false,
  max = MAX_FILES_PER_UPLOAD,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  /** Drives the indeterminate bar on each row. */
  uploading?: boolean;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  const remaining = max - files.length;
  const accept = useMemo(() => ACCEPTED_EXTENSIONS.join(","), []);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;

    const problems: string[] = [];
    const accepted: File[] = [];

    for (const file of Array.from(incoming)) {
      const reason = rejectionReason(file);
      if (reason) {
        problems.push(`${file.name} ${reason}`);
        continue;
      }
      const duplicate = files.some(
        (existing) =>
          existing.name === file.name && existing.size === file.size
      );
      if (duplicate) continue;
      accepted.push(file);
    }

    const room = max - files.length;
    if (accepted.length > room) {
      problems.push(`Only ${max} files can be attached — the rest were skipped`);
    }

    setRejected(problems);
    if (accepted.length) onChange([...files, ...accepted.slice(0, room)]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 border border-dashed px-4 py-6 text-center transition-colors",
          dragging ? "border-ring bg-muted/60" : "border-input",
          disabled && "opacity-50"
        )}
      >
        <UploadSimpleIcon className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-xs">
          Drag files here, or{" "}
          <button
            type="button"
            disabled={disabled || remaining <= 0}
            onClick={() => inputRef.current?.click()}
            className="text-foreground underline underline-offset-4 disabled:no-underline disabled:opacity-50"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, JPG or PNG · up to 5 MB each · {remaining} of {max} remaining
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            addFiles(event.target.files);
            // Reset so re-picking the same file fires onChange again.
            event.target.value = "";
          }}
        />
      </div>

      {rejected.length ? (
        <ul className="flex flex-col gap-0.5" role="alert">
          {rejected.map((problem) => (
            <li key={problem} className="text-xs text-destructive">
              {problem}
            </li>
          ))}
        </ul>
      ) : null}

      {files.length ? (
        <ul className="flex flex-col divide-y border">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex flex-col gap-1 p-2"
            >
              <div className="flex items-center gap-2">
                {file.type.startsWith("image/") ? (
                  <ImageThumb file={file} />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center bg-muted">
                    <FilePdfIcon className="size-4" aria-hidden />
                  </span>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${file.name}`}
                  disabled={disabled}
                  onClick={() =>
                    onChange(files.filter((entry) => entry !== file))
                  }
                >
                  <TrashIcon aria-hidden />
                </Button>
              </div>

              {uploading ? (
                <div
                  className="h-0.5 w-full overflow-hidden bg-muted"
                  role="progressbar"
                  aria-label={`Uploading ${file.name}`}
                >
                  <div className="h-full w-1/3 animate-[indeterminate_1.1s_ease-in-out_infinite] bg-primary" />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
