/** Obsidian-style: [[target]] or [[target|label]] */
const WIKI_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
const HTML_WIKI_RE = /data-wiki-target="([^"]+)"/g

export function extractWikiTargets(content: string): string[] {
  const targets = new Set<string>()

  // 1) Find raw markdown [[links]]
  let m: RegExpExecArray | null
  const re = new RegExp(WIKI_RE.source, 'g')
  while ((m = re.exec(content)) !== null) {
    const raw = m[1].trim()
    if (raw) targets.add(raw)
  }

  // 2) Find generated TipTap HTML links
  const htmlRe = new RegExp(HTML_WIKI_RE.source, 'g')
  while ((m = htmlRe.exec(content)) !== null) {
    const raw = m[1].trim()
    if (raw) targets.add(raw)
  }

  return [...targets]
}
