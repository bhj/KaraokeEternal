import PropTypes from 'prop-types'
import React from 'react'
import { List } from 'react-virtualized'

class PaddedList extends React.Component {
  static propTypes = {
    rowRenderer: PropTypes.func.isRequired,
    rowCount: PropTypes.number.isRequired,
    rowHeight: PropTypes.func.isRequired,
    onScroll: PropTypes.func,
    onRef: PropTypes.func,
    paddingTop: PropTypes.number.isRequired,
    paddingRight: PropTypes.number,
    paddingBottom: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }

  state = {
    scrollBarSize: 0,
  }

  componentDidMount () {
    if (this.props.onRef) {
      this.props.onRef(this.list)
    }
  }

  render () {
    return (
      <div style={{ width: this.props.width, overflow: 'hidden' }}>
        <List
          {...this.props}
          width={this.props.width + this.state.scrollBarSize} // clips scrollbar offscreen
          rowCount={this.props.rowCount + 2} // top & bottom spacer
          overscanRowCount={10}
          onScroll={this.props.onScroll}
          onScrollbarPresenceChange={this.handleScrollBar}
          ref={this.setRef}
          // facades
          rowHeight={this.rowHeight}
          rowRenderer={this.rowRenderer}
        />
      </div>
    )
  }

  componentDidUpdate (prevProps) {
    const { paddingTop, paddingBottom } = this.props
    if (paddingTop !== prevProps.paddingTop || paddingBottom !== prevProps.paddingBottom) {
      this.list.recomputeRowHeights()
    }
  }

  rowRenderer = ({ index, key, style }) => {
    // top & bottom spacer
    if (index === 0 || index === this.props.rowCount + 1) {
      return (
        <div key={key} style={style} />
      )
    }

    return this.props.rowRenderer({
      index: --index,
      key,
      style: { ...style, paddingRight: this.props.paddingRight }
    })
  }

  rowHeight = ({ index }) => {
    // top & bottom spacer
    if (index === 0) {
      return this.props.paddingTop
    } else if (index === this.props.rowCount + 1) {
      return this.props.paddingBottom
    } else {
      index--
    }

    return this.props.rowHeight({ index })
  }

  handleScrollBar = ({ size }) => {
    this.setState({ scrollBarSize: size })
  }

  setRef = (ref) => {
    this.list = ref
  }
}

export default PaddedList
