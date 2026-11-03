import React, { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { fetchRooms } from 'store/modules/rooms'
import { createAccount, login } from 'store/modules/user'
import Logo from 'components/Logo/Logo'
import SelectRoom from './SelectRoom/SelectRoom'
import InputRadio from 'components/InputRadio/InputRadio'
import Create from './Create/Create'
import SignIn from './SignIn/SignIn'
import styles from './SignedOutView.css'

const SignedOutView = () => {
  const userSectionRef = useRef<HTMLDivElement | null>(null)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  const scrollOnFocusRef = useRef(false)

  const prefs = useAppSelector(state => state.prefs)
  const rooms = useAppSelector(state => state.rooms)
  const ui = useAppSelector(state => state.ui)
  const dispatch = useAppDispatch()

  const [mode, setMode] = useState('returning')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [roomId, setRoomId] = useState<number | null>(null)
  const [roomPassword, setRoomPassword] = useState('')
  const [showRoomSection, setShowRoomSection] = useState(false)
  const [showAllRooms, setShowAllRooms] = useState(true)
  const [prevRooms, setPrevRooms] = useState<typeof rooms | null>(null)
  const [focusRequest, setFocusRequest] = useState(0)
  const [isRoomsLoading, setIsRoomsLoading] = useState(true)

  // once per mount
  useEffect(() => {
    const load = async () => {
      await dispatch(fetchRooms())
      setIsRoomsLoading(false)
    }

    load()
  }, [dispatch])

  // room selection visibility/defaults
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (rooms !== prevRooms) {
    setPrevRooms(rooms)
    const searchParams = new URLSearchParams(location.search)
    const roomIdParam = searchParams.get('roomId')
    const id = roomIdParam ? parseInt(roomIdParam, 10) : null
    const password = searchParams.get('password')

    if (id && rooms.entities[id]) {
      setRoomId(id)
      setShowAllRooms(false)

      if (rooms.entities[id]?.hasPassword) {
        if (password) {
          setRoomPassword(atob(password))
          setShowRoomSection(false)
          setFocusRequest(r => r + 1)
        } else {
          setShowRoomSection(true)
        }
      } else {
        setFocusRequest(r => r + 1)
      }
    } else if (rooms.result.length === 1) {
      setRoomId(rooms.result[0])
      setShowRoomSection(rooms.entities[rooms.result[0]]?.hasPassword)
    } else {
      setShowRoomSection(rooms.result.length !== 0)
    }
  }

  const handleRoomSelect = (id: number) => {
    setRoomId(id)
    setMode('returning')

    if (!rooms.entities[id]?.hasPassword || !showRoomSection) {
      scrollOnFocusRef.current = true
      setFocusRequest(r => r + 1)
    }
  }

  const handleFirstFieldRef = (el: HTMLInputElement | null) => {
    if (el) firstFieldRef.current = el
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    dispatch(login({
      username: username.trim(),
      password: password,
      roomId,
      roomPassword,
    }))
  }

  const handleCreate = ({ name, image, passwordConfirm }: { name: string, image: Blob | undefined, passwordConfirm: string }) => {
    const data = new FormData()

    data.append('username', username.trim())
    data.append('newPassword', password)
    data.append('newPasswordConfirm', passwordConfirm)
    data.append('roomId', String(roomId))
    data.append('roomPassword', roomPassword)
    data.append('name', name.trim())

    if (typeof image !== 'undefined') {
      data.append('image', image)
    }

    if (mode !== 'returning') {
      data.append('role', mode)
    }

    dispatch(createAccount(data))
  }

  const getAllowed = (roleName: string) => {
    const roleId = prefs.roles.result.find(id => prefs.roles.entities[id].name === roleName)
    return !!rooms.entities[roomId]?.prefs?.roles?.[roleId]?.allowNew
  }

  const allowNewGuest = getAllowed('guest')
  const allowNewStandard = getAllowed('standard')
  const allowNew = allowNewStandard || allowNewGuest

  // allowNew depends on both rooms and roles, so wait for them to avoid swapping headings
  const isReady = !isRoomsLoading && prefs.roles.result.length > 0

  useEffect(() => {
    const scroll = scrollOnFocusRef.current
    scrollOnFocusRef.current = false

    // focus synchronously so iOS shows the keyboard (requires a user gesture)
    firstFieldRef.current?.focus({ preventScroll: scroll })
    if (!scroll) return

    const scrollToUserSection = () => {
      userSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // WebKit cancels smooth scrolls during the first rendering update after a text field
    // is focused, so wait until that frame has rendered before starting the scroll
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(scrollToUserSection)
    })

    // iOS also cancels it when the on-screen keyboard opens and reveals the field,
    // so scroll again as the viewport resizes for the keyboard (ignoring unrelated resizes later)
    const focusedAt = performance.now()

    const handleViewportResize = () => {
      if (performance.now() - focusedAt < 1000) scrollToUserSection()
    }

    window.visualViewport?.addEventListener('resize', handleViewportResize)

    return () => {
      cancelAnimationFrame(raf)
      window.visualViewport?.removeEventListener('resize', handleViewportResize)
    }
  }, [focusRequest, mode, isReady])

  return (
    <div className={styles.container} style={{ maxWidth: Math.max(340, ui.contentWidth * 0.66) }}>
      <Logo className={styles.logo} />

      {showRoomSection && (
        <>
          <h1>Join room...</h1>
          <SelectRoom
            rooms={rooms}
            roomId={roomId}
            roomPassword={roomPassword}
            showAllRooms={showAllRooms}
            onRoomSelect={handleRoomSelect}
            onRoomPasswordChange={setRoomPassword}
          />
        </>
      )}

      <div ref={userSectionRef} className={clsx((!isReady || (rooms.result.length > 1 && roomId === null)) && styles.hidden)}>
        {allowNew
          ? (
              <>
                <h1>Join as...</h1>
                <div className={styles.radioContainer}>
                  <InputRadio name='type' value='returning' checked={mode === 'returning'} onChange={setMode} label='Returning user' />
                  {allowNewStandard && <InputRadio name='type' value='standard' checked={mode === 'standard'} onChange={setMode} label='New user' />}
                  {allowNewGuest && <InputRadio name='type' value='guest' checked={mode === 'guest'} onChange={setMode} label='Guest' />}
                </div>
              </>
            )
          : <h1>Sign in</h1>}

        {(mode === 'returning' || !allowNew) && (
          <SignIn
            username={username}
            password={password}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
            onFirstFieldRef={handleFirstFieldRef}
          />
        )}

        {mode !== 'returning' && allowNew && (
          <Create
            guest={mode === 'guest'}
            username={username}
            password={password}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={handleCreate}
            onFirstFieldRef={handleFirstFieldRef}
          />
        )}
      </div>
    </div>
  )
}

export default SignedOutView
