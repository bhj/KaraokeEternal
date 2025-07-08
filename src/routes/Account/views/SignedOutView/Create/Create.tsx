import React, { useState } from 'react'
import Button from 'components/Button/Button'
import InputImage from 'components/InputImage/InputImage'
import styles from './Create.css'

interface CreateProps {
  guest: boolean
  username: string
  password: string
  onUsernameChange: (username: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: (params: { name: string, image: Blob | undefined, passwordConfirm: string }) => void
  onFirstFieldRef: (el: HTMLInputElement | null) => void
}

const Create = ({
  guest,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onFirstFieldRef,
}: CreateProps) => {
  const [name, setName] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [image, setImage] = useState<Blob | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, image, passwordConfirm })
  }

  return (
    <form
      className={styles.container}
      noValidate
      onSubmit={handleSubmit}
    >
      {!guest && (
        <>
          <input
            type='email'
            autoComplete='off'
            value={username}
            onChange={e => onUsernameChange(e.target.value)}
            placeholder='username or email'
            ref={onFirstFieldRef}
          />
          <input
            type='password'
            autoComplete='new-password'
            value={password}
            onChange={e => onPasswordChange(e.target.value)}
            placeholder='password'
          />
          <input
            type='password'
            autoComplete='new-password'
            placeholder='confirm password'
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
          />
        </>
      )}

      <div className={styles.userDisplayContainer}>
        <InputImage onSelect={setImage} />
        <input
          type='text'
          placeholder='display name'
          value={name}
          onChange={e => setName(e.target.value)}
          ref={guest ? onFirstFieldRef : undefined}
        />
      </div>

      <Button type='submit' variant='primary'>
        Join
      </Button>
    </form>
  )
}

export default Create
