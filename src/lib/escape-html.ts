/**
 * Job titles, service names and user names are user input and land inside the
 * HTML body of notification emails. Split out of `notify` so it stays testable
 * without pulling in the server-only module graph.
 */
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  );
}
