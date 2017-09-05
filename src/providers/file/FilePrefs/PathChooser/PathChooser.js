import PropTypes from 'prop-types'
import React from 'react'
import PathItem from '../PathItem'
import { SkyLightStateless } from 'react-skylight'
import HttpApi from 'lib/HttpApi'
import './PathChooser.css'

export default class PathChooser extends React.Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    onChoose: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  }

  state = {
    current: null,
    parent: null,
    children: [],
  }

  api = new HttpApi('/api/provider/file')

  getListing = (dir) => {
    this.api('GET', `/ls?dir=${encodeURIComponent(dir)}`)
      .then(res => this.setState(res))
      .catch(err => {
        alert(err)
      })
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.isVisible && !prevProps.isVisible) {
      this.getListing(this.state.current || '.')
    }
  }

  render () {
    return (
      <SkyLightStateless
        isVisible={this.props.isVisible}
        onCloseClicked={this.props.onCancel}
        onOverlayClicked={this.props.onCancel}
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
            <button style={{ flex: 1, width: 'auto' }} onClick={() => this.props.onChoose(this.state.current)}>Add Folder</button>
            <button style={{ marginLeft: '1em', width: 'auto' }} onClick={this.props.onCancel}>Cancel</button>
          </div>
        </div>
      </SkyLightStateless>
    )
  }
}
