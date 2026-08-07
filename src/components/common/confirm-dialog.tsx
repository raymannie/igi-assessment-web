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

/**
 * Destructive and irreversible actions go through this (CLAUDE.md rule 8).
 * Stays open while `onConfirm` is in flight and closes only on success, so a
 * failure leaves the user where they were with the toast explaining why.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  pendingLabel,
  variant = "destructive",
  onConfirm,
}: {
  /** An element, not arbitrary nodes — Base UI clones it as the trigger. */
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    try {
      if (await onConfirm()) setOpen(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button variant={variant} disabled={pending} onClick={confirm}>
            {pending ? (
              <>
                <SpinnerIcon className="animate-spin" aria-hidden />
                {pendingLabel ?? "Working…"}
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
