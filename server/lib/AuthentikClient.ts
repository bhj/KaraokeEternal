import getLogger from './Log.js'
const log = getLogger('AuthentikClient')

const AUTHENTIK_URL = process.env.KES_AUTHENTIK_URL
const AUTHENTIK_TOKEN = process.env.KES_AUTHENTIK_API_TOKEN
const ENROLLMENT_FLOW_SLUG = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW || 'karaoke-guest-enrollment'

interface InvitationData {
  pk: string
  name: string
  expires: string
  fixed_data: Record<string, string>
}

export class AuthentikClient {
  static isConfigured (): boolean {
    return !!(AUTHENTIK_URL && AUTHENTIK_TOKEN)
  }

  /**
   * Get an existing invitation by its token (pk)
   * Returns the invitation data if found and valid, null otherwise
   */
  static async getInvitation (token: string): Promise<InvitationData | null> {
    if (!this.isConfigured()) return null

    try {
      const res = await fetch(`${AUTHENTIK_URL}/api/v3/stages/invitation/invitations/${token}/`, {
        headers: { Authorization: `Bearer ${AUTHENTIK_TOKEN}` },
      })

      if (!res.ok) {
        return null
      }

      return await res.json()
    } catch (err) {
      log.error('Authentik API error checking invitation: %s', (err as Error).message)
      return null
    }
  }

  /**
   * Get an existing valid invitation or create a new one for a room
   * This ensures there's always a valid invitation for guest enrollment
   *
   * @param roomId - The room ID to get/create invitation for
   * @param existingToken - Optional existing token from room data to check first
   * @returns The invitation token (pk) or null on failure
   */
  static async getOrCreateInvitation (roomId: number, existingToken: string | null): Promise<string | null> {
    if (!this.isConfigured()) return null

    // If there's an existing token, check if it's still valid
    if (existingToken) {
      const invitation = await this.getInvitation(existingToken)
      if (invitation) {
        // Check if not expired (Authentik returns ISO date string)
        const expires = new Date(invitation.expires)
        if (expires > new Date()) {
          log.verbose('Using existing valid invitation %s for room %d', existingToken, roomId)
          return existingToken
        }
        log.info('Existing invitation %s for room %d has expired, creating new one', existingToken, roomId)
      } else {
        log.info('Existing invitation %s for room %d not found, creating new one', existingToken, roomId)
      }
    }

    // Create a new invitation
    return await this.createInvitation(roomId)
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

      // Set 8-hour expiry to prevent premature invitation invalidation
      const expiresDate = new Date()
      expiresDate.setHours(expiresDate.getHours() + 8)

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
          expires: expiresDate.toISOString(),
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
   * Delete invitations for a room
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
