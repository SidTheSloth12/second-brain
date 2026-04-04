/** Obsidian-style: [[target]] or [[target|label]] */
const WIKI_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

export function extractWikiTargets(content: string): string[] {
  const targets = new Set<string>()
  let m: RegExpExecArray | null
  const re = new RegExp(WIKI_RE.source, 'g')
  while ((m = re.exec(content)) !== null) {
    const raw = m[1].trim()
    if (raw) targets.add(raw)
  }
  return [...targets]
}
