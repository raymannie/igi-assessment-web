"use client";

import {
  ClockCounterClockwiseIcon,
  FileArrowUpIcon,
  FilePlusIcon,
  UserCheckIcon,
  type Icon,
} from "@phosphor-icons/react";

import { EmptyState } from "@/components/common/states";
import { RoleBadge } from "@/components/layout/role-badge";
import { STATUS_META, statusLabel } from "@/lib/constants/statuses";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/types";

/**
 * The audit trail. Serves both portals unchanged — nothing here depends on who
 * is looking, because the entries are already denormalised (`actorName`,
 * `actorRole`) and the trail is append-only.
 */

/** Icon and colour come from the *resulting* status where there is one. */
function nodeVisual(entry: AuditLog): { icon: Icon; className: string } {
  const ACTION_FALLBACK: Partial<Record<AuditLog["action"], Icon>> = {
    REQUEST_CREATED: FilePlusIcon,
    REQUEST_ASSIGNED: UserCheckIcon,
    DOCUMENT_UPLOADED: FileArrowUpIcon,
  };

  if (entry.toStatus) {
    const meta = STATUS_META[entry.toStatus];
    return {
      icon: ACTION_FALLBACK[entry.action] ?? meta.icon,
      className: meta.className,
    };
  }

  return {
    icon: ACTION_FALLBACK[entry.action] ?? ClockCounterClockwiseIcon,
    className:
      "bg-zinc-100 text-zinc-600 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  };
}

/**
 * A readable sentence rather than an enum dump, e.g.
 * "Adaeze Okonkwo moved this from Under review to Approved".
 */
function describe(entry: AuditLog): string {
  const { action, fromStatus, toStatus } = entry;

  switch (action) {
    case "REQUEST_CREATED":
      return "submitted this request";
    case "REQUEST_ASSIGNED":
      return "assigned this request to themselves";
    case "CUSTOMER_RESPONDED":
      return "responded with more information";
    case "REQUEST_WITHDRAWN":
      return "withdrew this request";
    case "DOCUMENT_UPLOADED":
      return "uploaded documents";
    case "STATUS_CHANGED":
      if (fromStatus && toStatus) {
        return `moved this from ${statusLabel(fromStatus)} to ${statusLabel(toStatus)}`;
      }
      return toStatus ? `moved this to ${statusLabel(toStatus)}` : "changed the status";
    default:
      return "updated this request";
  }
}

/** `metadata.fileNames` per SPEC §5 — uploads show their file names inline. */
function fileNames(entry: AuditLog): string[] {
  const raw = entry.metadata?.fileNames;
  if (!Array.isArray(raw)) return [];
  return raw.filter((name): name is string => typeof name === "string");
}

function TimelineNode({
  entry,
  isLast,
}: {
  entry: AuditLog;
  isLast: boolean;
}) {
  const { icon: Icon, className } = nodeVisual(entry);
  const files = fileNames(entry);

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {/* Vertical connector, stopping at the final node. */}
      {!isLast ? (
        <span
          aria-hidden
          className="absolute top-6 left-3 -ml-px h-[calc(100%-1.5rem)] w-px bg-border"
        />
      ) : null}

      <span
        aria-hidden
        className={cn(
          "relative z-10 flex size-6 shrink-0 items-center justify-center ring-1",
          className
        )}
      >
        <Icon className="size-3.5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-xs">
          <span className="font-medium">{entry.actorName}</span>
          <RoleBadge role={entry.actorRole} showIcon={false} />
          <span className="text-muted-foreground">{describe(entry)}</span>
        </div>

        {entry.comment ? (
          <blockquote className="border-l-2 border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground">
            {entry.comment}
          </blockquote>
        ) : null}

        {files.length ? (
          <ul className="flex flex-col gap-0.5">
            {files.map((name) => (
              <li
                key={name}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <FileArrowUpIcon className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{name}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted-foreground">
          <time dateTime={entry.createdAt}>
            {formatDateTime(entry.createdAt)}
          </time>
          <span aria-hidden>·</span>
          <span>{formatRelative(entry.createdAt)}</span>
        </p>
      </div>
    </li>
  );
}

export function AuditTimeline({ entries }: { entries: AuditLog[] }) {
  if (!entries.length) {
    return (
      <EmptyState
        compact
        icon={<ClockCounterClockwiseIcon className="size-6" aria-hidden />}
        title="No history yet"
        description="Actions on this request will appear here."
      />
    );
  }

  // The API returns ascending by createdAt; sort defensively so the connector
  // line always reads top-to-bottom in chronological order.
  const ordered = [...entries].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <ol className="flex flex-col">
      {ordered.map((entry, index) => (
        <TimelineNode
          key={entry._id}
          entry={entry}
          isLast={index === ordered.length - 1}
        />
      ))}
    </ol>
  );
}
