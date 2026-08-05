import Link from "next/link";

import { cn } from "@/lib/utils";

/** `href` omitted for an ancestor that has no index route yet (e.g. Providers). */
export type Crumb = { label: string; href?: string };

/**
 * Nav design system §5.7. Desktop renders the full trail; mobile collapses to a
 * single `‹ {parent}` back affordance rather than wrapping onto two lines.
 * Both variants live inside one `<nav aria-label="Breadcrumb">`; only one is in
 * the a11y tree at a time (`hidden` removes the other).
 *
 * Long labels truncate with CSS, so the full string stays in the DOM for
 * screen readers and is mirrored into `title` for sighted users.
 */
export function Breadcrumbs({
  trail,
  page,
  className,
}: {
  /** Ancestors, root first. Must not be empty. */
  trail: Crumb[];
  /**
   * The current page. Rendered as the leaf: not a link, `aria-current="page"`.
   * `null` while the label is still loading — renders a fixed-width placeholder
   * so the row never changes height.
   */
  page: string | null;
  className?: string;
}) {
  // Mobile collapses to the nearest ancestor that is actually navigable.
  const parent = [...trail].reverse().find((c) => c.href);
  if (!parent?.href) return null;

  const linkClass =
    "relative rounded-sm underline-offset-4 transition-colors hover:text-nav-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-focus focus-visible:ring-offset-2 before:absolute before:-inset-1.5 before:content-['']";

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("text-crumb w-full min-w-0 text-nav-ink-muted", className)}
    >
      {/* Mobile: single back affordance. */}
      <Link
        href={parent.href}
        aria-label={`Back to ${parent.label}`}
        className={cn(linkClass, "flex min-h-11 items-center gap-1 sm:hidden")}
      >
        <span aria-hidden="true">‹</span>
        <span className="truncate">{parent.label}</span>
      </Link>

      {/* Desktop: full trail. */}
      <ol className="hidden min-w-0 items-center gap-1.5 sm:flex">
        {trail.map((crumb) => (
          <li key={crumb.label} className="flex min-w-0 items-center gap-1.5">
            {crumb.href ? (
              <Link
                href={crumb.href}
                title={crumb.label}
                className={cn(linkClass, "block max-w-[32ch] truncate")}
              >
                {crumb.label}
              </Link>
            ) : (
              <span title={crumb.label} className="block max-w-[32ch] truncate">
                {crumb.label}
              </span>
            )}
            <span aria-hidden="true" className="shrink-0">
              ›
            </span>
          </li>
        ))}
        <li className="min-w-0">
          {page === null ? (
            <span className="inline-block h-[1em] w-32 animate-pulse rounded bg-muted align-middle">
              <span className="sr-only">Loading</span>
            </span>
          ) : (
            <span
              aria-current="page"
              title={page}
              className="block max-w-[40ch] truncate text-nav-ink"
            >
              {page}
            </span>
          )}
        </li>
      </ol>
    </nav>
  );
}
