import Rooms from '../Rooms/Rooms.js'
import { resolveRoomAccessPrefs } from '../../shared/roomAccess.js'

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

interface RoomControlSocket {
  id?: string
  _lastPlayerStatus?: unknown
  user?: {
    userId?: number
    roomId?: number
    isAdmin?: boolean
  }
  server?: {
    to: (...args: unknown[]) => { emit: (...args: unknown[]) => void }
    in?: (...args: unknown[]) => { fetchSockets?: () => Promise<RoomControlSocket[]> }
  }
}

interface RoomControlAccess {
  hasRoom: boolean
  canManage: boolean
  accessPrefs: ReturnType<typeof resolveRoomAccessPrefs>
}

interface CameraRoute {
  publisherSocketId: string
  subscriberSocketId: string | null
}

const cameraRoutesByRoom = new Map<number, CameraRoute>()

function getRoomId (sock: RoomControlSocket): number | null {
  return typeof sock.user?.roomId === 'number' ? sock.user.roomId : null
}

function emitToRoom (sock: RoomControlSocket, type: string, payload: unknown): void {
  const roomId = getRoomId(sock)
  if (roomId === null) return

  sock.server?.to(Rooms.prefix(roomId)).emit('action', {
    type,
    payload,
  })
}

function emitToSocket (sock: RoomControlSocket, socketId: string, type: string, payload: unknown): void {
  sock.server?.to(socketId).emit('action', {
    type,
    payload,
  })
}

async function resolveCameraSubscriberSocketId (sock: RoomControlSocket): Promise<string | null> {
  const roomId = getRoomId(sock)
  if (roomId === null || !sock.server?.in) return null

  try {
    const room = sock.server.in(Rooms.prefix(roomId))
    if (!room?.fetchSockets) return null

    const sockets = await room.fetchSockets()
    const activePlayer = sockets.find(s => {
      return typeof s.id === 'string'
        && s.id !== sock.id
        && s.user?.roomId === roomId
        && Boolean(s._lastPlayerStatus)
    })

    return typeof activePlayer?.id === 'string' ? activePlayer.id : null
  } catch {
    return null
  }
}

async function registerCameraOfferRoute (sock: RoomControlSocket): Promise<CameraRoute | null> {
  const roomId = getRoomId(sock)
  if (roomId === null || typeof sock.id !== 'string') return null

  const existing = cameraRoutesByRoom.get(roomId)
  const subscriberSocketId = await resolveCameraSubscriberSocketId(sock)

  const route: CameraRoute = {
    publisherSocketId: sock.id,
    subscriberSocketId: subscriberSocketId ?? existing?.subscriberSocketId ?? null,
  }

  cameraRoutesByRoom.set(roomId, route)
  return route
}

function getCameraRoute (sock: RoomControlSocket): CameraRoute | null {
  const roomId = getRoomId(sock)
  if (roomId === null) return null
  return cameraRoutesByRoom.get(roomId) ?? null
}

