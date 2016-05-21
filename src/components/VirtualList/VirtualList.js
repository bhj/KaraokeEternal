import React, { PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import styles from 'react-virtualized/styles.css'

class VirtualList extends React.Component {
  static propTypes = {
    rowCount: PropTypes.number.isRequired,
    rowHeight: PropTypes.number.isRequired,
    rowRenderer: PropTypes.func.isRequired
  }

  render () {
    return (
      <AutoSizer>
        {({ height, width }) => (
          <VirtualScroll
            width={width}
            height={height}
            rowCount={this.props.rowCount}
            rowHeight={this.props.rowHeight}
            rowRenderer={this.props.rowRenderer}
          />
        )}
      </AutoSizer>
    )
  }
}

export default VirtualList
