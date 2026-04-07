import { useMemo, useState, type KeyboardEvent } from 'react'

type TagEditorProps = {
  tags: string[]
  allTags: string[]
  onChange: (tags: string[]) => void
}

export function TagEditor({ tags, allTags, onChange }: TagEditorProps) {
  const [inputValue, setInputValue] = useState('')

  const availableSuggestions = useMemo(
    () =>
      allTags
        .filter((tag) => !tags.includes(tag))
        .filter((tag) => inputValue.trim() === '' || tag.toLowerCase().includes(inputValue.toLowerCase())),
    [allTags, inputValue, tags]
  )

  function addTag(value: string) {
    const normalized = value.trim()
    if (!normalized || tags.includes(normalized)) return
    onChange([...tags, normalized])
    setInputValue('')
  }

  function removeTag(tagToRemove: string) {
    onChange(tags.filter((tag) => tag !== tagToRemove))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(inputValue)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-500">Tags</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
          >
            {tag}
            <span className="ml-2 font-semibold">×</span>
          </button>
        ))}
      </div>
      <input
        list="note-tag-suggestions"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
        placeholder="Add tag and press Enter"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
      />
      <datalist id="note-tag-suggestions">
        {availableSuggestions.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
    </div>
  )
}
