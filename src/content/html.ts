// HTML escaping shared by the page renderer (render.ts) and the SVG diagram (diagram.ts), kept
// in its own module so the two do not import each other.

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
