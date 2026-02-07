import type { IRoomPrefs } from './types.js'

export interface RoomAccessPrefs {
  allowGuestOrchestrator: boolean
  allowGuestCameraRelay: boolean
  allowRoomCollaboratorsToSendVisualizer: boolean
  partyPresetFolderId: number | null
  restrictCollaboratorsToPartyPresetFolder: boolean
}

export const ROOM_ACCESS_DEFAULTS: RoomAccessPrefs = {
  allowGuestOrchestrator: true,
  allowGuestCameraRelay: true,
  allowRoomCollaboratorsToSendVisualizer: true,
  partyPresetFolderId: null,
  restrictCollaboratorsToPartyPresetFolder: false,
}

export function resolveRoomAccessPrefs (prefs?: Partial<IRoomPrefs> | null): RoomAccessPrefs {
  return {
    allowGuestOrchestrator: typeof prefs?.allowGuestOrchestrator === 'boolean'
      ? prefs.allowGuestOrchestrator
      : ROOM_ACCESS_DEFAULTS.allowGuestOrchestrator,
    allowGuestCameraRelay: typeof prefs?.allowGuestCameraRelay === 'boolean'
      ? prefs.allowGuestCameraRelay
      : ROOM_ACCESS_DEFAULTS.allowGuestCameraRelay,
    allowRoomCollaboratorsToSendVisualizer: typeof prefs?.allowRoomCollaboratorsToSendVisualizer === 'boolean'
      ? prefs.allowRoomCollaboratorsToSendVisualizer
      : ROOM_ACCESS_DEFAULTS.allowRoomCollaboratorsToSendVisualizer,
    partyPresetFolderId: typeof prefs?.partyPresetFolderId === 'number' && prefs.partyPresetFolderId > 0
      ? prefs.partyPresetFolderId
      : ROOM_ACCESS_DEFAULTS.partyPresetFolderId,
    restrictCollaboratorsToPartyPresetFolder: prefs?.restrictCollaboratorsToPartyPresetFolder === true,
  }
}
