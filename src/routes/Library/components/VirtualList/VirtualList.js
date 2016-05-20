import React, { PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import styles from 'react-virtualized/styles.css'

class VirtualList extends React.Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
    rowHeight: PropTypes.number.isRequired,
    rowComponent: PropTypes.func.isRequired
  }

  _rowRenderer ({ index }) {
    let data = this.props.items[index]
    // let data = {name}
    return React.createElement(this.props.rowComponent, data)
  }

  render () {
    let items = this.props.items
    if (!items) return null

    return (
      <AutoSizer>
        {({ height, width }) => (
          <VirtualScroll
            width={width}
            height={height}
            rowCount={items.length}
            rowHeight={this.props.rowHeight}
            rowRenderer={(index) => this._rowRenderer(index)}
          />
        )}
      </AutoSizer>
    )
  }

}

export default VirtualList
