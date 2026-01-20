import React, { useEffect, useState } from 'react'
import { Provider, useSelector } from 'react-redux'
import store, { RootState } from 'store/store'
import CoreLayout from './CoreLayout/CoreLayout'
import Spinner from '../Spinner/Spinner'
import RoomJoinPrompt from '../RoomJoinPrompt/RoomJoinPrompt'

// Inner component that can use hooks to check bootstrap state
const AppContent = () => {
  const { isBootstrapping, roomId, isGuest, userId } = useSelector((state: RootState) => state.user)
  const [targetRoomId, setTargetRoomId] = useState<number | null>(null)

  // Check for roomId query param and show join prompt if appropriate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomIdParam = params.get('roomId')

    if (roomIdParam) {
      const targetId = parseInt(roomIdParam, 10)

      // Show join prompt if:
      // - User is authenticated (userId exists)
      // - User is NOT a guest (guests are bound to their room)
      // - Target room is different from current room
      if (userId && !isGuest && !isNaN(targetId) && targetId !== roomId) {
        setTargetRoomId(targetId)
      } else {
        // Clean up the param if we're not showing the prompt
        params.delete('roomId')
        const newUrl = params.toString()
          ? `${window.location.pathname}?${params}`
          : window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [userId, isGuest, roomId])

  const handleCloseJoinPrompt = () => {
    setTargetRoomId(null)
    // Clean up the param
    const params = new URLSearchParams(window.location.search)
    params.delete('roomId')
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }

  if (isBootstrapping) {
    return <Spinner />
  }

  return (
    <React.Suspense fallback={<Spinner />}>
      <CoreLayout />
      {targetRoomId && (
        <RoomJoinPrompt
          roomId={targetRoomId}
          onClose={handleCloseJoinPrompt}
        />
      )}
    </React.Suspense>
  )
}

const App = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
)

export default App
