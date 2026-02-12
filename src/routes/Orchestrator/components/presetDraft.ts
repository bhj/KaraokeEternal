export interface PresetDraftInput {
  currentCode: string
  preset?: {
    name: string
    code: string
  }
}

export interface PresetDraft {
  name: string
  code: string
}

function buildCloneName (name: string): string {
  const normalized = name.trim()
  const copySuffixMatch = normalized.match(/^(.*) copy(?: (\d+))?$/)

  if (!copySuffixMatch) {
    return `${normalized} copy`
  }

  const base = copySuffixMatch[1]
  const copyNumber = copySuffixMatch[2] ? parseInt(copySuffixMatch[2], 10) : 1
  return `${base} copy ${copyNumber + 1}`
}

export function buildPresetDraft ({ currentCode, preset }: PresetDraftInput): PresetDraft {
  if (preset) {
    return {
      name: buildCloneName(preset.name),
      code: preset.code,
    }
  }

  return {
    name: '',
    code: currentCode,
  }
}
