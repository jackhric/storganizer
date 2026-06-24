"use client";

import { useMemo, useState } from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useRandomItems } from "@/lib/api/generated/items";
import { itemImageUrl } from "@/lib/api/urls";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

/**
 * An infinite, auto-scrolling marquee of item images shown in the global search
 * dialog before the user has typed anything. Pauses on hover.
 */
export function RandomItemCarousel({ active }: { active: boolean }) {
  // The backend returns up to 10 already-randomized items.
  const { data: items = [] } = useRandomItems(
    { limit: 10 },
    { query: { enabled: active } },
  );

  const slides = useMemo(() => {
    // embla's loop only engages when slides overflow the viewport, and the
    // loop seam is only invisible when the looped content is several times the
    // viewport width. With ≤10 items, repeat the list to a generous count so
    // the wraparound happens rarely and off-screen. ~40 slides of 64px is
    // ~2.5k px — comfortably several dialog-widths.
    if (items.length === 0) return items;
    const out = [...items];
    while (out.length < 40) out.push(...items);
    return out;
  }, [items]);

  // Create the autoscroll plugin once per mount. `playOnInit` keeps it moving
  // from the first frame. All mouse interaction is disabled — it's a purely
  // decorative marquee that never pauses, drags, or reacts to the cursor.
  const [autoScroll] = useState(() =>
    AutoScroll({
      speed: .25,
      startDelay: 0,
      playOnInit: true,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      stopOnFocusIn: false,
    }),
  );

  if (slides.length === 0) return null;

  return (
    <div className="w-full">
      <Carousel
        // No `dragFree`: its momentum physics fight auto-scroll and cause the
        // stutter. `containScroll: false` lets the loop wrap without snapping.
        opts={{ loop: true, align: "start", containScroll: false, watchDrag: false }}
        plugins={[autoScroll]}
        // pointer-events-none: ignore the cursor entirely (no drag, no hover).
        // Edge fade via a mask: the carousel's own pixels fade to transparent
        // at both ends, so the real background shows through — a clean blend
        // rather than a dark overlay greying out the (often white) thumbnails.
        className="pointer-events-none w-full select-none mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      >
        <CarouselContent className="-ml-2">
          {slides.map((item, i) => (
            <CarouselItem
              key={`${item.id}-${i}`}
              className="basis-auto pl-2"
            >
              <CarouselThumb item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

function CarouselThumb({ item }: { item: ItemRead }) {
  if (item.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={itemImageUrl(item.id, "200x200", item.updated_at)}
        alt={item.name}
        title={item.name}
        draggable={false}
        className="h-20 w-20 rounded-lg bg-white object-cover"
      />
    );
  }
  return (
    <span
      title={item.name}
      className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-base font-medium"
    >
      {item.name.slice(0, 2).toUpperCase()}
    </span>
  );
}
