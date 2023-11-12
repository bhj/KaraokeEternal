import React, { useCallback, useEffect, useState } from 'react'
import { useAppDispatch } from 'store/hooks'
import { createUser, removeUser, updateUser } from '../../../modules/users'
import Modal from 'components/Modal'
import AccountForm from '../../AccountForm'
import { User } from 'shared/types'
import styles from './EditUser.css'

interface EditUserProps {
  user?: User
  isVisible: boolean
  onClose(...args: unknown[]): unknown
}

const EditUser = (props: EditUserProps) => {
  const [isDirty, setDirty] = useState(false)
  const handleDirtyChange = useCallback(isDirty => setDirty(isDirty), [])

  // reset dirty flag when the editor "closes"
  useEffect(() => {
    if (props.isVisible === false) setDirty(false)
  }, [props.isVisible])

  const dispatch = useAppDispatch()
  const handleSubmit = useCallback(data => {
    props.user ? dispatch(updateUser(props.user.userId, data)) : dispatch(createUser(data))
  }, [dispatch, props.user])

  const handleRemoveClick = useCallback(() => {
    if (confirm(`Remove user "${props.user.username}"?\n\nTheir history of queued songs will also be removed.`)) {
      dispatch(removeUser(props.user.userId))
    }
  }, [dispatch, props.user])

  return (
    <Modal
      isVisible={props.isVisible}
      onClose={props.onClose}
      title={props.user ? props.user.username : 'Create User'}
      style={{ minWidth: '300px' }}
    >
      <AccountForm user={props.user} onDirtyChange={handleDirtyChange} onSubmit={handleSubmit} showRole>
        <br/>
        {!props.user &&
          <button className={`${styles.btn} primary`}>
            Create User
          </button>
        }

        {props.user && isDirty &&
          <button className={`${styles.btn} primary`}>
            Update User
          </button>
        }
      </AccountForm>

      {props.user &&
        <button onClick={handleRemoveClick} className={styles.btn}>
          Remove User
        </button>
      }

      <button onClick={props.onClose}>Cancel</button>
    </Modal>
  )
}

export default EditUser
