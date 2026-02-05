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

export function buildPresetDraft ({ currentCode, preset }: PresetDraftInput): PresetDraft {
  if (preset) {
    return {
      name: `${preset.name} copy`,
      code: preset.code,
    }
  }

  return {
    name: '',
    code: currentCode,
  }
}
