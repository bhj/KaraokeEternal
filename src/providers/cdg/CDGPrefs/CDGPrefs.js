import PropTypes from 'prop-types'
import React from 'react'
import PathItem from './PathItem'
import FolderChooser from './FolderChooser'

export default class CDGPrefs extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
    setPrefs: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  state = {
    isChoosing: false,
  }

  updateEnabled = (e) => {
    this.props.setPrefs('provider.cdg', { enabled: e.target.checked })
  }

  addPath = (path) => {
    const { paths } = this.props.prefs

    // is path already configured?
    if (paths.includes(path)) {
      alert('Path is already in library')
      return
    }

    this.props.setPrefs('provider.cdg', { paths: [...paths, path] })
    this.setState({ isChoosing: false })
  }

  removePath = (path) => {
    const { paths } = this.props.prefs
    const idx = paths.indexOf(path)

    if (idx === -1) {
      alert('Path not in library; nothing to do')
      return
    }

    this.props.setPrefs('provider.cdg', { paths: paths.filter(p => p !== path) })
  }

  handleRefresh = () => {
    this.props.requestScan('cdg')
  }

  handleOpenChooser = () => { this.setState({ isChoosing: true }) }
  handleCloseChooser = () => { this.setState({ isChoosing: false }) }

  render () {
    const { prefs } = this.props
    if (!prefs) return null

    return (
      <div style={{ overflow: 'hidden' }}>
        <label>
          <input type='checkbox' checked={prefs.enabled} onChange={this.updateEnabled} />
          <strong> CD+Graphics (.cdg + audio)</strong>
        </label>

        <br />
        <button onClick={this.handleOpenChooser}>Add Folder</button>
        <button onClick={this.handleRefresh}>Refresh</button>

        {prefs.paths.map((path, i) =>
          <PathItem key={i} path={path} onRemoveClick={() => this.removePath(path)} isRemovable />
        )}

        <br />
        <br />
        <br />
        <FolderChooser
          isVisible={this.state.isChoosing}
          onClosed={this.handleCloseChooser}
          onChoose={this.addPath}
        />
      </div>
    )
  }
}
