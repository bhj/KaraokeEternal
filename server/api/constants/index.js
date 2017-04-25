module.exports = {
  // authentication
  SOCKET_AUTH_ERROR: 'SOCKET_AUTH_ERROR',
  // library
  LIBRARY_UPDATE: 'library/FULL_UPDATE',
  SONG_UPDATE: 'library/SONG_UPDATE',
  LIBRARY_SEARCH: 'library/SEARCH',
  LIBRARY_SEARCH_RESET: 'library/SEARCH_RESET',
  // queue
  QUEUE_ADD: 'server/QUEUE_ADD',
  QUEUE_REMOVE: 'server/QUEUE_REMOVE',
  QUEUE_UPDATE: 'queue/QUEUE_UPDATE',
  // player command requests (clients -> server)
  REQUEST_PLAYER_PLAY: 'server/REQUEST_PLAYER_PLAY',
  REQUEST_PLAYER_PAUSE: 'server/REQUEST_PLAYER_PAUSE',
  REQUEST_PLAYER_NEXT: 'server/REQUEST_PLAYER_NEXT',
  REQUEST_PLAYER_VOLUME: 'server/REQUEST_PLAYER_VOLUME',
  // player commands (server -> player)
  PLAYER_NEXT: 'player/NEXT',
  PLAYER_PAUSE: 'player/PAUSE',
  PLAYER_PLAY: 'player/PLAY',
  PLAYER_VOLUME: 'player/VOLUME',
  // player -> server -> clients
  PLAYER_STATUS: 'room/PLAYER_STATUS',
  PLAYER_ERROR: 'room/PLAYER_ERROR',
  PLAYER_LEAVE: 'room/PLAYER_LEAVE',
  // to room (player -> server -> clients)
  EMIT_PLAYER_STATUS: 'server/EMIT_PLAYER_STATUS',
  EMIT_PLAYER_ERROR: 'server/EMIT_PLAYER_ERROR',
  EMIT_PLAYER_LEAVE:  'server/EMIT_PLAYER_LEAVE',
  // user
  SET_PREFS: 'server/SET_PREFS',
  PREFS_UPDATE: 'user/PREFS_UPDATE',
  TOGGLE_SONG_STARRED: 'server/TOGGLE_SONG_STARRED',
  LOGIN: 'user/LOGIN',
  LOGOUT: 'user/LOGOUT',
  CREATE: 'user/CREATE',
  UPDATE: 'user/UPDATE',
  GET_ROOMS: 'user/GET_ROOMS',
  // misc
  _SUCCESS: '_SUCCESS',
  _ERROR: '_ERROR',
  // provider
  REQUEST_PROVIDER_SCAN: 'server/REQUEST_PROVIDER_SCAN',
}
