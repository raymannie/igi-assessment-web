"use client";

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A Base UI Select wired to react-hook-form.
 *
 * Two details this gets right that are easy to miss:
 *
 * 1. `items` is passed to `Select.Root`. Without it `Select.Value` renders the
 *    raw value, so the trigger reads "HMO_PRE_AUTHORIZATION" instead of
 *    "HMO pre-authorization".
 * 2. `onBlur` is deliberately *not* wired to the trigger. Choosing an option
 *    returns focus to the trigger, and that blur fires before the new value has
 *    propagated — under `mode: 'onBlur'` the field would validate as empty and
 *    show "Select a…" error next to the value the user just picked. Selects
 *    validate on submit (and on change afterwards) instead.
 */
export function SelectField<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  id,
  options,
  placeholder,
  invalid,
}: {
  /** All three generics, so forms whose resolver transforms values still fit. */
  control: Control<TFieldValues, TContext, TTransformedValues>;
  name: Path<TFieldValues>;
  id: string;
  options: readonly SelectOption[];
  placeholder: string;
  invalid?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          items={options}
          value={field.value ?? ""}
          onValueChange={(value) => field.onChange(value ?? "")}
        >
          <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
