import React, { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import Player from '../Player/Player'
import PlayerTextOverlay from '../PlayerTextOverlay/PlayerTextOverlay'
import PlayerQR from '../PlayerQR/PlayerQR'
import getRoundRobinQueue from 'routes/Queue/selectors/getRoundRobinQueue'
import { playerLeave, playerError, playerLoad, playerPlay, playerStatus, type State as PlayerState } from '../../modules/player'
import getRoomPrefs from '../../selectors/getRoomPrefs'
import type { QueueItem } from 'shared/types'

interface PlayerControllerProps {
  width: number
  height: number
}

const PlayerController = (props: PlayerControllerProps) => {
  const queue = useAppSelector(getRoundRobinQueue)
  const player = useAppSelector(state => state.player)
  const playerVisualizer = useAppSelector(state => state.playerVisualizer)
  const prefs = useAppSelector(state => state.prefs)
  const roomPrefs = useAppSelector(getRoomPrefs)
  const queueItem = queue.entities[player.queueId]
  const nextQueueItem = queue.entities[queue.result[queue.result.indexOf(player.queueId) + 1]]

  const dispatch = useAppDispatch()
  const handleStatus = useCallback<(status?: Partial<PlayerState>) => void>(status => dispatch(playerStatus(status)), [dispatch])
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
      isVideoKeyingEnabled: nextQueueItem.isVideoKeyingEnabled,
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
  ])

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
        isVideoKeyingEnabled={!!queueItem?.isVideoKeyingEnabled}
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
        queueItem={queueItem as QueueItem}
        nextQueueItem={nextQueueItem as QueueItem}
        isAtQueueEnd={player.isAtQueueEnd}
        isQueueEmpty={!queue.result.length}
        isErrored={player.isErrored}
        width={props.width}
        height={props.height}
      />
      {roomPrefs?.qr?.isEnabled && (
        <PlayerQR
          height={props.height}
          prefs={roomPrefs.qr}
          queueItem={queueItem}
        />
      )}
    </>
  )
}

export default PlayerController
