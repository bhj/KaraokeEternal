import getLogger from './Log.js'
const log = getLogger('AuthentikClient')

const AUTHENTIK_URL = process.env.KES_AUTHENTIK_URL
const AUTHENTIK_TOKEN = process.env.KES_AUTHENTIK_API_TOKEN

// NOTE: Guest enrollment methods (createInvitation, getOrCreateInvitation) have been removed.
// Guests now use app-managed sessions via /api/guest/join instead of Authentik enrollment.
// Standard users still authenticate via Authentik SSO.

export class AuthentikClient {
  static isConfigured (): boolean {
    return !!(AUTHENTIK_URL && AUTHENTIK_TOKEN)
  }

  /**
   * Clean up Authentik invitations for a room when it's deleted
   * This is only needed for rooms that may have had invitations created
   * before the migration to app-managed guest sessions.
   */
  static async cleanupRoom (roomId: number): Promise<void> {
    if (!this.isConfigured()) return

    try {
      // Delete invitations by name prefix (safe - these are room-specific)
      const invRes = await fetch(
        `${AUTHENTIK_URL}/api/v3/stages/invitation/invitations/?name__startswith=karaoke-room-${roomId}-`,
        { headers: { Authorization: `Bearer ${AUTHENTIK_TOKEN}` } },
      )
      const invitations = await invRes.json()

      for (const inv of invitations.results || []) {
        await fetch(`${AUTHENTIK_URL}/api/v3/stages/invitation/invitations/${inv.pk}/`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${AUTHENTIK_TOKEN}` },
        })
        log.info('Deleted invitation %s for room %d', inv.pk, roomId)
      }

      // Guest user cleanup is handled by Authentik expiry policies
    } catch (err) {
      log.error('Authentik cleanup error for room %d: %s', roomId, (err as Error).message)
    }
  }
}
