import PropTypes from 'prop-types'
import React, { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AccountForm from '../../../components/AccountForm'
import RoomSelect from '../../../components/RoomSelect'
import { createAccount } from 'store/modules/user'
import './Create.css'

let roomSelectRef

const Create = props => {
  const user = useSelector(state => state.user)

  const formRef = useRef(null)
  const roomSelectRefCB = useCallback(node => { roomSelectRef = node }, [])

  const dispatch = useDispatch()
  const handleSubmit = useCallback(e => {
    e.preventDefault()
    const data = formRef.current.getData()

    if (!roomSelectRef.select.current.value) {
      alert('Please select a room')
      roomSelectRef.select.current.focus()
      return
    }

    data.append('roomId', roomSelectRef.select.current.value)

    if (roomSelectRef.password.current) {
      data.append('roomPassword', roomSelectRef.password.current.value)
    }

    dispatch(createAccount(data))
  }, [dispatch])

  return (
    <>
      <div styleName='heading'>
        <h2>Create Account</h2>
        <span><a onClick={props.onToggle}>Already have an account?</a></span>
      </div>

      <AccountForm user={user} onSubmitClick={handleSubmit} ref={formRef}>
        <RoomSelect ref={roomSelectRefCB}/>
        <button onClick={handleSubmit} className='primary'>
          Create Account
        </button>
      </AccountForm>
    </>
  )
}

Create.propTypes = {
  onToggle: PropTypes.func.isRequired,
}

export default Create
