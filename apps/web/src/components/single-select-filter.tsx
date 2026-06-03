"use client";

import { useState } from "react";
import { ChevronDownIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type SingleSelectOption = {
  value: string;
  label: string;
  leading?: React.ReactNode;
};

type Props = {
  label: string;
  icon: LucideIcon;
  options: SingleSelectOption[];
  value: string | null;
  onChange: (next: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

/**
 * Single-select counterpart to MultiSelectFilter. Same Popover + Command look,
 * but the trigger shows the selected option's label (with its leading node)
 * instead of a count, and selecting an option closes the popover.
 */
export function SingleSelectFilter({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage = "No results.",
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  function select(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" className="h-9 gap-1.5">
            <Icon className="text-muted-foreground" />
            {selected ? (
              <span className="flex items-center gap-1.5 truncate">
                {selected.leading}
                <span className="truncate">{selected.label}</span>
              </span>
            ) : (
              placeholder ?? label
            )}
            <ChevronDownIcon className="opacity-60" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-0">
        <Command className="**:data-[slot=input-group]:border-input">
          <CommandInput placeholder={searchPlaceholder ?? `Filter ${label.toLowerCase()}…`} />
          <CommandList className="mt-2">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {options.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label}
                onSelect={() => select(opt.value)}
                data-checked={opt.value === value}
                className="cursor-pointer border border-transparent data-selected:border-input"
              >
                {opt.leading}
                <span className="truncate">{opt.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
