"use client";

import { FunnelIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { StatusToggles } from "@/components/requests/status-toggles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { RequestStatus } from "@/types";

export function FilterBar({
  search,
  statuses,
  onSearchChange,
  onToggleStatus,
  onClear,
  isFiltered,
}: {
  search: string;
  statuses: RequestStatus[];
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: RequestStatus) => void;
  onClear: () => void;
  isFiltered: boolean;
}) {
  // Local mirror so typing stays responsive; the URL is updated on a debounce.
  const [draft, setDraft] = useState(search);

  // When the URL's search term changes from outside (Clear filters, back
  // button), adopt it. Adjusting state during render is React's documented
  // pattern for this — an effect here would cause a cascading re-render.
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setDraft(search);
  }

  useEffect(() => {
    if (draft === search) return;
    const timer = setTimeout(() => onSearchChange(draft), 350);
    return () => clearTimeout(timer);
  }, [draft, search, onSearchChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search by number, description or policy"
            aria-label="Search requests"
            className="pl-7"
          />
          {draft ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setDraft("")}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        {/* Below md the status toggles collapse into a sheet. */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="md:hidden" />
            }
          >
            <FunnelIcon aria-hidden />
            Filter
            {statuses.length ? (
              <Badge variant="secondary" className="ml-0.5">
                {statuses.length}
              </Badge>
            ) : null}
          </SheetTrigger>
          <SheetContent side="bottom" className="gap-4 px-4 py-4">
            <SheetHeader className="px-0 text-left">
              <SheetTitle className="p-0">Filter by status</SheetTitle>
            </SheetHeader>
            <StatusToggles active={statuses} onToggle={onToggleStatus} />
            {isFiltered ? (
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear all filters
              </Button>
            ) : null}
          </SheetContent>
        </Sheet>

        {isFiltered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="hidden md:inline-flex"
          >
            <XIcon aria-hidden />
            Clear
          </Button>
        ) : null}
      </div>

      <StatusToggles
        active={statuses}
        onToggle={onToggleStatus}
        className="hidden md:flex"
      />
    </div>
  );
}
