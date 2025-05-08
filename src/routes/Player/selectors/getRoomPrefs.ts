import { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'
import type { IRoomPrefs } from 'shared/types'

const DEFAULT_ROOM_PREFS: IRoomPrefs = {
  qr: {
    isEnabled: false,
    opacity: 0.625,
    password: '',
    size: 0.5,
  },
}

const getRoomId = (state: RootState) => state.user.roomId
const getRooms = (state: RootState) => state.rooms.entities

const getRoomPrefs = createSelector(
  [getRoomId, getRooms],
  (roomId, rooms) => {
    if (typeof roomId !== 'number'
      || !rooms[roomId]
      || !rooms[roomId].prefs
    ) {
      return DEFAULT_ROOM_PREFS
    }

    return rooms[roomId]?.prefs
  })

export default getRoomPrefs
