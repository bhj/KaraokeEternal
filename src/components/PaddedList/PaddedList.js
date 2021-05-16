import PropTypes from 'prop-types'
import React from 'react'
import { VariableSizeList as List } from 'react-window'
import styles from './PaddedList.css'

class PaddedList extends React.Component {
  static propTypes = {
    numRows: PropTypes.number.isRequired,
    onScroll: PropTypes.func,
    onRef: PropTypes.func,
    paddingTop: PropTypes.number.isRequired,
    paddingRight: PropTypes.number,
    paddingBottom: PropTypes.number.isRequired,
    rowRenderer: PropTypes.func.isRequired,
    rowHeight: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }

  componentDidMount () {
    if (this.props.onRef) {
      this.props.onRef(this.list)
    }
  }

  render () {
    return (
      <List
        itemCount={this.props.numRows + 2} // top & bottom spacer
        itemSize={this.getItemSize}
        onScroll={this.props.onScroll}
        overscanCount={10}
        ref={this.setRef}
        className={styles.container}
        width={this.props.width}
        height={this.props.height}
      >
        {this.rowRenderer}
      </List>
    )
  }

  componentDidUpdate (prevProps) {
    const { paddingTop, paddingBottom } = this.props
    if (paddingTop !== prevProps.paddingTop || paddingBottom !== prevProps.paddingBottom) {
      this.list.resetAfterIndex(0)
    }
  }

  rowRenderer = ({ index, style }) => {
    // top & bottom spacer
    if (index === 0 || index === this.props.numRows + 1) {
      return (
        <div key={index === 0 ? 'top' : 'bottom'} style={style} />
      )
    }

    return this.props.rowRenderer({
      index: --index,
      style: { ...style, paddingRight: this.props.paddingRight }
    })
  }

  getItemSize = index => {
    // top & bottom spacer
    if (index === 0) {
      return this.props.paddingTop
    } else if (index === this.props.numRows + 1) {
      return this.props.paddingBottom
    } else {
      index--
    }

    return this.props.rowHeight(index)
  }

  setRef = (ref) => {
    this.list = ref
  }
}

export default PaddedList
