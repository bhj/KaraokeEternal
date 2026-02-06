import React from 'react'
import { useAppDispatch } from 'store/hooks'
import { createUser, removeUser, updateUser } from '../../../modules/users'
import Button from 'components/Button/Button'
import Modal from 'components/Modal/Modal'
import AccountForm from '../../AccountForm/AccountForm'
import { UserWithRole } from 'shared/types'
import styles from './EditUser.css'

interface EditUserProps {
  user?: UserWithRole
  onClose: () => void
}

const EditUser = ({ user, onClose }: EditUserProps) => {
  const dispatch = useAppDispatch()
  const handleSubmit = (data: FormData) => {
    if (user) dispatch(updateUser({ userId: user.userId, data }))
    else dispatch(createUser(data))
  }

  const handleRemoveClick = () => {
    if (confirm(`Remove user "${user.username}"?\n\nTheir queued songs will also be removed.`)) {
      dispatch(removeUser(user.userId))
    }
  }

  return (
    <Modal
      className={styles.modal}
      onClose={onClose}
      title={user ? user.username : 'Create User'}
    >
      <AccountForm user={user} onSubmit={handleSubmit} showRole autoFocus={!user}>
        <div className={styles.btnContainer}>
          {!user && (
            <Button type='submit' className={styles.btn} variant='primary'>
              Create User
            </Button>
          )}

          {user && (
            <Button type='submit' className={styles.btn} variant='primary'>
              Update User
            </Button>
          )}

          {user && (
            <Button onClick={handleRemoveClick} className={styles.btn} variant='danger'>
              Remove User
            </Button>
          )}

          <Button onClick={onClose} variant='default'>
            Cancel
          </Button>
        </div>
      </AccountForm>
    </Modal>
  )
}

export default EditUser
