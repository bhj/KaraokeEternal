import React, { useEffect, useRef, useState } from 'react'
import InputImage from 'components/InputImage/InputImage'
import { UserWithRole } from 'shared/types'
import { useT } from 'i18n'
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
  const t = useT()
  const username = useRef<HTMLInputElement>(null)
  const newPassword = useRef<HTMLInputElement>(null)
  const newPasswordConfirm = useRef<HTMLInputElement>(null)
  const name = useRef<HTMLInputElement>(null)
  const role = useRef<HTMLSelectElement>(null)
  const [prevDateUpdated, setPrevDateUpdated] = useState(user?.dateUpdated)
  const [state, setState] = useState({
    isDirty: false,
    isChangingPassword: !user || user.userId === null,
    userImage: undefined as Blob | undefined,
  })

  const prevIsDirty = useRef(state.isDirty)

  if (user && user.dateUpdated !== prevDateUpdated) {
    setPrevDateUpdated(user.dateUpdated)
    setState(prev => ({ ...prev, isDirty: false }))
  }

  useEffect(() => {
    if (onDirtyChange && prevIsDirty.current !== state.isDirty) {
      onDirtyChange(state.isDirty)
    }

    prevIsDirty.current = state.isDirty
  }, [state.isDirty, onDirtyChange])

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
      {showUsername && (
        <input
          type='email'
          autoComplete='off'
          autoFocus={autoFocus}
          onChange={updateDirty}
          placeholder={user && user.userId !== null ? t('accountForm', 'changeUsername') : t('accountForm', 'usernameOrEmail')}
          // https://github.com/facebook/react/issues/23301
          ref={(r) => {
            if (r) username.current = r
            if (autoFocus) r?.setAttribute('autofocus', 'true')
          }}
        />
      )}

      {showPassword && (
        <input
          type='password'
          autoComplete='new-password'
          onChange={updateDirty}
          placeholder={user && user.userId !== null ? t('accountForm', 'changePassword') : t('accountForm', 'password')}
          ref={newPassword}
        />
      )}

      {state.isChangingPassword && (
        <input
          type='password'
          autoComplete='new-password'
          placeholder={user && user.userId !== null ? t('accountForm', 'newPasswordConfirm') : t('accountForm', 'confirmPassword')}
          ref={newPasswordConfirm}
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
          placeholder={t('accountForm', 'displayName')}
          ref={name}
        />
      </div>

      {showRole && (
        <select
          defaultValue={user?.role}
          onChange={updateDirty}
          ref={role}
        >
          <option key='choose' value='' disabled>{t('accountForm', 'selectRole')}</option>
          {user?.role === 'guest' && <option key='guest' value='guest'>{t('accountForm', 'roleGuest')}</option>}
          <option key='standard' value='standard'>{t('accountForm', 'roleStandard')}</option>
          <option key='admin' value='admin'>{t('accountForm', 'roleAdmin')}</option>
        </select>
      )}

      {children}
    </form>
  )
}

export default AccountForm
