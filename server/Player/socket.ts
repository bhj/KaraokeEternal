import Rooms from '../Rooms/Rooms.js'

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

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_REQ_OPTIONS]: async (sock, { payload }) => {
    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_OPTIONS,
      payload,
    })
  },
  [PLAYER_REQ_NEXT]: async (sock) => {
    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_NEXT,
    })
  },
  [PLAYER_REQ_PAUSE]: async (sock) => {
    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_PAUSE,
    })
  },
  [PLAYER_REQ_PLAY]: async (sock) => {
    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_PLAY,
    })
  },
  [PLAYER_REQ_REPLAY]: async (sock, { payload }) => {
    // @todo: emit to players only
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: PLAYER_CMD_REPLAY,
      payload,
    })
  },
  [PLAYER_REQ_VOLUME]: async (sock, { payload }) => {
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
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: VISUALIZER_HYDRA_CODE,
      payload,
    })
  },
  [VISUALIZER_STATE_SYNC_REQ]: async (sock, { payload }) => {
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: VISUALIZER_STATE_SYNC,
      payload,
    })
  },
  [CAMERA_OFFER_REQ]: async (sock, { payload }) => {
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: CAMERA_OFFER,
      payload,
    })
  },
  [CAMERA_ANSWER_REQ]: async (sock, { payload }) => {
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: CAMERA_ANSWER,
      payload,
    })
  },
  [CAMERA_ICE_REQ]: async (sock, { payload }) => {
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: CAMERA_ICE,
      payload,
    })
  },
  [CAMERA_STOP_REQ]: async (sock, { payload }) => {
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: CAMERA_STOP,
      payload,
    })
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
