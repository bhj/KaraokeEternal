import React, { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { useCameraReceiver } from 'lib/webrtc/useCameraReceiver'
import { VISUALIZER_HYDRA_CODE_REQ } from 'shared/actionTypes'
import { fetchPresetById } from 'routes/Orchestrator/api/hydraPresetsApi'
import { useRuntimeHydraPresets } from '../useRuntimeHydraPresets'
import {
  getNextPresetIndex,
  normalizePresetIndex,
  toVisualizerPresetLabel,
} from '../runtimePresets'
import Player from '../Player/Player'
import PlayerTextOverlay from '../PlayerTextOverlay/PlayerTextOverlay'
import PlayerQR from '../PlayerQR/PlayerQR'
import getRoundRobinQueue from 'routes/Queue/selectors/getRoundRobinQueue'
import { playerLeave, playerError, playerLoad, playerPlay, playerStatus, type PlayerState } from '../../modules/player'
import getRoomPrefs from '../../selectors/getRoomPrefs'
import type { QueueItem } from 'shared/types'
import { shouldApplyFolderDefaultAtSessionStart, shouldApplyFolderDefaultOnIdle, shouldApplyFolderDefaultOnPoolReady, shouldApplyStartingPresetAtSessionStart, shouldApplyStartingPresetOnIdle, shouldCyclePresetOnSongTransition } from './transitionPolicy'

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
  const roomId = useAppSelector(state => state.user.roomId)
  const room = useAppSelector(state => roomId ? state.rooms.entities[roomId] : null)
  const runtimePresetPool = useRuntimeHydraPresets()
  const queueItem = queue.entities[player.queueId]
  const nextQueueItem = queue.entities[queue.result[queue.result.indexOf(player.queueId) + 1]]

  const startingPresetAppliedRef = useRef(false)
  const lastTransitionKeyRef = useRef<string | null>(null)

  const { videoElement: remoteVideoElement } = useCameraReceiver()
  const dispatch = useAppDispatch()
  const handleStatus = useCallback<(status?: Partial<PlayerState>) => void>(status => dispatch(playerStatus(status)), [dispatch])
  const handleLoad = useCallback(() => dispatch(playerLoad()), [dispatch])
  const handlePlay = useCallback(() => dispatch(playerPlay()), [dispatch])
  const handleError = useCallback((msg: string) => {
    dispatch(playerError(msg))
    handleStatus()
  }, [dispatch, handleStatus])

  const emitHydraPresetByIndex = useCallback((index: number) => {
    const presets = runtimePresetPool.presets
    if (presets.length === 0) return

    const normalizedIndex = normalizePresetIndex(index, presets.length)
    const preset = presets[normalizedIndex]
    if (!preset) return

    dispatch({
      type: VISUALIZER_HYDRA_CODE_REQ,
      payload: {
        code: preset.code,
        hydraPresetIndex: normalizedIndex,
        hydraPresetName: toVisualizerPresetLabel(preset, runtimePresetPool.folderName),
        hydraPresetId: preset.presetId,
        hydraPresetFolderId: preset.folderId,
        hydraPresetSource: preset.source,
      },
    })
  }, [dispatch, runtimePresetPool])

  const emitStartingPresetById = useCallback(async (presetId: number) => {
    try {
      const preset = await fetchPresetById(presetId)
      if (!preset?.code || !preset.code.trim()) return

      const folderName = runtimePresetPool.folderId === preset.folderId
        ? runtimePresetPool.folderName
        : null

      dispatch({
        type: VISUALIZER_HYDRA_CODE_REQ,
        payload: {
          code: preset.code,
          hydraPresetName: folderName ? `${folderName} / ${preset.name}` : preset.name,
          hydraPresetId: preset.presetId,
          hydraPresetFolderId: preset.folderId,
          hydraPresetSource: 'folder',
        },
      })
    } catch {
      // Preset may have been removed after room prefs were saved.
    }
  }, [dispatch, runtimePresetPool.folderId, runtimePresetPool.folderName])

  const handleReplay = useCallback((queueId: number) => {
    const nextItem = queue.entities[queueId]
    if (!nextItem) return

    const history = JSON.parse(player.historyJSON)

    if (queueId !== player.queueId) {
      // reset history up to and including the replaying queueId
      const idx = history.lastIndexOf(queueId)
      if (idx !== -1) history.splice(idx)
    }

    handleStatus({
      historyJSON: JSON.stringify(history),
      isAtQueueEnd: false,
      isPlaying: true,
      isVideoKeyingEnabled: nextItem.isVideoKeyingEnabled,
      mediaType: nextItem.mediaType,
      position: 0,
      queueId: nextItem.queueId,
      nextUserId: null,
      _isReplayingQueueId: null,
    })
  }, [handleStatus, player.queueId, player.historyJSON, queue.entities])

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
        mediaType: null,
        _isPlayingNext: false,
      })

      return
    }

    if (shouldApplyStartingPresetAtSessionStart({
      startingPresetId: roomPrefs?.startingPresetId,
      currentQueueId: player.queueId,
      historyJSON: player.historyJSON,
      nextQueueId: nextQueueItem.queueId,
      hasAppliedStartingPreset: startingPresetAppliedRef.current,
    })) {
      startingPresetAppliedRef.current = true
      void emitStartingPresetById(roomPrefs.startingPresetId as number)
    } else if (shouldApplyFolderDefaultAtSessionStart({
      startingPresetId: roomPrefs?.startingPresetId,
      currentQueueId: player.queueId,
      historyJSON: player.historyJSON,
      nextQueueId: nextQueueItem.queueId,
      hasAppliedStartingPreset: startingPresetAppliedRef.current,
      runtimePresetSource: runtimePresetPool.source,
      runtimePresetCount: runtimePresetPool.presets.length,
    })) {
      startingPresetAppliedRef.current = true
      emitHydraPresetByIndex(0)
    }

    if (shouldCyclePresetOnSongTransition({
      cycleOnSongTransition: playerVisualizer.cycleOnSongTransition,
      isVisualizerEnabled: playerVisualizer.isEnabled,
      visualizerMode: playerVisualizer.mode,
      currentQueueId: queueItem?.queueId,
      nextQueueId: nextQueueItem.queueId,
    })) {
      const transitionKey = `${queueItem?.queueId}->${nextQueueItem.queueId}`
      if (lastTransitionKeyRef.current !== transitionKey) {
        lastTransitionKeyRef.current = transitionKey
        const nextPresetIndex = getNextPresetIndex(
          normalizePresetIndex(playerVisualizer.hydraPresetIndex, runtimePresetPool.presets.length),
          runtimePresetPool.presets.length,
        )
        emitHydraPresetByIndex(nextPresetIndex)
      }
    }

    // play next
    handleStatus({
      historyJSON: JSON.stringify(history),
      isAtQueueEnd: false,
      isPlaying: true,
      isVideoKeyingEnabled: nextQueueItem.isVideoKeyingEnabled,
      mediaType: nextQueueItem.mediaType,
      position: 0,
      queueId: nextQueueItem.queueId,
      nextUserId: null,
      _isPlayingNext: false,
    })
  }, [
    emitHydraPresetByIndex,
    emitStartingPresetById,
    handleStatus,
    nextQueueItem,
    player.historyJSON,
    player.queueId,
    playerVisualizer,
    queueItem,
    roomPrefs,
    runtimePresetPool.presets.length,
    runtimePresetPool.source,
  ])

  // Reset one-shot guards when a fresh session starts.
  useEffect(() => {
    if (player.queueId === -1 && player.historyJSON === '[]') {
      startingPresetAppliedRef.current = false
      lastTransitionKeyRef.current = null
    }
  }, [player.queueId, player.historyJSON])

  // Idle init: apply starting preset (or first folder preset) when player is idle.
  useEffect(() => {
    if (shouldApplyStartingPresetOnIdle({
      startingPresetId: roomPrefs?.startingPresetId,
      queueId: player.queueId,
      hasAppliedStartingPreset: startingPresetAppliedRef.current,
    })) {
      startingPresetAppliedRef.current = true
      void emitStartingPresetById(roomPrefs.startingPresetId as number)
    } else if (shouldApplyFolderDefaultOnIdle({
      startingPresetId: roomPrefs?.startingPresetId,
      queueId: player.queueId,
      hasAppliedStartingPreset: startingPresetAppliedRef.current,
      runtimePresetSource: runtimePresetPool.source,
      runtimePresetCount: runtimePresetPool.presets.length,
    })) {
      startingPresetAppliedRef.current = true
      emitHydraPresetByIndex(0)
    }
  }, [roomPrefs?.startingPresetId, player.queueId, emitStartingPresetById, emitHydraPresetByIndex, runtimePresetPool.source, runtimePresetPool.presets.length])

  // Pool-ready fallback: folder pool arrived after first song started playing.
  useEffect(() => {
    if (shouldApplyFolderDefaultOnPoolReady({
      startingPresetId: roomPrefs?.startingPresetId,
      queueId: player.queueId,
      hasAppliedStartingPreset: startingPresetAppliedRef.current,
      runtimePresetSource: runtimePresetPool.source,
      runtimePresetCount: runtimePresetPool.presets.length,
      historyJSON: player.historyJSON,
    })) {
      startingPresetAppliedRef.current = true
      emitHydraPresetByIndex(0)
    }
  }, [roomPrefs?.startingPresetId, player.queueId, player.historyJSON, emitHydraPresetByIndex, runtimePresetPool.source, runtimePresetPool.presets.length])

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
  useEffect(() => handleStatus({ isVideoKeyingEnabled: queueItem?.isVideoKeyingEnabled }), [
    handleStatus,
    player.cdgAlpha,
    player.cdgSize,
    player.isPlaying,
    player.mp4Alpha,
    player.volume,
    playerVisualizer,
    queueItem?.isVideoKeyingEnabled,
  ])

  // on unmount
  useEffect(() => () => dispatch(playerLeave()), [dispatch])

  // playing for first time or playing next?
  useEffect(() => {
    if ((player.isPlaying && player.queueId === -1) || player._isPlayingNext) {
      handleLoadNext()
    }
  }, [handleLoadNext, player.isPlaying, player.queueId, player._isPlayingNext])

  // replaying?
  useEffect(() => {
    if (player._isReplayingQueueId !== null) {
      handleReplay(player._isReplayingQueueId)
    }
  }, [handleReplay, player._isReplayingQueueId])

  // queue was exhausted, but is no longer?
  useEffect(() => {
    if (player.isAtQueueEnd && nextQueueItem && player.isPlaying) {
      handleLoadNext()
    }
  }, [handleLoadNext, player.isPlaying, player.isAtQueueEnd, nextQueueItem])

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
        mediaReplayKey={player._lastReplayTime}
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
        remoteVideoElement={remoteVideoElement}
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
          invitationToken={room?.invitationToken}
          queueItem={queueItem}
        />
      )}
    </>
  )
}

export default PlayerController
