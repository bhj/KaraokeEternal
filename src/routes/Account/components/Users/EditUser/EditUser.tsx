import React, { useCallback } from 'react'
import { useAppDispatch } from 'store/hooks'
import { createUser, removeUser, updateUser } from '../../../modules/users'
import Button from 'components/Button/Button'
import Modal from 'components/Modal/Modal'
import AccountForm from '../../AccountForm/AccountForm'
import { User } from 'shared/types'
import styles from './EditUser.css'

interface EditUserProps {
  user?: User
  onClose: () => void
}

const EditUser = (props: EditUserProps) => {
  const dispatch = useAppDispatch()
  const handleSubmit = useCallback((data: FormData) => {
    if (props.user) dispatch(updateUser({ userId: props.user.userId, data }))
    else dispatch(createUser(data))
  }, [dispatch, props.user])

  const handleRemoveClick = useCallback(() => {
    if (confirm(`Remove user "${props.user.username}"?\n\nTheir queued songs will also be removed.`)) {
      dispatch(removeUser(props.user.userId))
    }
  }, [dispatch, props.user])

  return (
    <Modal
      className={styles.modal}
      onClose={props.onClose}
      title={props.user ? props.user.username : 'Create User'}
    >
      <AccountForm user={props.user} onSubmit={handleSubmit} showRole>
        <div className={styles.btnContainer}>
          {!props.user && (
            <Button type='submit' className={styles.btn} variant='primary'>
              Create User
            </Button>
          )}

          {props.user && (
            <Button type='submit' className={styles.btn} variant='primary'>
              Update User
            </Button>
          )}

          {props.user && (
            <Button onClick={handleRemoveClick} className={styles.btn} variant='danger'>
              Remove User
            </Button>
          )}

          <Button onClick={props.onClose} variant='default'>
            Cancel
          </Button>
        </div>
      </AccountForm>
    </Modal>
  )
}

export default EditUser
