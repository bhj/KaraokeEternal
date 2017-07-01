import PropTypes from 'prop-types'
import React from 'react'
import PathItem from '../PathItem'
import { SkyLightStateless } from 'react-skylight'
import './PathChooser.css'

export default class PathChooser extends React.Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    onChoose: PropTypes.func.isRequired,
    onClosed: PropTypes.func.isRequired,
  }

  state = {
    current: null,
    parent: null,
    children: [],
  }

  handleChooseFolder = () => {
    this.props.onChoose(this.state.current)
  }

  getListing = (dir) => {
    const url = '/api/prefs/ls?dir=' + encodeURIComponent(dir)

    fetch(url, fetchConfig)
      .then(checkStatus)
      .then(res => res.json())
      .then(res => this.setState(res))
      .catch((err) => {
        alert(err.message)
      })
  }

  componentDidMount () {
    // node's current working directory
    this.getListing('.')
  }

  render () {
    return (
      <SkyLightStateless
        isVisible={this.props.isVisible}
        onCloseClicked={this.props.onClosed}
        onOverlayClicked={this.props.onClosed}
        title='Add Folder'
        dialogStyles={{
          width: '90%',
          height: '90%',
          top: '5%',
          left: '5%',
          margin: 0,
        }}
      >
        <div style={{ height: '90%', display: 'flex', flexDirection: 'column' }}>
          <div styleName='current'>
            {this.state.current}
          </div>

          <div style={{ flex: '1', marginBottom: '1em', overflow: 'scroll', WebkitOverflowScrolling: 'touch' }}>
            {this.state.parent &&
              <strong><PathItem path={'..'} onSelect={() => this.getListing(this.state.parent)} /></strong>
            }

            {this.state.children.map((item, i) =>
              <PathItem key={i} path={item.displayPath} onSelect={() => this.getListing(item.path)} />
            )}
          </div>

          <div style={{ display: 'flex' }}>
            <button style={{ marginRight: '1em', width: 'auto' }} className='button' onClick={this.props.onClosed}>Cancel</button>
            <button style={{ flex: 1, width: 'auto' }} className='button' onClick={this.handleChooseFolder}>Add Folder</button>
          </div>
        </div>
      </SkyLightStateless>
    )
  }
}

// helpers for fetch response
const fetchConfig = {
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  // include the cookie that contains our JWT
  credentials: 'same-origin'
}

function checkStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    return response.text().then((txt) => {
      var error = new Error(txt)
      error.response = response
      throw error
    })
  }
}
