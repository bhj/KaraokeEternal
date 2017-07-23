import PropTypes from 'prop-types'
import React from 'react'
import PathItem from './PathItem'
import PathChooser from './PathChooser'

export default class Paths extends React.Component {
  static propTypes = {
    paths: PropTypes.object.isRequired,
    addPath: PropTypes.func.isRequired,
    removePath: PropTypes.func.isRequired,
    openPathChooser: PropTypes.func.isRequired,
    closePathChooser: PropTypes.func.isRequired,
    isChoosing: PropTypes.bool.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  handleRemove = (pathId) => {
    const path = this.props.paths.entities[pathId].path

    if (confirm(`Remove this folder from the library?\n\n${path}`)) {
      this.props.removePath(pathId)
    }
  }

  handleRefresh = () => {
    this.props.requestScan('')
  }

  render () {
    const { paths } = this.props

    return (
      <div style={{ overflow: 'hidden' }}>
        {paths.result.length === 0 &&
          <p style={{ marginTop: 0 }}>No folders configured.</p>
        }

        {paths.result.map(pathId =>
          <PathItem
            key={pathId}
            path={paths.entities[pathId].path}
            onRemoveClick={() => this.handleRemove(pathId)}
            isRemovable
          />
        )}

        <div style={{ display: 'flex' }}>
          <button style={{ flex: 1, width: 'auto' }} onClick={this.props.openPathChooser}>Add Folder</button>
          {paths.result.length > 0 &&
            <button style={{ marginLeft: '.5em', width: 'auto' }} onClick={this.handleRefresh}>Refresh</button>
          }
        </div>

        <PathChooser
          isVisible={this.props.isChoosing}
          onClosed={this.props.closePathChooser}
          onChoose={this.props.addPath}
        />
      </div>
    )
  }
}
