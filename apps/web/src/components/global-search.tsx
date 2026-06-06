"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RandomItemCarousel } from "@/features/items/components/random-item-carousel";
import { SelectionOutline } from "@/features/items/components/selection-outline";
import { TagDot, TagOverflowDot } from "@/features/tags/components/tag-dot";
import { deterministicColor } from "@/lib/tags";
import {
  useFindSelection,
  useSearchPreview,
} from "@/features/items/hooks/use-find-selection";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMac } from "@/hooks/use-is-mac";
import { useListItems } from "@/lib/api/generated/items";
import { itemImageUrl } from "@/lib/api/urls";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const trimmedQuery = debouncedQuery.trim();
  const isMac = useIsMac();
  const inputRef = useRef<HTMLInputElement>(null);

  // While the dialog is open, the search input must never lose focus, so the
  // user can keep typing after clicking a result (or anywhere else) without
  // having to click back into the field. On blur, focus has already begun
  // moving away, so we pull it back on the next tick.
  function handleInputBlur() {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Reset the query on close so the dialog opens fresh next time.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  const { data: items = [] } = useListItems(
    { q: trimmedQuery },
    { query: { enabled: open && trimmedQuery.length > 0 } },
  );

  // Selection is backed by the global find store, so toggling here mirrors the
  // Items page exactly — and items already selected elsewhere show as selected.
  const { isSelected, toggle } = useFindSelection();

  // Live preview: light (dimly) the cells of every item currently in the
  // results as the user types. This is a transient layer beneath the manual
  // selections above — refining the query re-lights only the current matches,
  // and emptying the query or closing the dialog clears it.
  const { setPreviewItems, clearPreview } = useSearchPreview();

  useEffect(() => {
    if (open && trimmedQuery.length > 0) setPreviewItems(items);
    else clearPreview();
  }, [open, trimmedQuery, items, setPreviewItems, clearPreview]);

  // Belt-and-suspenders: clear the preview if this component unmounts mid-search.
  useEffect(() => () => clearPreview(), [clearPreview]);

  function handleSelect(item: ItemRead) {
    // "Find" the item (light its cells + mark it selected). The dialog stays
    // open so multiple items can be selected in one session.
    toggle(item);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-2 text-muted-foreground text-xs px-3 w-48 justify-between"
      >
        <span className="flex items-center gap-2">
          <SearchIcon className="h-3.5 w-3.5" />
          Search…
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] sm:flex">
          {isMac ? "⌘F" : "Ctrl+F"}
        </kbd>
      </Button>

      {/* Sizing overrides live here (not in the vendored ui/ files): widen the
          dialog and scale up input, list, rows, and text by ~25%. */}
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        className="sm:max-w-xl"
      >
        <CommandInput
          ref={inputRef}
          placeholder="Search items, devices…"
          value={query}
          onValueChange={setQuery}
          onBlur={handleInputBlur}
          className="h-10! text-base"
        />
        <CommandList className="max-h-96">
          {trimmedQuery.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-1 pt-8 pb-2 text-center text-base text-muted-foreground">
              <span className="flex flex-col items-center gap-2">
                <SearchIcon className="h-6 w-6 opacity-50" />
                <span className="accent-shimmer font-medium">
                  Type to search…
                </span>
              </span>
              <RandomItemCarousel active={open && trimmedQuery.length === 0} />
            </div>
          ) : (
            <CommandEmpty className="py-8 text-base">
              No results found.
            </CommandEmpty>
          )}
          {items.length > 0 && (
            <CommandGroup heading="Items">
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  // cmdk filters items by `value` against the typed text. The
                  // backend already matched on name, so using the name keeps
                  // every server result visible. (Suffix the id to keep values
                  // unique when two items share a name.)
                  value={`${item.name} ${item.id}`}
                  onSelect={() => handleSelect(item)}
                  className="relative gap-3 py-2.5 text-base cursor-pointer"
                >
                  {isSelected(item.id) && <SelectionOutline rounded={8} />}
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={itemImageUrl(item.id, "64x64", item.updated_at)}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium">
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 truncate">{item.name}</span>
                  {(item.tags ?? []).length > 0 && (
                    <div className="flex shrink-0 items-center gap-1">
                      {(item.tags ?? []).slice(0, 2).map((tag) => (
                        <TagDot
                          key={tag.id}
                          label={tag.name}
                          color={tag.color || deterministicColor(tag.name)}
                        />
                      ))}
                      {(item.tags ?? []).length > 2 && (
                        <TagOverflowDot
                          count={(item.tags ?? []).length - 2}
                          hiddenTags={(item.tags ?? [])
                            .slice(2)
                            .map((t) => ({
                              name: t.name,
                              color: t.color || deterministicColor(t.name),
                            }))}
                        />
                      )}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
