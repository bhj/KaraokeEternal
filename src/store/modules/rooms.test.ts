// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import roomsReducer, { type RoomsState } from './rooms'
import { ROOM_PREFS_PUSH } from 'shared/actionTypes'
import type { Room } from 'shared/types'

const stubRoom = (overrides: Partial<Room> = {}): Room => ({
  roomId: 1,
  name: 'Test Room',
  status: 'open',
  dateCreated: Date.now(),
  hasPassword: false,
  numUsers: 1,
  prefs: { qr: { isEnabled: true, opacity: 1, password: '', size: 200 } },
  ...overrides,
})

describe('rooms reducer', () => {
  describe('ROOM_PREFS_PUSH', () => {
    it('patches prefs on existing room entity', () => {
      const initial: RoomsState = {
        result: [1],
        entities: { 1: stubRoom() },
        filterStatus: 'open',
        isEditorOpen: false,
      }

      const action = {
        type: ROOM_PREFS_PUSH,
        payload: {
          roomId: 1,
          prefs: { qr: false, startingPresetId: 42 },
        },
      }

      const next = roomsReducer(initial, action)
      expect(next.entities[1].prefs).toEqual({ qr: false, startingPresetId: 42 })
    })

    it('replaces prefs entirely (mirrors server sanitized response)', () => {
      const initial: RoomsState = {
        result: [1],
        entities: {
          1: stubRoom({
            prefs: {
              qr: { isEnabled: true, opacity: 1, password: '', size: 200 },
              startingPresetId: 10,
              playerPresetFolderId: 5,
            },
          }),
        },
        filterStatus: 'open',
        isEditorOpen: false,
      }

      // Server response after toggling star off — startingPresetId is now null
      const action = {
        type: ROOM_PREFS_PUSH,
        payload: {
          roomId: 1,
          prefs: {
            allowGuestOrchestrator: true,
            allowGuestCameraRelay: true,
            allowRoomCollaboratorsToSendVisualizer: true,
            partyPresetFolderId: null as number | null,
            playerPresetFolderId: 5,
            restrictCollaboratorsToPartyPresetFolder: false,
            startingPresetId: null as number | null,
          },
        },
      }

      const next = roomsReducer(initial, action)
      expect(next.entities[1].prefs?.startingPresetId).toBeNull()
      expect(next.entities[1].prefs?.playerPresetFolderId).toBe(5)
    })

    it('is a no-op when the room entity does not exist', () => {
      const initial: RoomsState = {
        result: [],
        entities: {},
        filterStatus: 'open',
        isEditorOpen: false,
      }

      const action = {
        type: ROOM_PREFS_PUSH,
        payload: {
          roomId: 999,
          prefs: { qr: { isEnabled: true, opacity: 1, password: '', size: 200 } },
        },
      }

      const next = roomsReducer(initial, action)
      expect(next.entities).toEqual({})
    })
  })
})
