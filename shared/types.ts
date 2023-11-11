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
  userDisplayName: string
  dateUpdated: number
  mediaType: 'cdg' | 'mp4'
  isOptimistic?: boolean
}

export interface Room {
  roomId: number
  name: string
  status: 'open' | 'closed'
  dateCreated: string
  hasPassword: boolean
  numUsers: number
}

export interface Path {
  pathId: number
  path: string
  priority: number
}
