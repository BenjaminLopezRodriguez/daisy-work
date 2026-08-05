"use client";

import type { LucideIcon } from "lucide-react";
import {
  Brush,
  Camera,
  Car,
  Code,
  Hammer,
  Home,
  Laptop,
  Leaf,
  PawPrint,
  PenLine,
  Plug,
  Shirt,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Categories are free text (`varchar(128)`), so the icon is matched on
 * keywords rather than a taxonomy table. Unmatched categories get the generic
 * mark — a wrong icon is worse than a neutral one.
 */
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/electric|wiring|panel/i, Plug],
  [/plumb|pipe|drain|water/i, Wrench],
  [/clean|maid|housekeep/i, Sparkles],
  [/paint|drywall|render/i, Brush],
  [/carpent|build|construct|roof|handyman|repair/i, Hammer],
  [/garden|landscap|lawn|tree|yard/i, Leaf],
  [/move|moving|haul|deliver|courier/i, Truck],
  [/auto|car|mechanic|vehicle/i, Car],
  [/pet|dog|cat|animal/i, PawPrint],
  [/photo|video|film/i, Camera],
  [/design|graphic|brand/i, Brush],
  [/writ|translat|copy|content/i, PenLine],
  [/develop|software|web|app|program|code/i, Code],
  [/tech|it |computer|network/i, Laptop],
  [/tailor|sew|laundry|cloth/i, Shirt],
  [/home|house|interior|assembl/i, Home],
];

function iconFor(category: string): LucideIcon {
  return (
    ICON_RULES.find(([pattern]) => pattern.test(category))?.[1] ?? Sparkles
  );
}

/**
 * The category row under the search box: cards, not pills. A pill reads as a
 * filter chip you have already applied; a card reads as a place to go, which
 * is what someone who has not decided anything yet is looking for.
 *
 * Horizontal scroll on every size — this row is a rail, not a wrap grid, so
 * the count of categories never changes the height of the page.
 */
export function CategoryCards({
  categories,
  selected,
  onSelect,
  noun = "service",
  className,
}: {
  /** `[name, count]`, already sorted and capped by the caller. */
  categories: [string, number][];
  selected: string | null;
  onSelect: (category: string | null) => void;
  /** Singular noun for the count line — "service" here, "job" on /marketplace. */
  noun?: string;
  className?: string;
}) {
  if (categories.length < 2) return null;

  return (
    <div
      role="group"
      aria-label="Browse by category"
      // Bleed to the viewport edge on mobile so the rail reads as scrollable
      // instead of stopping short at a container margin.
      className={cn(
        "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0",
        className,
      )}
    >
      <CategoryCard
        icon={Sparkles}
        label={`All ${noun}s`}
        noun={noun}
        count={categories.reduce((total, [, n]) => total + n, 0)}
        selected={selected === null}
        onClick={() => onSelect(null)}
      />
      {categories.map(([name, count]) => (
        <CategoryCard
          key={name}
          icon={iconFor(name)}
          label={name}
          count={count}
          noun={noun}
          selected={selected === name}
          onClick={() => onSelect(selected === name ? null : name)}
        />
      ))}
    </div>
  );
}

function CategoryCard({
  icon: Icon,
  label,
  count,
  noun,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  noun: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-36 shrink-0 snap-start flex-col justify-between gap-6 rounded-xl border p-4 text-left transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        // Selection is carried by border and background, not colour alone.
        selected
          ? "border-foreground bg-foreground/[0.04] shadow-sm"
          : "border-border bg-card hover:border-foreground/30 hover:shadow-sm",
      )}
    >
      <Icon className="size-6 shrink-0" strokeWidth={1.5} aria-hidden />
      <span className="space-y-0.5">
        <span className="block text-sm leading-snug font-medium capitalize">
          {label}
        </span>
        <span className="text-muted-foreground block text-xs tabular-nums">
          {count} {count === 1 ? noun : `${noun}s`}
        </span>
      </span>
    </button>
  );
}
