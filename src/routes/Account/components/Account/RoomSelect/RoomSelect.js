import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class RoomSelect extends Component {
  static propTypes = {
    rooms: PropTypes.object.isRequired,
    onRoomSelect: PropTypes.func.isRequired,
    // actions
    fetchRooms: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchRooms()
  }

  componentDidUpdate () {
    this.handleChange()
  }

  handleChange = () => this.props.onRoomSelect(parseInt(this.refs.room.value, 10))

  render () {
    let roomOpts = this.props.rooms.result.map(roomId => {
      const room = this.props.rooms.entities[roomId]

      return (
        <option key={roomId} value={roomId}>{room.name}</option>
      )
    })

    return (
      <div>
        <select ref='room' onChange={this.handleChange}>{roomOpts}</select>
      </div>
    )
  }
}
