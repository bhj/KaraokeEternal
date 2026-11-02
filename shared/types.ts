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

export interface ParsedSongMeta {
  artist: string
  artistNorm: string
  title: string
  titleNorm: string
}

export interface QueueItem {
  queueId: number
  songId: number
  userId: number
  prevQueueId: number
  mediaId: number
  pitch: number | null // the media's default
  userPitch: number | null // the singer's own; takes precedence over pitch
  rgTrackGain: number | null
  rgTrackPeak: number | null
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

export interface IRoomPrefs {
  qr: {
    isEnabled: boolean
    opacity: number
    password: string
    size: number
    url?: string
  }
  user?: {
    isNewAllowed?: boolean
    isGuestAllowed?: boolean
  }
  roles?: Record<number, {
    allowNew: boolean
  }>
}

export interface Room {
  roomId: number
  name: string
  status: 'open' | 'closed'
  dateCreated: number
  hasPassword: boolean
  numUsers: number
  prefs?: IRoomPrefs
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
    scanFull: boolean
  }
  scanner?: {
    configs?: Record<string, number>
  }
}

export interface Provider {
  providerId: number
  name: string
  url: string
  priority: number
  apiKey?: string
  prefs: ProviderPrefs
}

export interface ProviderPrefs {
  enabled: boolean
  // per item type; a missing entry means the type is disabled
  types: ProviderTypePrefs
}

export interface ProviderTypePrefs {
  song?: SongProviderPrefs
}

export interface SongProviderPrefs {
  enabled: boolean
  maxLibraryResults: number | null // null = always
}

export type ProviderState = 'checking' | 'ready' | 'unreachable' | 'unauthorized' | 'incompatible'

// Runtime (not stored) result of checking a provider's /api discovery
export interface ProviderStatus {
  state: ProviderState
  message?: string
  // supported types the provider offers; version is null when no version is shared
  types: Record<string, ProviderTypeStatus>
}

export interface ProviderTypeStatus {
  version: number | null
  message?: string
}

export interface ProviderSearchResult {
  providerId: number
  id: string
  title: string
  artist: string
  source: string
  iconUrl: string
  duration?: number // seconds, when the provider knows it before download
}

export type ProviderFetchStatus = 'pending' | 'downloading' | 'complete' | 'error' | 'canceled'

// One singer's request for a provider item. Each one becomes a queue item
// when the item is ingested, and a row in that singer's room until then.
export interface ProviderFetchRequester {
  userId: number
  userDisplayName: string
  userDateUpdated: number
  timestamp: number // when they requested it (UNIX seconds)
}

// A provider fetch as one room's clients see it: the download's state plus
// the singers in that room waiting on it. Terminal statuses carry whichever
// requesters remain; a canceled fetch has none.
export interface ProviderFetchView {
  providerId: number
  itemId: string
  status: ProviderFetchStatus
  progress: number
  error?: string
  title: string
  artist: string
  source?: string
  iconUrl?: string
  duration?: number // seconds, when the search result had one
  eta?: number // seconds until complete as of when this view was sent, when the provider estimates it
  requests: ProviderFetchRequester[]
}

export interface ProviderSearchError {
  providerId: number
  message: string
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

export const PITCH_SEMITONES_MIN = -6
export const PITCH_SEMITONES_MAX = 6

export interface PlaybackOptions {
  cdgAlpha?: number
  cdgSize?: number
  mp4Alpha?: number
  pitch?: number
  visualizer?: {
    sensitivity?: number
    isEnabled?: boolean
    nextPreset?: boolean
    prevPreset?: boolean
    randomPreset?: boolean
  }
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
  providers: {
    result: number[]
    entities: Record<number, Provider>
  }
  roles: {
    result: number[]
    entities: Record<number, Role>
  }
  [key: string]: unknown
}
