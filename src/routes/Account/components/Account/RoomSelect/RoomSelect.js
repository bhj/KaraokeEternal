import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class RoomSelect extends Component {
  static propTypes = {
    rooms: PropTypes.object.isRequired,
    onSelectRef: PropTypes.func.isRequired,
    onPasswordRef: PropTypes.func.isRequired,
    className: PropTypes.string,
    // actions
    fetchRooms: PropTypes.func.isRequired,
  }

  state = {
    hasPassword: false,
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

  handleSelectChange = e => {
    const roomId = e.target.value
    const hasPassword = this.props.rooms.entities[roomId].hasPassword

    this.setState({ hasPassword }, () => {
      if (this.state.hasPassword) this.input.focus()
    })
  }

  handleInputRef = r => {
    this.input = r
    this.props.onPasswordRef(r)
  }

  handleSelectRef = r => {
    this.select = r
    this.props.onSelectRef(r)
  }

  render () {
    const roomOpts = this.props.rooms.result.map(roomId => {
      const room = this.props.rooms.entities[roomId]
      return <option key={roomId} value={roomId}>{room.name}</option>
    })

    roomOpts.unshift(<option key='choose' value='' disabled>select room...</option>)

    return (
      <>
        <select
          className={this.props.className}
          defaultValue=''
          onChange={this.handleSelectChange}
          ref={this.handleSelectRef}
        >
          {roomOpts}
        </select>

        {this.state.hasPassword &&
          <input type='password'
            autoComplete='off'
            className={this.props.className}
            placeholder='room password (required)'
            ref={this.handleInputRef}
          />
        }
      </>
    )
  }
}
