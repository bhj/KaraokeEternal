import React, { PropTypes } from 'react'
import { List } from 'react-virtualized'

class PaddedList extends React.Component {
  static propTypes = {
    rowRenderer: PropTypes.func.isRequired,
    rowCount: PropTypes.number.isRequired,
    rowHeight: PropTypes.func.isRequired,
    onScroll: PropTypes.func.isRequired,
    onRef: PropTypes.func.isRequired,
    scrollTop: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    paddingTop: PropTypes.number.isRequired,
    paddingBottom: PropTypes.number.isRequired,
  }

  rowRenderer = this.rowRenderer.bind(this)
  rowHeight = this.rowHeight.bind(this)

  render () {
    return (
      <List
        {...this.props}
        width={this.props.width}
        height={this.props.height}
        rowCount={this.props.rowCount + 2} // top & bottom spacer
        overscanRowCount={10}
        onScroll={this.props.onScroll}
        scrollTop={this.props.scrollTop} // initial list pos
        ref={r => {this.props.onRef(r); this.ref = r}}
        // facades
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
      />
    )
  }

  componentDidUpdate(prevProps) {
    if (this.props.paddingTop !== prevProps.paddingTop ||
      this.props.paddingBottom !== prevProps.paddingBottom) {
      this.ref.recomputeRowHeights()
    }
  }

  rowRenderer({index, key, style}) {
    // top & bottom spacer
    if (index === 0 || index === this.props.rowCount+1) {
      return (
        <div key={key} style={style}/>
      )
    } else {
      index--
    }

    return this.props.rowRenderer({ index, key, style })
  }

  rowHeight({ index }) {
    // top & bottom spacer
    if (index === 0) {
      return this.props.paddingTop
    } else if (index === this.props.rowCount+1){
      return this.props.paddingBottom
    } else {
      index--
    }

    return this.props.rowHeight({ index })
  }
}

export default PaddedList
