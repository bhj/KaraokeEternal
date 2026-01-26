import React, { useEffect, useState, useRef } from 'react'
import { Provider, useSelector } from 'react-redux'
import store, { RootState } from 'store/store'
import CoreLayout from './CoreLayout/CoreLayout'
import Spinner from '../Spinner/Spinner'
import RoomJoinPrompt from '../RoomJoinPrompt/RoomJoinPrompt'

// Inner component that can use hooks to check bootstrap state
const AppContent = () => {
  const { isBootstrapping, isLoggingOut, roomId, isGuest, userId } = useSelector((state: RootState) => state.user)
  const [targetRoomId, setTargetRoomId] = useState<number | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const enrollmentCheckDone = useRef(false)

  // Check for SSO enrollment redirect for unauthenticated users with roomId
  useEffect(() => {
    // Only run once after bootstrap completes
    if (isBootstrapping || enrollmentCheckDone.current) return

    const params = new URLSearchParams(window.location.search)
    const roomIdParam = params.get('roomId')

    // If user is not authenticated and has a roomId, check for SSO enrollment
    if (!userId && roomIdParam) {
      const targetId = parseInt(roomIdParam, 10)
      if (!isNaN(targetId)) {
        enrollmentCheckDone.current = true
        setIsRedirecting(true)

        // Clean up roomId param BEFORE redirect to prevent loop on return
        const cleanParams = new URLSearchParams(window.location.search)
        cleanParams.delete('roomId')
        const cleanUrl = cleanParams.toString()
          ? `${window.location.pathname}?${cleanParams}`
          : window.location.pathname
        window.history.replaceState({}, '', cleanUrl)

        // Redirect to join landing page for unauthenticated users with roomId
        // The join page handles SSO login initiation
        window.location.href = `${document.baseURI}join?roomId=${targetId}`
      }
    }
  }, [isBootstrapping, userId])

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

  if (isBootstrapping || isLoggingOut || isRedirecting) {
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
