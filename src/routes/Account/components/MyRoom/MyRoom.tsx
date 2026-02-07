import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { QRCode } from 'react-qrcode-logo'
import Panel from 'components/Panel/Panel'
import Button from 'components/Button/Button'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import HttpApi from 'lib/HttpApi'
import { resolveRoomAccessPrefs } from 'shared/roomAccess'
import type { IRoomPrefs } from 'shared/types'
import { fetchFolders } from 'routes/Orchestrator/api/hydraPresetsApi'
import type { PresetFolder } from 'routes/Orchestrator/components/presetTree'
import styles from './MyRoom.css'

interface MyRoomData {
  room: {
    roomId: number
    name: string
    status: string
    invitationToken: string | null
    prefs?: Partial<IRoomPrefs>
  } | null
}

const MyRoom = () => {
  const [data, setData] = useState<MyRoomData | null>(null)
  const [copied, setCopied] = useState(false)
  const [presetFolders, setPresetFolders] = useState<PresetFolder[]>([])
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)
  const [prefsError, setPrefsError] = useState<string | null>(null)

  useEffect(() => {
    const api = new HttpApi('rooms')
    api.get<MyRoomData>('/my')
      .then(setData)
      .catch(() => setData(null))
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetchFolders()
      .then((folders): null => {
        if (!cancelled) {
          setPresetFolders(folders)
        }
        return null
      })
      .catch((): null => {
        if (!cancelled) {
          setPresetFolders([])
        }
        return null
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Build Smart QR URL client-side using roomId and invitationToken
  const smartQrUrl = useMemo(() => {
    if (data?.room?.roomId && data?.room?.invitationToken) {
      const joinUrl = new URL(window.location.origin)
      joinUrl.pathname = `/api/rooms/join/${data.room.roomId}/${data.room.invitationToken}`
      return joinUrl.toString()
    }
    return null
  }, [data])

  const handleCopy = useCallback(() => {
    if (smartQrUrl) {
      navigator.clipboard.writeText(smartQrUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [smartQrUrl])

  const updatePrefs = useCallback((patch: Partial<IRoomPrefs>) => {
    setData((prev) => {
      if (!prev?.room) return prev
      return {
        ...prev,
        room: {
          ...prev.room,
          prefs: {
            ...(prev.room.prefs ?? {}),
            ...patch,
          },
        },
      }
    })
    setPrefsError(null)
  }, [])

  const handleSavePrefs = useCallback(async () => {
    if (!data?.room) return

    const prefs = data.room.prefs ?? {}

    setIsSavingPrefs(true)
    setPrefsError(null)

    try {
      const api = new HttpApi('rooms')
      const response = await api.put<MyRoomData>('/my/prefs', {
        body: { prefs },
      })
      setData(response)
    } catch {
      setPrefsError('Failed to save room policy')
    } finally {
      setIsSavingPrefs(false)
    }
  }, [data])

  if (!data) {
    return null // Loading
  }

  if (!data.room) {
    return (
      <Panel title='My Room'>
        <p className={styles.noRoom}>No room found. Please refresh the page.</p>
      </Panel>
    )
  }

  const { room } = data
  const roomPrefs = room.prefs ?? {}
  const accessPrefs = resolveRoomAccessPrefs(roomPrefs)
  const partyPresetFolderId = typeof roomPrefs.partyPresetFolderId === 'number' ? String(roomPrefs.partyPresetFolderId) : ''
  const restrictToPartyFolder = roomPrefs.restrictCollaboratorsToPartyPresetFolder === true

  return (
    <Panel title='My Room' contentClassName={styles.content}>
      <p>
        Room:
        {' '}
        <strong>{room.name}</strong>
        {' '}
        (
        {room.status}
        )
      </p>

      {smartQrUrl
        ? (
            <>
              <div className={styles.qrContainer}>
                <QRCode
                  value={smartQrUrl}
                  ecLevel='L'
                  size={180}
                  quietZone={10}
                  logoImage={`${document.baseURI}assets/app.png`}
                  logoWidth={60}
                  logoHeight={60}
                  logoOpacity={0.5}
                  qrStyle='dots'
                />
                <span className={styles.qrLabel}>Scan to join room</span>
              </div>

              <div className={styles.urlContainer}>
                <label>Invite link:</label>
                <input
                  type='text'
                  className={styles.urlInput}
                  value={smartQrUrl}
                  readOnly
                  onFocus={e => e.target.select()}
                />
                <Button
                  className={styles.copyBtn}
                  onClick={handleCopy}
                  variant='default'
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </>
          )
        : (
            <p className={styles.noRoom}>
              Guest invitations not configured. Contact admin to set up Authentik integration.
            </p>
          )}

      <section className={styles.policySection}>
        <h4 className={styles.policyTitle}>Room Access</h4>

        <InputCheckbox
          label='Allow guest orchestrator'
          name='allowGuestOrchestrator'
          checked={accessPrefs.allowGuestOrchestrator}
          onChange={e => updatePrefs({ allowGuestOrchestrator: e.target.checked })}
        />

        <InputCheckbox
          label='Allow guest camera relay'
          name='allowGuestCameraRelay'
          checked={accessPrefs.allowGuestCameraRelay}
          onChange={e => updatePrefs({ allowGuestCameraRelay: e.target.checked })}
        />

        <InputCheckbox
          label='Allow collaborators to send visuals'
          name='allowRoomCollaboratorsToSendVisualizer'
          checked={accessPrefs.allowRoomCollaboratorsToSendVisualizer}
          onChange={e => updatePrefs({ allowRoomCollaboratorsToSendVisualizer: e.target.checked })}
        />

        <InputCheckbox
          label='Restrict collaborators to party preset folder'
          name='restrictCollaboratorsToPartyPresetFolder'
          checked={restrictToPartyFolder}
          onChange={e => updatePrefs({ restrictCollaboratorsToPartyPresetFolder: e.target.checked })}
        />

        <label htmlFor='partyPresetFolderId'>Party preset folder</label>
        <select
          id='partyPresetFolderId'
          className={styles.policySelect}
          value={partyPresetFolderId}
          onChange={e => updatePrefs({ partyPresetFolderId: e.target.value === '' ? null : Number(e.target.value) })}
        >
          <option value=''>None selected</option>
          {presetFolders.map(folder => (
            <option key={folder.folderId} value={folder.folderId}>
              {folder.name}
            </option>
          ))}
        </select>

        {prefsError && <p className={styles.policyError}>{prefsError}</p>}

        <Button
          variant='primary'
          onClick={handleSavePrefs}
          disabled={isSavingPrefs}
          className={styles.policySaveBtn}
        >
          {isSavingPrefs ? 'Saving...' : 'Save Room Policy'}
        </Button>
      </section>
    </Panel>
  )
}

export default MyRoom
