export interface Artist {
  artistId: number
  name: string
  songIds: number[]
}

export interface Song {
  artistId: number
  duration: number
  songId: number
  title: string
  numMedia: number
}

export interface QueueItem {
  queueId: number
  songId: number
  userId: number
  prevQueueId: number
  mediaId: number
  rgTrackGain: number
  rgTrackPeak: number
  userDateUpdated: number
  userDisplayName: string
  mediaType: 'cdg' | 'mp4'
  isOptimistic?: false
  isVideoKeyingEnabled: boolean
}

export interface OptimisticQueueItem {
  isOptimistic: true
  prevQueueId: number
  queueId: number
  songId: number
}

export interface IRoomVisualizerPrefs {
  mode?: VisualizerMode
  sensitivity?: number
}

export interface IRoomPrefs {
  qr: {
    isEnabled: boolean
    opacity: number
    password: string
    size: number
  }
  user?: {
    isNewAllowed?: boolean
    isGuestAllowed?: boolean
  }
  roles?: Record<number, {
    allowNew: boolean
  }>
  visualizer?: IRoomVisualizerPrefs
}

export interface Room {
  roomId: number
  name: string
  status: 'open' | 'closed'
  dateCreated: number
  hasPassword: boolean
  numUsers: number
  prefs?: IRoomPrefs
  invitationToken?: string | null
}

export interface Role {
  roleId: number
  name: string
}

export interface Path {
  pathId: number
  path: string
  priority: number
  prefs: {
    isVideoKeyingEnabled: boolean
    isWatchingEnabled: boolean
  }
}

export interface User {
  userId: number
  username: string
  name: string
  isAdmin: boolean // todo: client and server ctx only
  isGuest: boolean // todo: client and server ctx only
  dateCreated: number
  dateUpdated: number
}

export interface UserWithRole extends User {
  role?: string
}

export type VisualizerMode
  = 'hydra' // Hydra video synth
    | 'off'

export interface PlaybackOptions {
  cdgAlpha?: number
  cdgSize?: number
  mp4Alpha?: number
  visualizer?: {
    sensitivity?: number
    isEnabled?: boolean
    mode?: VisualizerMode
    audioResponse?: AudioResponseState
    allowCamera?: boolean
  }
}

export interface AudioResponseState {
  globalGain: number // 0.2 – 3.0 (UI range; pipeline accepts 0+)
  bassWeight: number // 0.0 – 3.0
  midWeight: number // 0.0 – 3.0
  trebleWeight: number // 0.0 – 3.0
}

export const AUDIO_RESPONSE_DEFAULTS: AudioResponseState = {
  globalGain: 1.0,
  bassWeight: 1.0,
  midWeight: 1.0,
  trebleWeight: 1.0,
}

export type MediaType = 'cdg' | 'mp4' | ''

export interface Media {
  songId: number
  mediaId: number
  isPreferred: boolean
  path: string
  relPath: string
  duration: number
}

export interface Prefs {
  isFirstRun?: boolean
  isScanning: boolean
  isReplayGainEnabled: boolean
  paths: {
    result: number[]
    entities: Record<number, Path>
  }
  roles: {
    result: number[]
    entities: Record<number, Role>
  }
  [key: string]: unknown
}
