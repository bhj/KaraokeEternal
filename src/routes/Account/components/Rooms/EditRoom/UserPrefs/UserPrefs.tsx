import React, { useCallback, useEffect, useState } from 'react'
import { useAppSelector } from 'store/hooks'
import Accordion from 'components/Accordion/Accordion'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import Icon from 'components/Icon/Icon'
import type { IRoomPrefs } from 'shared/types'
import { resolveRoomAccessPrefs } from 'shared/roomAccess'
import { fetchFolders } from 'routes/Orchestrator/api/hydraPresetsApi'
import type { PresetFolder } from 'routes/Orchestrator/components/presetTree'
import styles from './UserPrefs.css'

interface UserPrefsProps {
  prefs: Partial<IRoomPrefs>
  onChange: (prefs: Partial<IRoomPrefs>) => void
}

const UserPrefs = ({ onChange, prefs = {} }: UserPrefsProps) => {
  const roles = useAppSelector(state => state.prefs.roles)
  const [presetFolders, setPresetFolders] = useState<PresetFolder[]>([])

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

  const getRoleId = useCallback((roleName: string) => {
    return roles.result.find(roleId => roles.entities[roleId].name === roleName)
  }, [roles.entities, roles.result])

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    const roleId = getRoleId(name)
    if (!roleId) return

    onChange({
      ...prefs,
      roles: {
        ...prefs.roles,
        [roleId]: {
          ...prefs.roles?.[roleId],
          allowNew: checked,
        },
      },
    })
  }, [getRoleId, onChange, prefs])

  const handleAccessToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    const nextPrefs: Partial<IRoomPrefs> = { ...prefs }

    if (name === 'allowGuestOrchestrator') {
      nextPrefs.allowGuestOrchestrator = checked
    } else if (name === 'allowGuestCameraRelay') {
      nextPrefs.allowGuestCameraRelay = checked
    } else if (name === 'allowRoomCollaboratorsToSendVisualizer') {
      nextPrefs.allowRoomCollaboratorsToSendVisualizer = checked
    } else {
      return
    }

    onChange(nextPrefs)
  }, [onChange, prefs])

  const handlePartyRestrictionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...prefs,
      restrictCollaboratorsToPartyPresetFolder: e.target.checked,
    })
  }, [onChange, prefs])

  const handlePartyFolderChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value
    onChange({
      ...prefs,
      partyPresetFolderId: raw === '' ? null : Number(raw),
    })
  }, [onChange, prefs])

  const handlePlayerFolderChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value
    onChange({
      ...prefs,
      playerPresetFolderId: raw === '' ? null : Number(raw),
    })
  }, [onChange, prefs])

  const allowNewGuest = prefs.roles?.[getRoleId('guest')]?.allowNew ?? false
  const allowNewStandard = prefs.roles?.[getRoleId('standard')]?.allowNew ?? false
  const accessPrefs = resolveRoomAccessPrefs(prefs)
  const partyPresetFolderId = typeof prefs.partyPresetFolderId === 'number' ? prefs.partyPresetFolderId : ''
  const playerPresetFolderId = typeof prefs.playerPresetFolderId === 'number' ? prefs.playerPresetFolderId : ''
  const restrictToPartyFolder = prefs.restrictCollaboratorsToPartyPresetFolder === true

  return (
    <Accordion
      headingComponent={(
        <div className={styles.heading}>
          <Icon icon='PERSON' />
          <div className={styles.title}>Users</div>
        </div>
      )}
    >
      <div className={styles.content}>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow new standard users'
            name='standard'
            checked={allowNewStandard}
            onChange={handleRoleChange}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow new guests'
            name='guest'
            checked={allowNewGuest}
            onChange={handleRoleChange}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow guest orchestrator'
            name='allowGuestOrchestrator'
            checked={accessPrefs.allowGuestOrchestrator}
            onChange={handleAccessToggle}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow guest camera relay'
            name='allowGuestCameraRelay'
            checked={accessPrefs.allowGuestCameraRelay}
            onChange={handleAccessToggle}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow collaborators to send visuals'
            name='allowRoomCollaboratorsToSendVisualizer'
            checked={accessPrefs.allowRoomCollaboratorsToSendVisualizer}
            onChange={handleAccessToggle}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Restrict collaborators to party preset folder'
            name='restrictCollaboratorsToPartyPresetFolder'
            checked={restrictToPartyFolder}
            onChange={handlePartyRestrictionChange}
          />
          <div className={styles.helperText}>
            When enabled, guests and non-owner collaborators can only load presets from the selected folder.
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor='playerPresetFolderId'>Player preset folder</label>
          <select
            id='playerPresetFolderId'
            className={styles.select}
            value={playerPresetFolderId}
            onChange={handlePlayerFolderChange}
          >
            <option value=''>Use gallery</option>
            {presetFolders.map(folder => (
              <option key={folder.folderId} value={folder.folderId}>
                {folder.name}
              </option>
            ))}
          </select>
          <div className={styles.helperText}>
            Player next/prev/random and song-transition cycling use this folder when set.
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor='partyPresetFolderId'>Party preset folder</label>
          <select
            id='partyPresetFolderId'
            className={styles.select}
            value={partyPresetFolderId}
            onChange={handlePartyFolderChange}
          >
            <option value=''>None selected</option>
            {presetFolders.map(folder => (
              <option key={folder.folderId} value={folder.folderId}>
                {folder.name}
              </option>
            ))}
          </select>
          <div className={styles.helperText}>
            Pick your curated party folder here.
          </div>
        </div>
      </div>
    </Accordion>
  )
}

export default UserPrefs
