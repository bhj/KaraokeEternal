import { resolveRoomAccessPrefs } from '../../shared/roomAccess.js'

export const sanitizeRoomPrefsForClient = (roomPrefs: Record<string, unknown> = {}) => {
  const accessPrefs = resolveRoomAccessPrefs(roomPrefs)

  return {
    ...accessPrefs,
    partyPresetFolderId: typeof roomPrefs.partyPresetFolderId === 'number' ? roomPrefs.partyPresetFolderId : null,
    playerPresetFolderId: typeof roomPrefs.playerPresetFolderId === 'number' ? roomPrefs.playerPresetFolderId : null,
    restrictCollaboratorsToPartyPresetFolder: roomPrefs.restrictCollaboratorsToPartyPresetFolder === true,
    startingPresetId: typeof roomPrefs.startingPresetId === 'number' ? roomPrefs.startingPresetId : null,
  }
}
