import React, { useEffect, useRef, useState } from 'react'
import UserImage from './UserImage/UserImage'
import { User } from 'shared/types'
import styles from './AccountForm.css'

interface AccountFormProps {
  children?: React.ReactNode
  onDirtyChange?(...args: unknown[]): unknown
  onSubmit(...args: unknown[]): unknown
  requirePassword?: boolean
  showRole?: boolean
  user?: User
}

const AccountForm = ({ children, onDirtyChange, onSubmit, showRole, user }: AccountFormProps) => {
  const username = useRef<HTMLInputElement>(null)
  const newPassword = useRef<HTMLInputElement>(null)
  const newPasswordConfirm = useRef<HTMLInputElement>(null)
  const name = useRef<HTMLInputElement>(null)
  const role = useRef<HTMLSelectElement>(null)

  const [state, setState] = useState({
    isDirty: false,
    isChangingPassword: !user || user.userId === null,
    userImage: undefined as Blob | undefined,
  })

  const isUser = user && user.userId !== null

  useEffect(() => {
    if (user && prevUser.current?.dateUpdated !== user.dateUpdated) {
      setState(prev => ({ ...prev, isDirty: false }))
    }
  }, [user])

  const prevUser = useRef<User | undefined>(undefined)
  const prevIsDirty = useRef(state.isDirty)

  useEffect(() => {
    prevUser.current = user

    if (onDirtyChange && prevIsDirty.current !== state.isDirty) {
      onDirtyChange(state.isDirty)
    }

    prevIsDirty.current = state.isDirty
  }, [user, state.isDirty, onDirtyChange])

  const updateDirty = () => {
    if (!user || user.userId === null) return

    setState(prev => ({
      ...prev,
      isDirty: !!username.current?.value || !!newPassword.current?.value
        || (name.current?.value !== user.name)
        || (role.current && role.current.value !== (user.isAdmin ? '1' : '0')),
      isChangingPassword: !!newPassword.current?.value,
    }))
  }

  const handleUserImageChange = (blob: Blob) => {
    setState(prev => ({
      ...prev,
      userImage: blob,
      isDirty: true,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = new FormData()

    if (name.current?.value.trim()) {
      data.append('name', name.current.value.trim())
    }

    if (username.current?.value.trim()) {
      data.append('username', username.current.value.trim())
    }

    if (state.isChangingPassword) {
      data.append('newPassword', newPassword.current?.value || '')
      data.append('newPasswordConfirm', newPasswordConfirm.current?.value || '')
    }

    if (typeof state.userImage !== 'undefined') {
      data.append('image', state.userImage)
    }

    if (role.current) {
      data.append('role', role.current.value)
    }

    onSubmit(data)
  }

  return (
    <form
      className={styles.container}
      key={user?.dateUpdated}
      noValidate
      onSubmit={handleSubmit}
    >
      <input
        type='email'
        autoComplete='off'
        onChange={updateDirty}
        placeholder={isUser ? 'change username (optional)' : 'username or email'}
        // https://github.com/facebook/react/issues/23301
        ref={(r) => {
          if (r) username.current = r
          if (!isUser) r?.setAttribute('autofocus', 'true')
        }}
      />

      <input
        type='password'
        autoComplete='new-password'
        onChange={updateDirty}
        placeholder={isUser ? 'change password (optional)' : 'password'}
        ref={newPassword}
      />

      {state.isChangingPassword && (
        <input
          type='password'
          autoComplete='new-password'
          placeholder={isUser ? 'new password confirm' : 'confirm password'}
          ref={newPasswordConfirm}
        />
      )}

      <div className={styles.userDisplayContainer}>
        <UserImage
          user={user}
          onSelect={handleUserImageChange}
        />
        <input
          type='text'
          defaultValue={isUser ? user.name : ''}
          onChange={updateDirty}
          placeholder='display name'
          ref={name}
          className={styles.name}
        />
      </div>

      {showRole && (
        <select
          defaultValue={isUser && user.isAdmin ? '1' : '0'}
          onChange={updateDirty}
          ref={role}
        >
          <option key='choose' value='' disabled>select role...</option>
          <option key='std' value='0'>Standard</option>
          <option key='admin' value='1'>Administrator</option>
        </select>
      )}

      {children}
    </form>
  )
}

export default AccountForm
