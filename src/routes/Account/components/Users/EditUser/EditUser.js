import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { createUser, removeUser, updateUser } from '../../../modules/users'
import Modal from 'components/Modal'
import AccountForm from '../../AccountForm'
import './EditUser.css'

const EditUser = props => {
  const [isDirty, setDirty] = useState(false)
  const formRef = useRef(null)
  const handleDirtyChange = useCallback(isDirty => setDirty(isDirty))

  // reset dirty flag when the editor "closes"
  useEffect(() => {
    if (props.isVisible === false) setDirty(false)
  }, [props.isVisible])

  const dispatch = useDispatch()
  const handleCreateClick = useCallback(() => {
    const data = formRef.current.getData()
    dispatch(createUser(data))
  }, [dispatch])

  const handleUpdateClick = useCallback(() => {
    const data = formRef.current.getData()
    dispatch(updateUser(props.user.userId, data))
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
      <AccountForm
        user={props.user}
        onDirtyChange={handleDirtyChange}
        ref={formRef}
        showRole
      />
      <br/>
      {!props.user &&
        <button onClick={handleCreateClick} className='primary' styleName='btn'>
          Create User
        </button>
      }

      {props.user && isDirty &&
        <button onClick={handleUpdateClick} className='primary' styleName='btn'>
          Update User
        </button>
      }

      {props.user &&
        <button onClick={handleRemoveClick} styleName='btn'>
          Remove User
        </button>
      }

      <button onClick={props.onClose}>Cancel</button>
    </Modal>
  )
}

EditUser.propTypes = {
  user: PropTypes.object,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default EditUser