function clearCameraRoute (sock: RoomControlSocket): void {
  const roomId = getRoomId(sock)
  if (roomId === null) return
  cameraRoutesByRoom.delete(roomId)
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

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_REQ_OPTIONS]: async (sock, { payload }) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    emitToRoom(sock, PLAYER_CMD_OPTIONS, payload)
  },
  [PLAYER_REQ_NEXT]: async (sock) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    emitToRoom(sock, PLAYER_CMD_NEXT, undefined)
  },
  [PLAYER_REQ_PAUSE]: async (sock) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    emitToRoom(sock, PLAYER_CMD_PAUSE, undefined)
  },
  [PLAYER_REQ_PLAY]: async (sock) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    emitToRoom(sock, PLAYER_CMD_PLAY, undefined)
  },
  [PLAYER_REQ_REPLAY]: async (sock, { payload }) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    emitToRoom(sock, PLAYER_CMD_REPLAY, payload)
  },
  [PLAYER_REQ_VOLUME]: async (sock, { payload }) => {
    if (!(await canManageRoom(sock))) return

    // @todo: emit to players only
    emitToRoom(sock, PLAYER_CMD_VOLUME, payload)
  },
  [PLAYER_EMIT_FFT]: async (sock, { payload }) => {
    emitToRoom(sock, PLAYER_FFT, payload)
  },
  [PLAYER_EMIT_STATUS]: async (sock, { payload }) => {
    // so we can tell the room when players leave and
    // relay last known player status on client join
    sock._lastPlayerStatus = payload

    emitToRoom(sock, PLAYER_STATUS, payload)
  },
  [VISUALIZER_HYDRA_CODE_REQ]: async (sock, { payload }) => {
    const payloadObject = payload && typeof payload === 'object' ? payload as Record<string, unknown> : undefined
    if (!(await canSendHydraCode(sock, payloadObject))) return

    emitToRoom(sock, VISUALIZER_HYDRA_CODE, payload)
  },
  [VISUALIZER_STATE_SYNC_REQ]: async (sock, { payload }) => {
    if (!(await canSendVisualizer(sock))) return

    emitToRoom(sock, VISUALIZER_STATE_SYNC, payload)
  },
  [CAMERA_OFFER_REQ]: async (sock, { payload }) => {
    if (!(await canRelayCamera(sock))) return

    const route = await registerCameraOfferRoute(sock)
    if (route?.subscriberSocketId) {
      emitToSocket(sock, route.subscriberSocketId, CAMERA_OFFER, payload)
      return
    }

    emitToRoom(sock, CAMERA_OFFER, payload)
  },
  [CAMERA_ANSWER_REQ]: async (sock, { payload }) => {
    if (!(await canRelayCamera(sock))) return

    const route = getCameraRoute(sock)
    if (route) {
      if (typeof sock.id === 'string' && sock.id === route.subscriberSocketId) {
        emitToSocket(sock, route.publisherSocketId, CAMERA_ANSWER, payload)
        return
      }
      if (typeof sock.id === 'string' && sock.id === route.publisherSocketId && route.subscriberSocketId) {
        emitToSocket(sock, route.subscriberSocketId, CAMERA_ANSWER, payload)
        return
      }
    }

    emitToRoom(sock, CAMERA_ANSWER, payload)
  },
  [CAMERA_ICE_REQ]: async (sock, { payload }) => {
    if (!(await canRelayCamera(sock))) return

    const route = getCameraRoute(sock)
    if (route) {
      if (typeof sock.id === 'string' && sock.id === route.publisherSocketId && route.subscriberSocketId) {
        emitToSocket(sock, route.subscriberSocketId, CAMERA_ICE, payload)
        return
      }
      if (typeof sock.id === 'string' && sock.id === route.subscriberSocketId) {
        emitToSocket(sock, route.publisherSocketId, CAMERA_ICE, payload)
        return
      }
    }

    emitToRoom(sock, CAMERA_ICE, payload)
  },
  [CAMERA_STOP_REQ]: async (sock, { payload }) => {
    if (!(await canRelayCamera(sock))) return

    const route = getCameraRoute(sock)
    if (route) {
      const senderId = typeof sock.id === 'string' ? sock.id : null
      if (senderId === route.publisherSocketId && route.subscriberSocketId) {
        emitToSocket(sock, route.subscriberSocketId, CAMERA_STOP, payload)
      } else if (senderId === route.subscriberSocketId) {
        emitToSocket(sock, route.publisherSocketId, CAMERA_STOP, payload)
      } else {
        emitToRoom(sock, CAMERA_STOP, payload)
      }

      clearCameraRoute(sock)
      return
    }

    emitToRoom(sock, CAMERA_STOP, payload)
  },
  [PLAYER_EMIT_LEAVE]: async (sock) => {
    sock._lastPlayerStatus = null

    // any players left in room?
    if (!Rooms.isPlayerPresent(sock.server, sock.user.roomId)) {
      emitToRoom(sock, PLAYER_LEAVE, { socketId: sock.id })
    }
  },
}

export default ACTION_HANDLERS
