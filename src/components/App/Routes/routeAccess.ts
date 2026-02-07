import { resolveRoomAccessPrefs } from 'shared/roomAccess'
import type { IRoomPrefs } from 'shared/types'

export interface RouteAccessDecision {
  allowed: boolean
  redirectTo?: string
}

interface GetRouteAccessDecisionParams {
  path: string
  isAdmin: boolean
  isRoomOwner: boolean
  prefs?: Partial<IRoomPrefs> | null
}

const UNAUTHORIZED_REDIRECT = '/library'

export function getRouteAccessDecision ({
  path,
  isAdmin,
  isRoomOwner,
  prefs,
}: GetRouteAccessDecisionParams): RouteAccessDecision {
  if (isAdmin || isRoomOwner) {
    return { allowed: true }
  }

  if (path === '/player') {
    return { allowed: false, redirectTo: UNAUTHORIZED_REDIRECT }
  }

  const accessPrefs = resolveRoomAccessPrefs(prefs)

  if (path === '/orchestrator' && !accessPrefs.allowGuestOrchestrator) {
    return { allowed: false, redirectTo: UNAUTHORIZED_REDIRECT }
  }

  if (path === '/camera' && !accessPrefs.allowGuestCameraRelay) {
    return { allowed: false, redirectTo: UNAUTHORIZED_REDIRECT }
  }

  return { allowed: true }
}
