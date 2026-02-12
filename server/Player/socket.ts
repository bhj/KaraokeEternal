import Rooms from '../Rooms/Rooms.js'
import { resolveRoomAccessPrefs } from '../../shared/roomAccess.js'
import getLogger from '../lib/Log.js'

import {
  PLAYER_CMD_NEXT,
  PLAYER_CMD_OPTIONS,
  PLAYER_CMD_PAUSE,
  PLAYER_CMD_PLAY,
  PLAYER_CMD_REPLAY,
  PLAYER_CMD_VOLUME,
  PLAYER_REQ_NEXT,
  PLAYER_REQ_OPTIONS,
  PLAYER_REQ_PAUSE,
  PLAYER_REQ_PLAY,
  PLAYER_REQ_REPLAY,
  PLAYER_REQ_VOLUME,
  PLAYER_EMIT_STATUS,
  PLAYER_EMIT_FFT,
  PLAYER_EMIT_LEAVE,
  PLAYER_STATUS,
  PLAYER_FFT,
  PLAYER_LEAVE,
  VISUALIZER_HYDRA_CODE_REQ,
  VISUALIZER_HYDRA_CODE,
  VISUALIZER_STATE_SYNC_REQ,
  VISUALIZER_STATE_SYNC,
  CAMERA_OFFER_REQ,
  CAMERA_OFFER,
  CAMERA_ANSWER_REQ,
  CAMERA_ANSWER,
  CAMERA_ICE_REQ,
  CAMERA_ICE,
  CAMERA_STOP_REQ,
  CAMERA_STOP,
} from '../../shared/actionTypes.js'

const log = getLogger('PlayerSocket')

interface RoomControlSocket {
  id?: string
  user?: {
    userId?: number
    roomId?: number
    isAdmin?: boolean
    name?: string
  }
}

interface RoomControlAccess {
  hasRoom: boolean
  canManage: boolean
  accessPrefs: ReturnType<typeof resolveRoomAccessPrefs>
}

async function getRoomControlAccess (sock: RoomControlSocket): Promise<RoomControlAccess> {
  const roomId = sock.user?.roomId
  if (typeof roomId !== 'number') {
    return {
      hasRoom: false,
      canManage: false,
      accessPrefs: resolveRoomAccessPrefs(undefined),
    }
  }

  if (sock.user?.isAdmin) {
    return {
      hasRoom: true,
      canManage: true,
      accessPrefs: resolveRoomAccessPrefs(undefined),
    }
  }

  const userId = sock.user?.userId
  if (typeof userId !== 'number') {
    return {
      hasRoom: false,
      canManage: false,
      accessPrefs: resolveRoomAccessPrefs(undefined),
    }
  }

  const res = await Rooms.get(roomId, { status: ['open', 'closed'] })
  const room = res?.entities?.[roomId]
  if (!room) {
    return {
      hasRoom: false,
      canManage: false,
      accessPrefs: resolveRoomAccessPrefs(undefined),
    }
  }

  return {
    hasRoom: true,
    canManage: room.ownerId === userId,
    accessPrefs: resolveRoomAccessPrefs(room.prefs),
  }
}

export async function canManageRoom (sock: RoomControlSocket): Promise<boolean> {
  const access = await getRoomControlAccess(sock)
  return access.hasRoom && access.canManage
}

async function canSendVisualizer (sock: RoomControlSocket): Promise<boolean> {
  const access = await getRoomControlAccess(sock)
  return access.hasRoom && (access.canManage || access.accessPrefs.allowRoomCollaboratorsToSendVisualizer)
}

function canCollaboratorSendHydraCodeForRoomPolicy (
  access: RoomControlAccess,
  payload: Record<string, unknown> | undefined,
): boolean {
  if (access.canManage) return true

  if (access.accessPrefs.restrictCollaboratorsToPartyPresetFolder !== true) {
    return true
  }

  const allowedFolderId = access.accessPrefs.partyPresetFolderId
  if (typeof allowedFolderId !== 'number' || allowedFolderId <= 0) {
    return false
  }

  const payloadFolderId = payload?.hydraPresetFolderId
  return typeof payloadFolderId === 'number'
    && Number.isInteger(payloadFolderId)
    && payloadFolderId === allowedFolderId
}

async function canSendHydraCode (sock: RoomControlSocket, payload: Record<string, unknown> | undefined): Promise<boolean> {
  const access = await getRoomControlAccess(sock)
  if (!access.hasRoom) return false
  if (!access.canManage && !access.accessPrefs.allowRoomCollaboratorsToSendVisualizer) return false
  return canCollaboratorSendHydraCodeForRoomPolicy(access, payload)
}

