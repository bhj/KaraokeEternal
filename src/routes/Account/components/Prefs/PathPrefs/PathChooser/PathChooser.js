import PropTypes from 'prop-types'
import React from 'react'
import PathItem from './PathItem'
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

  api = new HttpApi('prefs/path')
  list = React.createRef()

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

    if (this.state.current !== prevState.current) {
      this.list.current.scrollTop = 0
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
          height: '85%',
          top: '5%',
          left: '5%',
          margin: 0,
          paddingBottom: 0,
        }}
      >
        <div style={{ height: '85%', display: 'flex', flexDirection: 'column' }}>
          <div styleName='current'>
            {this.state.current || '\u00a0'}
          </div>

          <div style={{ flex: '1', marginBottom: '1em', overflow: 'scroll' }} ref={this.list}>
            {this.state.parent !== false &&
              <strong><PathItem path={'..'} onSelect={() => this.getListing(this.state.parent)} /></strong>
            }

            {this.state.children.map((item, i) =>
              <PathItem key={i} path={item.label} onSelect={() => this.getListing(item.path)} />
            )}
          </div>

          <div style={{ display: 'flex' }}>
            <button styleName='submit' className='primary' onClick={() => this.props.onChoose(this.state.current)}>
                Add Folder
            </button>
            <button styleName='cancel' onClick={this.props.onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </SkyLightStateless>
    )
  }
}
