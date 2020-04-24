import PropTypes from 'prop-types'
import React from 'react'
import PathChooser from './PathChooser'
import Icon from 'components/Icon'
import './PathPrefs.css'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('prefs/path')

export default class PathPrefs extends React.Component {
  static propTypes = {
    paths: PropTypes.object.isRequired,
    // actions
    receivePrefs: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  state = {
    isExpanded: false,
    isChoosing: false,
  }

  toggleExpanded (e, name) {
    this.setState({ isExpanded: !this.state.isExpanded })
  }

  handleAddPath = (dir) => {
    api('POST', `/?dir=${encodeURIComponent(dir)}`)
      .then(res => {
        this.props.receivePrefs(res)
        this.setState({ isChoosing: false })
      }).catch(err => {
        alert(err)
      })
  }

  handleRemovePath = (pathId) => {
    const { path } = this.props.paths.entities[pathId]

    if (!confirm(`Remove folder from library?\n\n${path}`)) {
      return
    }

    api('DELETE', `/${pathId}`)
      .then(res => {
        this.props.receivePrefs(res)
      }).catch(err => {
        alert(err)
      })
  }

  handleOpenChooser = () => {
    this.setState({ isChoosing: true })
  }

  handleCloseChooser = () => {
    this.setState({ isChoosing: false })
  }

  handleRefresh = () => {
    this.props.requestScan()
  }

  render () {
    const { paths } = this.props
    const { isExpanded } = this.state

    return (
      <div styleName='container'>
        <div styleName='heading' onClick={() => this.toggleExpanded()}>
          <Icon icon='FOLDER_MUSIC' size={28} styleName='icon' />
          <div styleName='title'>Media Folders</div>
          <div>
            <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} styleName='icon' />
          </div>
        </div>

        <div styleName='content' style={{ display: isExpanded ? 'block' : 'none' }}>
          {paths.result.length === 0 &&
            <p style={{ marginTop: 0 }}>Add a media folder to get started.</p>
          }

          {paths.result.map(id =>
            <div key={id} styleName='pathItem'>
              <div styleName='pathName'>
                {paths.entities[id].path}
              </div>
              <div onClick={() => this.handleRemovePath(id)} styleName='btnClear'>
                <Icon icon='CLEAR' size={32} />
              </div>
            </div>
          )}
          <br />
          <div style={{ display: 'flex' }}>
            <button className='primary' style={{ flex: 1, width: 'auto' }} onClick={this.handleOpenChooser}>
              Add Folder
            </button>
            {paths.result.length > 0 &&
              <button style={{ marginLeft: '.5em', width: 'auto' }} onClick={this.handleRefresh}>
                Refresh
              </button>
            }
          </div>

          <PathChooser
            isVisible={this.state.isChoosing}
            onCancel={this.handleCloseChooser}
            onChoose={this.handleAddPath}
          />
        </div>
      </div>
    )
  }
}
