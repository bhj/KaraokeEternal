import React, { useEffect, useRef, useState } from 'react'
import InputImage from 'components/InputImage/InputImage'
import { UserWithRole } from 'shared/types'
import styles from './AccountForm.css'

interface AccountFormProps {
  autoFocus?: boolean
  children?: React.ReactNode
  onDirtyChange?(isDirty: boolean): void
  onSubmit(formData: FormData): void
  showRole?: boolean
  showUsername?: boolean
  showPassword?: boolean
  user?: UserWithRole
}

const AccountForm = ({
  autoFocus,
  children,
  onDirtyChange,
  onSubmit,
  showRole,
  showUsername = true,
  showPassword = true,
  user,
}: AccountFormProps) => {
  const usernameRef = useRef<HTMLInputElement>(null)
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const newPasswordConfirmRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const roleRef = useRef<HTMLSelectElement>(null)
  const [prevDateUpdated, setPrevDateUpdated] = useState(user?.dateUpdated)
  const [state, setState] = useState({
    isDirty: false,
    isChangingPassword: !user || user.userId === null,
    userImage: undefined as Blob | undefined,
  })

  const prevIsDirtyRef = useRef(state.isDirty)

  if (user && user.dateUpdated !== prevDateUpdated) {
    setPrevDateUpdated(user.dateUpdated)
    setState(prev => ({ ...prev, isDirty: false }))
  }

  useEffect(() => {
    if (onDirtyChange && prevIsDirtyRef.current !== state.isDirty) {
      onDirtyChange(state.isDirty)
    }

    prevIsDirtyRef.current = state.isDirty
  }, [state.isDirty, onDirtyChange])

  const updateDirty = () => {
    if (!user || user.userId === null) return

    setState(prev => ({
      ...prev,
      isDirty: !!usernameRef.current?.value || !!newPasswordRef.current?.value
        || (nameRef.current?.value !== user.name)
        || (roleRef.current && roleRef.current.value !== (user.isAdmin ? '1' : '0')),
      isChangingPassword: !!newPasswordRef.current?.value,
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

    if (nameRef.current?.value.trim()) {
      data.append('name', nameRef.current.value.trim())
    }

    if (usernameRef.current?.value.trim()) {
      data.append('username', usernameRef.current.value.trim())
    }

    if (state.isChangingPassword) {
      data.append('newPassword', newPasswordRef.current?.value || '')
      data.append('newPasswordConfirm', newPasswordConfirmRef.current?.value || '')
    }

    if (typeof state.userImage !== 'undefined') {
      data.append('image', state.userImage)
    }

    if (roleRef.current) {
      data.append('role', roleRef.current.value)
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
      {showUsername && (
        <input
          type='email'
          autoComplete='off'
          autoFocus={autoFocus}
          onChange={updateDirty}
          placeholder={user && user.userId !== null ? 'change username (optional)' : 'username or email'}
          // https://github.com/facebook/react/issues/23301
          ref={(r) => {
            if (r) usernameRef.current = r
            if (autoFocus) r?.setAttribute('autofocus', 'true')
          }}
        />
      )}

      {showPassword && (
        <input
          type='password'
          autoComplete='new-password'
          onChange={updateDirty}
          placeholder={user && user.userId !== null ? 'change password (optional)' : 'password'}
          ref={newPasswordRef}
        />
      )}

      {state.isChangingPassword && (
        <input
          type='password'
          autoComplete='new-password'
          placeholder={user && user.userId !== null ? 'new password confirm' : 'confirm password'}
          ref={newPasswordConfirmRef}
        />
      )}

      <div className={styles.userDisplayContainer}>
        <InputImage
          user={user}
          onSelect={handleUserImageChange}
        />
        <input
          type='text'
          defaultValue={user?.name ?? ''}
          onChange={updateDirty}
          placeholder='display name'
          ref={nameRef}
        />
      </div>

      {showRole && (
        <select
          defaultValue={user?.role}
          onChange={updateDirty}
          ref={roleRef}
        >
          <option key='choose' value='' disabled>select role...</option>
          {user?.role === 'guest' && <option key='guest' value='guest'>Guest</option>}
          <option key='standard' value='standard'>Standard</option>
          <option key='admin' value='admin'>Administrator</option>
        </select>
      )}

      {children}
    </form>
  )
}

export default AccountForm
