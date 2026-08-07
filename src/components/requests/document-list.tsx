"use client";

import {
  ArrowSquareOutIcon,
  FileImageIcon,
  FilePdfIcon,
  FileIcon,
  type Icon,
} from "@phosphor-icons/react";

import { EmptyState } from "@/components/common/states";
import { formatDate, formatFileSize } from "@/lib/format";
import type { RequestDocument } from "@/types";

function iconFor(mimeType: string): Icon {
  if (mimeType === "application/pdf") return FilePdfIcon;
  if (mimeType.startsWith("image/")) return FileImageIcon;
  return FileIcon;
}

/**
 * SPEC §11 assumption 6: these are public Cloudinary URLs, so a plain link is
 * enough. Production would use signed, time-limited delivery.
 */
export function DocumentList({
  documents,
}: {
  documents: RequestDocument[];
}) {
  if (!documents.length) {
    return (
      <EmptyState
        compact
        icon={<FileIcon className="size-6" aria-hidden />}
        title="No documents attached"
        description="Any files added to this request will be listed here."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y">
      {documents.map((document) => {
        const DocIcon = iconFor(document.mimeType);

        return (
          <li key={document.publicId || document.url}>
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center bg-muted">
                <DocIcon className="size-4" aria-hidden />
              </span>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium">
                  {document.fileName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(document.size)} ·{" "}
                  {formatDate(document.uploadedAt)}
                </span>
              </div>

              <ArrowSquareOutIcon
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="sr-only">Opens in a new tab</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
