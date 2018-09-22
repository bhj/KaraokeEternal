import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class RoomSelect extends Component {
  static propTypes = {
    rooms: PropTypes.object.isRequired,
    onRef: PropTypes.func.isRequired,
    // actions
    fetchRooms: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchRooms()
  }

  componentDidUpdate (prevProps, prevState) {
    const { rooms } = this.props

    // if there's only one open room, select it by default
    if (rooms !== prevProps.rooms && rooms.result.length === 1) {
      this.select.value = rooms.result[0]
    }
  }

  handleRef = r => {
    this.select = r
    this.props.onRef(r)
  }

  render () {
    const roomOpts = this.props.rooms.result.map(roomId => {
      const room = this.props.rooms.entities[roomId]

      return (
        <option key={roomId} value={roomId}>{room.name}</option>
      )
    })

    roomOpts.unshift(<option key='choose' value='' selected disabled>select room...</option>)

    return (
      <select ref={this.handleRef}>
        {roomOpts}
      </select>
    )
  }
}
