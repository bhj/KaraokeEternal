import type { IRoomPrefs } from './types.js'

export interface RoomAccessPrefs {
  allowGuestOrchestrator: boolean
  allowGuestCameraRelay: boolean
  allowRoomCollaboratorsToSendVisualizer: boolean
}

export const ROOM_ACCESS_DEFAULTS: RoomAccessPrefs = {
  allowGuestOrchestrator: true,
  allowGuestCameraRelay: true,
  allowRoomCollaboratorsToSendVisualizer: true,
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
  }
}
