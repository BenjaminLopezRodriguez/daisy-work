import type { Metadata } from "next";

/**
 * One shape for every public detail route's metadata, so a shared link looks
 * the same whether it lands in iMessage, Slack, or a search result.
 */
export function detailMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  // Trim to what previews actually render rather than letting them cut mid-word.
  const summary = truncate(description.replace(/\s+/g, " ").trim(), 160);
  return {
    title,
    description: summary,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: summary,
      url: path,
      siteName: "Daisy.work",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description: summary },
  };
}

export function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

export const NOT_FOUND_METADATA: Metadata = {
  title: "Not found",
  robots: { index: false },
};
