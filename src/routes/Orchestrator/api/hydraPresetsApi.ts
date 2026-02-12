import HttpApi from 'lib/HttpApi'
import type { PresetFolder, PresetItem } from '../components/presetTree'

const api = new HttpApi('hydra-presets/')

export const fetchFolders = () => api.get<PresetFolder[]>('folders')

export const createFolder = (name: string) => api.post<PresetFolder>('folders', {
  body: { name },
})

export const updateFolder = (folderId: number, data: { name?: string, sortOrder?: number }) => api.put<PresetFolder>(`folders/${folderId}`, {
  body: data,
})

export const deleteFolder = (folderId: number) => api.delete<{ success: true }>(`folders/${folderId}`)

export const fetchAllPresets = () => api.get<PresetItem[]>('')

export const fetchPresetsByFolder = (folderId: number) => api.get<PresetItem[]>(`folder/${folderId}`)

export const fetchPresetById = (presetId: number) => api.get<PresetItem>(`${presetId}`)

export const createPreset = (data: { folderId: number, name: string, code: string }) => api.post<PresetItem>('', {
  body: data,
})

export const updatePreset = (presetId: number, data: { name?: string, code?: string, sortOrder?: number, folderId?: number }) => api.put<PresetItem>(`${presetId}`, {
  body: data,
})

export const deletePreset = (presetId: number) => api.delete<{ success: true }>(`${presetId}`)
