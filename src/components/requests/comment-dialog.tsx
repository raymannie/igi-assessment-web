"use client";

import { SpinnerIcon } from "@phosphor-icons/react";
import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Used for the transitions SPEC §3 marks comment-required. Submit stays disabled
 * until the textarea holds something other than whitespace, mirroring the
 * backend's COMMENT_REQUIRED rule rather than relying on it.
 */
export function CommentDialog({
  trigger,
  title,
  description,
  label,
  placeholder,
  confirmLabel,
  pendingLabel,
  variant = "default",
  onConfirm,
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  pendingLabel?: string;
  variant?: "default" | "destructive";
  /** Resolve true to close the dialog; false keeps it open for another attempt. */
  onConfirm: (comment: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);

  const trimmed = comment.trim();
  const canSubmit = trimmed.length > 0 && !pending;

  const submit = async () => {
    if (!canSubmit) return;
    setPending(true);
    try {
      if (await onConfirm(trimmed)) {
        setOpen(false);
        setComment("");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setComment("");
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transition-comment">{label}</Label>
          <Textarea
            id="transition-comment"
            rows={4}
            autoFocus
            value={comment}
            placeholder={placeholder}
            disabled={pending}
            onChange={(event) => setComment(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This is recorded on the audit trail and shown to the customer.
          </p>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button variant={variant} disabled={!canSubmit} onClick={submit}>
            {pending ? (
              <>
                <SpinnerIcon className="animate-spin" aria-hidden />
                {pendingLabel ?? "Saving…"}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
