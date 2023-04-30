import PropTypes from 'prop-types'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Player from '../Player'
import PlayerTextOverlay from '../PlayerTextOverlay'
import PlayerRemoteControlQR from '../PlayerRemoteControlQR'
import getRoundRobinQueue from 'routes/Queue/selectors/getRoundRobinQueue'
import { playerLeave, playerError, playerLoad, playerPlay, playerStatus } from '../../modules/player'
import { fetchRoom } from 'store/modules/room'

const PlayerController = props => {
  const queue = useSelector(getRoundRobinQueue)
  const player = useSelector(state => state.player)
  const playerVisualizer = useSelector(state => state.playerVisualizer)
  const playerRemoteControlQR = useSelector(state => state.playerRemoteControlQR)
  const prefs = useSelector(state => state.prefs)
  const user = useSelector(state => state.user)
  const room = useSelector(state => state.room.entity)
  const queueItem = queue.entities[player.queueId]
  const nextQueueItem = queue.entities[queue.result[queue.result.indexOf(player.queueId) + 1]]

  const dispatch = useDispatch()
  const handleStatus = useCallback(status => dispatch(playerStatus(status)), [dispatch])
  const handleLoad = useCallback(() => dispatch(playerLoad()), [dispatch])
  const handlePlay = useCallback(() => dispatch(playerPlay()), [dispatch])
  const handleError = useCallback((msg) => {
    dispatch(playerError(msg))
    handleStatus()
  }, [dispatch, handleStatus])

  const handleLoadNext = useCallback(() => {
    const history = JSON.parse(player.historyJSON)

    // add current item to history (once)
    if (queueItem && history.lastIndexOf(queueItem.queueId) === -1) {
      history.push(queueItem.queueId)
    }

    // queue exhausted?
    if (!nextQueueItem) {
      handleStatus({
        historyJSON: JSON.stringify(history),
        isAtQueueEnd: true,
        isPlayingNext: false,
        mediaType: null,
      })

      return
    }

    // play next
    handleStatus({
      historyJSON: JSON.stringify(history),
      isAtQueueEnd: false,
      isPlaying: true,
      isPlayingNext: false,
      mediaType: nextQueueItem.mediaType,
      position: 0,
      queueId: nextQueueItem.queueId,
      nextUserId: null,
    })
  }, [handleStatus, nextQueueItem, player.historyJSON, queueItem])

  // "lock in" the next user that isn't the currently up user, if possible
  useEffect(() => {
    if (!player.nextUserId || queueItem?.userId === nextQueueItem?.userId) {
      for (let i = queue.result.indexOf(queueItem?.queueId) + 1; i < queue.result.length; i++) {
        if (queueItem?.userId !== queue.entities[queue.result[i]].userId) {
          handleStatus({ nextUserId: queue.entities[queue.result[i]].userId })
          return
        }
      }
    }
  }, [handleStatus, nextQueueItem, player.nextUserId, queue, queueItem])

  // always emit status when any of these change
  useEffect(() => handleStatus(), [
    handleStatus,
    player.cdgAlpha,
    player.cdgSize,
    player.isPlaying,
    player.mp4Alpha,
    player.volume,
    playerVisualizer,
    playerRemoteControlQR
  ])

  // once per mount
  useEffect(() => {
    dispatch(fetchRoom(user.roomId))
  }, [dispatch])

  // on unmount
  useEffect(() => () => dispatch(playerLeave()), [dispatch])

  // playing for first time or playing next?
  useEffect(() => {
    if ((player.isPlaying && player.queueId === -1) || player.isPlayingNext) {
      handleLoadNext()
    }
  }, [handleLoadNext, player.isPlaying, player.queueId, player.isPlayingNext])

  // queue was exhausted, but is no longer?
  useEffect(() => {
    if (player.isAtQueueEnd && nextQueueItem && player.isPlaying) {
      handleLoadNext()
    }
  }, [handleLoadNext, player.isAtQueueEnd, player.isPlaying, nextQueueItem])

  // retrying after error?
  useEffect(() => {
    if (player.isErrored && player.isPlaying) {
      handleStatus({ isErrored: false })
    }
  }, [handleStatus, player.isErrored, player.isPlaying])


  return (
    <>
      <Player
        cdgAlpha={player.cdgAlpha}
        cdgSize={player.cdgSize}
        isPlaying={player.isPlaying}
        isVisible={!!queueItem && !player.isErrored && !player.isAtQueueEnd}
        isReplayGainEnabled={prefs.isReplayGainEnabled}
        isWebGLSupported={player.isWebGLSupported}
        mediaId={queueItem ? queueItem.mediaId : null}
        mediaKey={queueItem ? queueItem.queueId : null}
        mediaType={queueItem ? queueItem.mediaType : null}
        mp4Alpha={player.mp4Alpha}
        onEnd={handleLoadNext}
        onError={handleError}
        onLoad={handleLoad}
        onPlay={handlePlay}
        onStatus={handleStatus}
        rgTrackGain={queueItem ? queueItem.rgTrackGain : null}
        rgTrackPeak={queueItem ? queueItem.rgTrackPeak : null}
        visualizer={playerVisualizer}
        volume={player.volume}
        width={props.width}
        height={props.height}
      />
      <PlayerTextOverlay
        queueItem={queueItem}
        nextQueueItem={nextQueueItem}
        isAtQueueEnd={player.isAtQueueEnd}
        isQueueEmpty={!queue.result.length}
        isErrored={player.isErrored}
        width={props.width}
        height={props.height}
      />
      {playerRemoteControlQR.isEnabled && room.remoteControlQREnabled &&
        <PlayerRemoteControlQR
          alternate={playerRemoteControlQR.alternate}
          size={playerRemoteControlQR.size}
          opacity={playerRemoteControlQR.opacity}
          roomId={user.roomId}
        />
      }
    </>
  )
}

PlayerController.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
}

export default PlayerController
