import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { createRoom, updateRoom, removeRoom } from 'store/modules/rooms'
import Modal from 'components/Modal'
import './EditRoom.css'

let isPasswordDirty = false

const EditRoom = props => {
  const checkbox = useRef(null)
  const nameInput = useRef(null)
  const passwordInput = useRef(null)

  const dispatch = useDispatch()
  const handleCreateClick = useCallback(() => {
    dispatch(createRoom({
      name: nameInput.current.value,
      password: passwordInput.current.value,
      status: checkbox.current.checked ? 'open' : 'closed',
    }))
  }, [dispatch])

  const handleUpdateClick = useCallback(() => {
    dispatch(updateRoom(props.room.roomId, {
      name: nameInput.current.value,
      password: isPasswordDirty ? passwordInput.current.value : undefined,
      status: checkbox.current.checked ? 'open' : 'closed',
    }))
  }, [dispatch, props.room, isPasswordDirty])

  const handleRemoveClick = useCallback(() => {
    if (confirm(`Remove room "${props.room.name}" and its queue?`)) {
      dispatch(removeRoom(props.room.roomId))
    }
  }, [dispatch, props.room])

  const handleKeyPress = useCallback((e) => {
    if (e.charCode === 13) {
      props.room ? handleUpdateClick() : handleCreateClick()
    }
  }, [props.room])

  // reset dirty flag when the editor "closes"
  useEffect(() => {
    if (props.isVisible === false) isPasswordDirty = false
  }, [props.isVisible])

  return (
    <Modal
      isVisible={props.isVisible}
      onClose={props.onClose}
      title={props.room ? 'Edit Room' : 'Create Room'}
      style={{ minWidth: '300px' }}
    >
      <input type='text'
        autoComplete='off'
        autoFocus={typeof props.room === 'undefined'}
        defaultValue={props.room ? props.room.name : ''}
        onKeyPress={handleKeyPress}
        placeholder='room name'
        ref={nameInput}
        styleName='field'
      />

      <input type='password'
        autoComplete='off'
        defaultValue={props.room && props.room.hasPassword ? '*'.repeat(32) : ''}
        onChange={() => { isPasswordDirty = true }}
        onKeyPress={handleKeyPress}
        placeholder='room password (optional)'
        ref={passwordInput}
        styleName='field'
      />

      <label>
        <input type='checkbox'
          defaultChecked={!props.room || props.room.status === 'open'}
          ref={checkbox}
        /> Open
      </label>

      <br />
      <br />

      {!props.room &&
        <button onClick={handleCreateClick} className='primary' styleName='btn'>
          Create Room
        </button>
      }

      {props.room &&
        <button onClick={handleUpdateClick} className='primary' styleName='btn'>
          Update Room
        </button>
      }

      {props.room &&
        <button onClick={handleRemoveClick} styleName='btn'>
          Remove Room
        </button>
      }

      <button onClick={props.onClose}>Cancel</button>
    </Modal>
  )
}

EditRoom.propTypes = {
  room: PropTypes.object,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default EditRoom
