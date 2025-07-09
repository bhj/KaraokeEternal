import React from 'react'
import { VariableSizeList as List, ListOnScrollProps } from 'react-window'
import styles from './PaddedList.css'

interface PaddedListProps {
  numRows: number
  onScroll?(props: ListOnScrollProps): void
  onRef?(ref: List): void
  paddingTop: number
  paddingRight?: number
  paddingBottom: number
  rowRenderer(props: { index: number, style: object }): React.ReactNode
  rowHeight(index: number): number
  width: number
  height: number
}

class PaddedList extends React.Component<PaddedListProps> {
  list: List | null = null

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
      style: { ...style, paddingRight: this.props.paddingRight },
    })
  }

  getItemSize = (index: number) => {
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

  setRef = (ref: List) => {
    this.list = ref
  }
}

export default PaddedList
