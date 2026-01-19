import getLogger from './Log.js'
const log = getLogger('AuthentikClient')

const AUTHENTIK_URL = process.env.KES_AUTHENTIK_URL
const AUTHENTIK_TOKEN = process.env.KES_AUTHENTIK_API_TOKEN
const ENROLLMENT_FLOW_SLUG = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW || 'karaoke-guest-enrollment'
const GUEST_GROUP = process.env.KES_GUEST_GROUP || 'karaoke-guests'

export class AuthentikClient {
  static isConfigured (): boolean {
    return !!(AUTHENTIK_URL && AUTHENTIK_TOKEN)
  }

  /**
   * Create invitation for a room
   */
  static async createInvitation (roomId: number): Promise<string | null> {
    if (!this.isConfigured()) return null

    try {
      // Get flow pk from slug
      const flowRes = await fetch(`${AUTHENTIK_URL}/api/v3/flows/instances/?slug=${ENROLLMENT_FLOW_SLUG}`, {
        headers: { Authorization: `Bearer ${AUTHENTIK_TOKEN}` },
      })
      const flowData = await flowRes.json()
      const flowPk = flowData.results?.[0]?.pk
      if (!flowPk) {
        log.error('Enrollment flow not found: %s', ENROLLMENT_FLOW_SLUG)
        return null
      }

      const res = await fetch(`${AUTHENTIK_URL}/api/v3/stages/invitation/invitations/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTHENTIK_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `karaoke-room-${roomId}-${Date.now()}`,
          flow: flowPk,
          fixed_data: { karaoke_room_id: String(roomId) },
          single_use: false,
        }),
      })

      if (!res.ok) {
        log.error('Failed to create invitation: %s', await res.text())
        return null
      }

      const data = await res.json()
      // Authentik returns `pk` as the invitation UUID used in ?itoken=
      log.info('Created Authentik invitation for room %d: %s', roomId, data.pk)
      return data.pk
    } catch (err) {
      log.error('Authentik API error: %s', (err as Error).message)
      return null
    }
  }

  /**
   * Delete invitations and users for a room
   */
  static async cleanupRoom (roomId: number): Promise<void> {
    if (!this.isConfigured()) return

    try {
      // Delete invitations by name prefix
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

      // Delete ONLY guest users (in karaoke-guests group) with matching room attribute
      // CRITICAL: Must filter by BOTH group AND attribute to avoid deleting regular users
      const usersRes = await fetch(
        `${AUTHENTIK_URL}/api/v3/core/users/?groups_by_name=${encodeURIComponent(GUEST_GROUP)}&attributes__karaoke_room_id=${roomId}`,
        { headers: { Authorization: `Bearer ${AUTHENTIK_TOKEN}` } },
      )
      const users = await usersRes.json()

      for (const user of users.results || []) {
        // Double-check: verify user is in guest group before deleting
        const isGuest = user.groups_obj?.some((g: { name: string }) => g.name === GUEST_GROUP)
        if (!isGuest) {
          log.warn('Skipping non-guest user %s (not in %s group)', user.username, GUEST_GROUP)
          continue
        }

        await fetch(`${AUTHENTIK_URL}/api/v3/core/users/${user.pk}/`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${AUTHENTIK_TOKEN}` },
        })
        log.info('Deleted Authentik guest user %s for room %d', user.username, roomId)
      }
    } catch (err) {
      log.error('Authentik cleanup error for room %d: %s', roomId, (err as Error).message)
    }
  }
}
