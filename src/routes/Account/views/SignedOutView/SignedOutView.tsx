import React, { useCallback, useEffect, useRef, useState } from 'react'
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

  // once per mount
  useEffect(() => {
    dispatch(fetchRooms())
  }, [dispatch])

  // room selection visibility/defaults
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const roomIdParam = searchParams.get('roomId')
    const id = roomIdParam ? parseInt(roomIdParam, 10) : null
    const password = searchParams.get('password')

    if (id && rooms.entities[id]) {
      setRoomId(id)
      setShowAllRooms(false)
      userSectionRef.current.classList.remove(styles.hidden)

      if (rooms.entities[id]?.hasPassword) {
        if (password) {
          setRoomPassword(atob(password))
          setShowRoomSection(false)
          firstFieldRef.current?.focus()
        } else {
          setShowRoomSection(true)
        }
      } else {
        firstFieldRef.current?.focus()
      }
    } else if (rooms.result.length === 1) {
      setRoomId(rooms.result[0])
      setShowRoomSection(rooms.entities[rooms.result[0]]?.hasPassword)
    } else {
      setShowRoomSection(rooms.result.length !== 0)
    }
  }, [rooms])

  const handleRoomSelect = useCallback((id: number) => {
    setRoomId(id)
    setMode('returning')
    userSectionRef.current.classList.remove(styles.hidden)

    if (!rooms.entities[id]?.hasPassword || !showRoomSection) {
      firstFieldRef.current?.focus()
      userSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [rooms.entities, showRoomSection])

  const handleFirstFieldRef = useCallback((el: HTMLInputElement | null) => {
    if (el) firstFieldRef.current = el
  }, [])

  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    dispatch(login({
      username: username.trim(),
      password: password,
      roomId,
      roomPassword,
    }))
  }, [dispatch, password, roomId, roomPassword, username])

  const handleCreate = useCallback(({ name, image, passwordConfirm }: { name: string, image: Blob | undefined, passwordConfirm: string }) => {
    const data = new FormData()

    data.append('username', username.trim())
    data.append('newPassword', password)
    data.append('newPasswordConfirm', passwordConfirm)
    data.append('roomId', String(roomId))
    data.append('roomPassword', password)
    data.append('name', name.trim())

    if (typeof image !== 'undefined') {
      data.append('image', image)
    }

    if (mode !== 'returning') {
      data.append('role', mode)
    }

    dispatch(createAccount(data))
  }, [dispatch, mode, password, roomId, username])

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [mode])

  const getAllowed = useCallback((roleName: string) => {
    const roleId = prefs.roles.result.find(id => prefs.roles.entities[id].name === roleName)
    return !!rooms.entities[roomId]?.prefs?.roles?.[roleId]?.allowNew
  }, [prefs.roles, rooms.entities, roomId])

  const allowNewGuest = getAllowed('guest')
  const allowNewStandard = getAllowed('standard')
  const allowNew = allowNewStandard || allowNewGuest

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

      <div ref={userSectionRef} className={clsx(rooms.result.length > 1 && styles.hidden)}>
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
