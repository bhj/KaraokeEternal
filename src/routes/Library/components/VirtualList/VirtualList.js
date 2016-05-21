import React, { PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import styles from 'react-virtualized/styles.css'

class VirtualList extends React.Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
    rowHeight: PropTypes.number.isRequired,
    rowComponent: PropTypes.func.isRequired,
    onItemClick: PropTypes.func.isRequired
  }

  // ItemClickHandler(i){
  // 	this.list[i] = this.list[i] + 1;
  //   console.log("force update of list item!");
  //   this.refs.VirtualScroll.forceUpdate();
  // },

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

  _rowRenderer ({ index }) {
    let item = this.props.items[index]
    item.onItemClick = this.props.onItemClick

    return React.createElement(this.props.rowComponent, item)
  }
}

export default VirtualList