async function canRelayCamera (sock: RoomControlSocket): Promise<boolean> {
  const access = await getRoomControlAccess(sock)
  return access.hasRoom && (access.canManage || access.accessPrefs.allowGuestCameraRelay)
}

function emitCameraRelay (sock: RoomControlSocket, type: string, payload: unknown): void {
  const roomId = sock.user?.roomId
  if (typeof roomId !== 'number') return

  const relaySock = sock as RoomControlSocket & {
    to?: (room: string) => { emit: (event: string, payload: unknown) => void }
    server?: { to: (room: string) => { emit: (event: string, payload: unknown) => void } }
  }

  const roomPrefix = Rooms.prefix(roomId)
  const userName = sock.user?.name ?? 'unknown'
  log.verbose('camera relay %s room=%s sender=%s socket=%s', type, roomId, userName, sock.id)

  // Keep signaling directional: do not echo back to sender.
  if (typeof relaySock.to === 'function') {
    relaySock.to(roomPrefix).emit('action', { type, payload })
    return
  }

  // Fallback for tests/mocks that do not expose sock.to
  relaySock.server?.to(roomPrefix).emit('action', { type, payload })
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_REQ_OPTIONS]: async (sock, { payload }) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_OPTIONS,
      payload,
    })
  },
  [PLAYER_REQ_NEXT]: async (sock) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_NEXT,
    })
  },
  [PLAYER_REQ_PAUSE]: async (sock) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_PAUSE,
    })
  },
  [PLAYER_REQ_PLAY]: async (sock) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_PLAY,
    })
  },
  [PLAYER_REQ_REPLAY]: async (sock, { payload }) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_REPLAY,
      payload,
    })
  },
  [PLAYER_REQ_VOLUME]: async (sock, { payload }) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_VOLUME,
      payload,
    })
  },
  [PLAYER_EMIT_FFT]: async (sock, { payload }) => {
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_FFT,
      payload,
    })
  },
  [PLAYER_EMIT_STATUS]: async (sock, { payload }) => {
    // so we can tell the room when players leave and
    // relay last known player status on client join
    sock._lastPlayerStatus = payload

    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_STATUS,
      payload,
    })
  },
  [VISUALIZER_HYDRA_CODE_REQ]: async (sock, { payload }) => {
    const payloadObject = payload && typeof payload === 'object' ? payload as Record<string, unknown> : undefined
    if (!(await canSendHydraCode(sock, payloadObject))) return

    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: VISUALIZER_HYDRA_CODE,
      payload,
    })
  },
  [VISUALIZER_STATE_SYNC_REQ]: async (sock, { payload }) => {
    if (!(await canSendVisualizer(sock))) return

    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: VISUALIZER_STATE_SYNC,
      payload,
    })
  },
  [CAMERA_OFFER_REQ]: async (sock, { payload }) => {
    if (!(await canRelayCamera(sock))) {
      log.verbose('camera relay denied %s room=%s socket=%s', CAMERA_OFFER_REQ, sock.user?.roomId, sock.id)
      return
    }

    emitCameraRelay(sock, CAMERA_OFFER, payload)
  },
  [CAMERA_ANSWER_REQ]: async (sock, { payload }) => {
    if (!(await canRelayCamera(sock))) {
      log.verbose('camera relay denied %s room=%s socket=%s', CAMERA_ANSWER_REQ, sock.user?.roomId, sock.id)
      return
    }

    emitCameraRelay(sock, CAMERA_ANSWER, payload)
  },
  [CAMERA_ICE_REQ]: async (sock, { payload }) => {
    if (!(await canRelayCamera(sock))) {
      log.verbose('camera relay denied %s room=%s socket=%s', CAMERA_ICE_REQ, sock.user?.roomId, sock.id)
      return
    }

    emitCameraRelay(sock, CAMERA_ICE, payload)
  },
  [CAMERA_STOP_REQ]: async (sock, { payload }) => {
    if (!(await canRelayCamera(sock))) {
      log.verbose('camera relay denied %s room=%s socket=%s', CAMERA_STOP_REQ, sock.user?.roomId, sock.id)
      return
    }

    emitCameraRelay(sock, CAMERA_STOP, payload)
  },
  [PLAYER_EMIT_LEAVE]: async (sock) => {
    sock._lastPlayerStatus = null

    // any players left in room?
    if (!Rooms.isPlayerPresent(sock.server, sock.user.roomId)) {
      sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
        type: PLAYER_LEAVE,
        payload: { socketId: sock.id },
      })
    }
  },
}

export default ACTION_HANDLERS
