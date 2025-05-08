import React, { useCallback, useEffect, useState } from 'react'
import { useAppDispatch } from 'store/hooks'
import { createUser, removeUser, updateUser } from '../../../modules/users'
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
  const handleSubmit = useCallback((data) => {
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
      onClose={props.onClose}
      title={props.user ? props.user.username : 'Create User'}
      // style={{ minWidth: '300px' }}
    >
      <AccountForm user={props.user} onSubmit={handleSubmit} showRole>
        <br />
        {!props.user && (
          <button className={`${styles.btn} primary`}>
            Create User
          </button>
        )}

        {props.user && (
          <button className={`${styles.btn} primary`}>
            Update User
          </button>
        )}
      </AccountForm>

      {props.user && (
        <button onClick={handleRemoveClick} className={styles.btn}>
          Remove User
        </button>
      )}

      <button onClick={props.onClose}>Cancel</button>
    </Modal>
  )
}

export default EditUser
