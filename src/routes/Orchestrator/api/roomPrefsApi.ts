import HttpApi from 'lib/HttpApi'
import type { IRoomPrefs } from 'shared/types'

const api = new HttpApi('rooms')

interface MyRoomResponse {
  room: {
    roomId: number
    prefs?: Partial<IRoomPrefs>
  } | null
}

export const updateMyRoomPrefs = (prefs: Partial<IRoomPrefs>) => api.put<MyRoomResponse>('/my/prefs', {
  body: { prefs },
})
