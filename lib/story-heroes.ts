/** Parse Heroes text field (CSV / semicolon-separated slugs). No DB join. */
export function parseHeroSlugs(raw: string | string[] | null | undefined): string[] {
  if (!raw) return []
  const parts = Array.isArray(raw) ? raw : String(raw).split(/[,;]+/)
  const slugs = parts
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(slugs)]
}
