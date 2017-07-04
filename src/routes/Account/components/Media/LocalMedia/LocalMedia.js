import PropTypes from 'prop-types'
import React from 'react'
import PathItem from './PathItem'
import PathChooser from './PathChooser'

export default class Paths extends React.Component {
  static propTypes = {
    paths: PropTypes.array.isRequired,
    setPrefs: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  state = {
    isChoosing: false,
  }

  addPath = (path) => {
    const { paths } = this.props

    // is path already configured?
    if (paths.includes(path)) {
      alert('Path is already in library')
      return
    }

    this.props.setPrefs('app', { paths: [...paths, path] })
    this.setState({ isChoosing: false })
  }

  removePath = (path) => {
    const { paths } = this.props
    const idx = paths.indexOf(path)

    if (idx === -1) {
      // nothing to do
      return
    }

    if (confirm(`Remove this folder from the library?\n\n${path}`)) {
      this.props.setPrefs('app', { paths: paths.filter(p => p !== path) })
    }
  }

  handleRefresh = () => {
    this.props.requestScan('cdg')
  }

  handleOpenChooser = () => { this.setState({ isChoosing: true }) }
  handleCloseChooser = () => { this.setState({ isChoosing: false }) }

  render () {
    const { paths } = this.props

    return (
      <div style={{ overflow: 'hidden' }}>
        {paths.length === 0 &&
          <p style={{ marginTop: 0 }}>No folders configured.</p>
        }

        {paths.map((path, i) =>
          <PathItem key={i} path={path} onRemoveClick={() => this.removePath(path)} isRemovable />
        )}

        <div style={{ display: 'flex' }}>
          <button style={{ flex: 1, width: 'auto' }} onClick={this.handleOpenChooser}>Add Folder</button>
          {paths.length > 0 &&
            <button style={{ marginLeft: '.5em', width: 'auto' }} onClick={this.handleOpenChooser}>Refresh</button>
          }
        </div>

        <PathChooser
          isVisible={this.state.isChoosing}
          onClosed={this.handleCloseChooser}
          onChoose={this.addPath}
        />
      </div>
    )
  }
}
