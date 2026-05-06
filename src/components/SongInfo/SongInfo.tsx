import React from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import Button from 'components/Button/Button'
import Modal from 'components/Modal/Modal'
import { formatDuration } from 'lib/dateTime'
import {
  closeSongInfo,
  setPreferredSong,
  setRoomPreferredSong,
  setUserPreferredSong,
} from 'store/modules/songInfo'
import styles from './SongInfo.css'

const SongInfo = () => {
  const { isLoading, isVisible, songId, media } = useAppSelector(state => state.songInfo)
  const { isAdmin, role, roomId, userId } = useAppSelector(state => state.user)
  const isRoomManager = role === 'room_manager'

  const dispatch = useAppDispatch()
  const handleCloseSongInfo = () => dispatch(closeSongInfo())

  // Global default — admin only
  const handleSetGlobal = (mediaId: number, isPreferred: boolean) =>
    dispatch(setPreferredSong({ songId, mediaId, isPreferred }))

  // Room default — room manager (or admin acting in a room context)
  const handleSetRoom = (mediaId: number, isPreferred: boolean) =>
    dispatch(setRoomPreferredSong({ songId, mediaId, roomId, isPreferred }))

  // Personal preference — any authenticated user
  const handleSetUser = (mediaId: number, isPreferred: boolean) =>
    dispatch(setUserPreferredSong({ songId, mediaId, isPreferred }))

  const mediaDetails = media.result.map((mediaId) => {
    const item = media.entities[mediaId]
    const isGlobal = !!item.isPreferred
    const isRoom = !!item.roomPreferred
    const isUser = !!item.userPreferred

    // Determine which tier is currently active for this user so we can
    // show a clear "this is what you'll get" indicator.
    const activeLabel = isUser
      ? 'Active (your choice)'
      : isRoom
        ? 'Active (room default)'
        : isGlobal
          ? 'Active (global default)'
          : null

    return (
      <div key={item.mediaId} className={styles.media}>
        {item.path + (item.path.indexOf('/') === 0 ? '/' : '\\') + item.relPath}
        <br />
        <span className={styles.label}>Duration: </span>
        {formatDuration(item.duration)}
        <br />
        <span className={styles.label}>Media ID: </span>
        {mediaId}

        {activeLabel && (
          <>
            <br />
            <span className={styles.label}>Status: </span>
            <strong>{activeLabel}</strong>
          </>
        )}

        {/* Global default — admin only */}
        {isAdmin && (
          <>
            <br />
            <span className={styles.label}>Global default: </span>
            {isGlobal
              && (
                <span>
                  <strong>Yes</strong>
&nbsp;
                  <a onClick={() => handleSetGlobal(mediaId, false)}>(Unset)</a>
                </span>
              )}
            {!isGlobal
              && (
                <span>
                  No&nbsp;
                  <a onClick={() => handleSetGlobal(mediaId, true)}>(Set)</a>
                </span>
              )}
          </>
        )}

        {/* Room default — room managers and admins acting in a room */}
        {(isAdmin || isRoomManager) && typeof roomId === 'number' && (
          <>
            <br />
            <span className={styles.label}>Room default: </span>
            {isRoom
              && (
                <span>
                  <strong>Yes</strong>
&nbsp;
                  <a onClick={() => handleSetRoom(mediaId, false)}>(Unset)</a>
                </span>
              )}
            {!isRoom
              && (
                <span>
                  No&nbsp;
                  <a onClick={() => handleSetRoom(mediaId, true)}>(Set)</a>
                </span>
              )}
          </>
        )}

        {/* Personal preference — any logged-in user (including guests) */}
        {typeof userId === 'number' && (
          <>
            <br />
            <span className={styles.label}>My version: </span>
            {isUser
              && (
                <span>
                  <strong>Yes</strong>
&nbsp;
                  <a onClick={() => handleSetUser(mediaId, false)}>(Clear)</a>
                </span>
              )}
            {!isUser
              && (
                <span>
                  No&nbsp;
                  <a onClick={() => handleSetUser(mediaId, true)}>(Set)</a>
                </span>
              )}
          </>
        )}
      </div>
    )
  })

  return (
    <Modal
      visible={isVisible}
      onClose={handleCloseSongInfo}
      title='Song Info'
    >
      <div className={styles.container}>
        <p>
          <span className={styles.label}>Song ID: </span>
          {songId}
          <br />
          <span className={styles.label}>Media Files: </span>
          {isLoading ? '?' : media.result.length}
        </p>

        <div className={styles.mediaContainer}>
          {isLoading ? <p>Loading...</p> : mediaDetails}
        </div>

        <div>
          <Button variant='primary' onClick={handleCloseSongInfo}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SongInfo
