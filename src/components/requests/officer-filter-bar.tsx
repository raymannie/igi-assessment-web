"use client";

import { FunnelIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";

import { StatusToggles } from "@/components/requests/status-toggles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  PRODUCT_CATEGORY_OPTIONS,
  REQUEST_TYPE_OPTIONS,
} from "@/lib/constants/statuses";
import type { OfficerFilters } from "@/hooks/use-officer-filters";
import type { ProductCategory, RequestStatus, RequestType } from "@/types";

const ANY = "__any__";

function LabelledSelect({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  // Base UI has no empty-string item, so "any" is a sentinel mapped back to "".
  const items = [{ value: ANY, label: placeholder }, ...options];

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        items={items}
        value={value || ANY}
        onValueChange={(next) => onChange(next === ANY ? "" : String(next ?? ""))}
      >
        <SelectTrigger id={id} size="sm" className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Controls({
  filters,
  setFilters,
  onToggleStatus,
}: {
  filters: OfficerFilters;
  setFilters: (patch: Partial<OfficerFilters>) => void;
  onToggleStatus: (status: RequestStatus) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Status</span>
        <StatusToggles active={filters.status} onToggle={onToggleStatus} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <LabelledSelect
          id="filter-requestType"
          label="Request type"
          value={filters.requestType}
          placeholder="Any type"
          options={REQUEST_TYPE_OPTIONS}
          onChange={(value) =>
            setFilters({ requestType: value as RequestType | "" })
          }
        />
        <LabelledSelect
          id="filter-productCategory"
          label="Product category"
          value={filters.productCategory}
          placeholder="Any category"
          options={PRODUCT_CATEGORY_OPTIONS}
          onChange={(value) =>
            setFilters({ productCategory: value as ProductCategory | "" })
          }
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-dateFrom">Submitted from</Label>
          <Input
            id="filter-dateFrom"
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            onChange={(event) => setFilters({ dateFrom: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-dateTo">Submitted to</Label>
          <Input
            id="filter-dateTo"
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={(event) => setFilters({ dateTo: event.target.value })}
          />
        </div>
      </div>

      <label
        htmlFor="filter-assignedToMe"
        className="flex w-fit cursor-pointer items-center gap-2 text-xs select-none"
      >
        <input
          id="filter-assignedToMe"
          type="checkbox"
          checked={filters.assignedToMe}
          onChange={(event) =>
            setFilters({ assignedToMe: event.target.checked })
          }
          className="size-3.5 accent-primary"
        />
        Only requests assigned to me
      </label>
    </>
  );
}

export function OfficerFilterBar({
  filters,
  setFilters,
  onToggleStatus,
  onClear,
  isFiltered,
  activeCount,
}: {
  filters: OfficerFilters;
  setFilters: (patch: Partial<OfficerFilters>) => void;
  onToggleStatus: (status: RequestStatus) => void;
  onClear: () => void;
  isFiltered: boolean;
  activeCount: number;
}) {
  // Local mirror so typing stays responsive; the URL is updated on a debounce.
  const [draft, setDraft] = useState(filters.search);

  // Adopt outside changes (Clear, back button) during render rather than in an
  // effect, which would cascade renders.
  const [lastSearch, setLastSearch] = useState(filters.search);
  if (filters.search !== lastSearch) {
    setLastSearch(filters.search);
    setDraft(filters.search);
  }

  useEffect(() => {
    if (draft === filters.search) return;
    const timer = setTimeout(() => setFilters({ search: draft }), 350);
    return () => clearTimeout(timer);
  }, [draft, filters.search, setFilters]);

  const clearButton: ReactNode = isFiltered ? (
    <Button variant="ghost" size="sm" onClick={onClear}>
      <XIcon aria-hidden />
      Clear all
    </Button>
  ) : null;

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

        {/* Everything collapses into a sheet below md. */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="md:hidden" />
            }
          >
            <FunnelIcon aria-hidden />
            Filter
            {activeCount ? (
              <Badge variant="secondary" className="ml-0.5">
                {activeCount}
              </Badge>
            ) : null}
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] gap-4 overflow-y-auto px-4 py-4"
          >
            <SheetHeader className="px-0 text-left">
              <SheetTitle className="p-0">Filter the queue</SheetTitle>
            </SheetHeader>
            <Controls
              filters={filters}
              setFilters={setFilters}
              onToggleStatus={onToggleStatus}
            />
            {clearButton}
          </SheetContent>
        </Sheet>

        <span className="hidden md:inline-flex">{clearButton}</span>
      </div>

      <div className="hidden flex-col gap-3 md:flex">
        <Controls
          filters={filters}
          setFilters={setFilters}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </div>
  );
}
