import { describe, expect, it } from 'vitest'
import { getRouteAccessDecision } from './routeAccess'

describe('getRouteAccessDecision', () => {
  it('always allows admins', () => {
    const decision = getRouteAccessDecision({
      path: '/player',
      isAdmin: true,
      isRoomOwner: false,
      prefs: {},
    })

    expect(decision.allowed).toBe(true)
  })

  it('allows room owners on protected routes', () => {
    const decision = getRouteAccessDecision({
      path: '/player',
      isAdmin: false,
      isRoomOwner: true,
      prefs: {},
    })

    expect(decision).toEqual({ allowed: true })
  })

  it('blocks collaborators from /player and redirects to /library', () => {
    const decision = getRouteAccessDecision({
      path: '/player',
      isAdmin: false,
      isRoomOwner: false,
      prefs: {
        allowGuestOrchestrator: true,
      },
    })

    expect(decision).toEqual({ allowed: false, redirectTo: '/library' })
  })

  it('allows collaborators on /orchestrator when enabled', () => {
    const decision = getRouteAccessDecision({
      path: '/orchestrator',
      isAdmin: false,
      isRoomOwner: false,
      prefs: {
        allowGuestOrchestrator: true,
      },
    })

    expect(decision).toEqual({ allowed: true })
  })

  it('blocks collaborators on /orchestrator when disabled', () => {
    const decision = getRouteAccessDecision({
      path: '/orchestrator',
      isAdmin: false,
      isRoomOwner: false,
      prefs: {
        allowGuestOrchestrator: false,
      },
    })

    expect(decision).toEqual({ allowed: false, redirectTo: '/library' })
  })

  it('allows collaborators on /camera when enabled', () => {
    const decision = getRouteAccessDecision({
      path: '/camera',
      isAdmin: false,
      isRoomOwner: false,
      prefs: {
        allowGuestCameraRelay: true,
      },
    })

    expect(decision).toEqual({ allowed: true })
  })

  it('blocks collaborators on /camera when disabled', () => {
    const decision = getRouteAccessDecision({
      path: '/camera',
      isAdmin: false,
      isRoomOwner: false,
      prefs: {
        allowGuestCameraRelay: false,
      },
    })

    expect(decision).toEqual({ allowed: false, redirectTo: '/library' })
  })
})
