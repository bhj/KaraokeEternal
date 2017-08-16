import PropTypes from 'prop-types'
import React from 'react'
import PathItem from './PathItem'
import PathChooser from './PathChooser'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('/api/provider/file')

export default class FilePrefs extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
    style: PropTypes.object.isRequired,
    fetchProviders: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  state = {
    isChoosing: false,
  }

  handleAddPath = (dir) => {
    api('POST', `/path/?dir=${encodeURIComponent(dir)}`)
      .then(() => {
        // success; update data and close chooser
        this.props.fetchProviders()
        this.setState({ isChoosing: false })
      })
      .catch(err => {
        alert(err)
      })
  }

  handleRemovePath = (index) => {
    const { paths } = this.props.prefs

    if (!confirm(`Remove this folder from the library?\n\n${paths[index]}`)) {
      return
    }

    api('DELETE', `/path/${index}`)
      .then(() => {
        // success; update data and close chooser
        this.props.fetchProviders()
        this.setState({ isChoosing: false })
      })
      .catch(err => {
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
    this.props.requestScan('file')
  }

  render () {
    const { paths } = this.props.prefs

    return (
      <div style={this.props.style}>
        {paths.length === 0 &&
          <p style={{ marginTop: 0 }}>No folders configured.</p>
        }

        {paths.map((path, index) =>
          <PathItem
            key={index}
            path={path}
            onRemoveClick={() => this.handleRemovePath(index)}
            isRemovable
          />
        )}

        <div style={{ display: 'flex' }}>
          <button style={{ flex: 1, width: 'auto' }} onClick={this.handleOpenChooser}>Add Folder</button>
          {paths.length > 0 &&
            <button style={{ marginLeft: '.5em', width: 'auto' }} onClick={this.handleRefresh}>Refresh</button>
          }
        </div>

        <PathChooser
          isVisible={this.state.isChoosing}
          onCancel={this.handleCloseChooser}
          onChoose={this.handleAddPath}
        />
      </div>
    )
  }
}
