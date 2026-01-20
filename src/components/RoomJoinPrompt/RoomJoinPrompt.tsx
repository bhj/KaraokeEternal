import React from 'react'
import { useDispatch } from 'react-redux'
import Modal from 'components/Modal/Modal'
import Button from 'components/Button/Button'
import { joinRoom } from 'store/modules/rooms'
import { AppDispatch } from 'store/store'
import styles from './RoomJoinPrompt.css'

interface RoomJoinPromptProps {
  roomId: number
  onClose: () => void
}

const RoomJoinPrompt = ({ roomId, onClose }: RoomJoinPromptProps) => {
  const dispatch = useDispatch<AppDispatch>()

  const handleJoin = () => {
    dispatch(joinRoom(roomId))
  }

  const buttons = (
    <>
      <Button className={styles.btnCancel} onClick={onClose}>
        Cancel
      </Button>
      <Button className={styles.btnJoin} onClick={handleJoin}>
        Join Room
      </Button>
    </>
  )

  return (
    <Modal
      title="Join Room"
      onClose={onClose}
      buttons={buttons}
    >
      <p className={styles.message}>
        You&apos;ve been invited to join another room. Would you like to visit this room?
      </p>
      <p className={styles.note}>
        You can return to your own room at any time.
      </p>
    </Modal>
  )
}

export default RoomJoinPrompt
