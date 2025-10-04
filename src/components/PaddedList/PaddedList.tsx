import React, { CSSProperties, useCallback } from 'react'
import { List, type RowComponentProps, type ListImperativeAPI } from 'react-window'
import styles from './PaddedList.css'

const fakeRowProps = {}

interface PaddedListProps {
  numRows: number
  onRowsRendered?: (visibleRows: {
    startIndex: number
    stopIndex: number
  }, allRows: {
      startIndex: number
      stopIndex: number
    }) => void
  onRef?(ref: ListImperativeAPI | null): void
  paddingTop: number
  paddingRight?: number
  paddingBottom: number
  rowRenderer(props: { index: number, style: CSSProperties }): React.ReactNode
  // rowComponent: RowComponentProps
  rowHeight(index: number): number
  width?: number
  height: number
}

const PaddedList = ({
  numRows,
  onRowsRendered,
  onRef,
  paddingTop,
  paddingRight,
  paddingBottom,
  rowRenderer,
  rowHeight,
  width,
  height,
}: PaddedListProps) => {
  const handleListRef = useCallback((ref: ListImperativeAPI | null) => {
    if (onRef) onRef(ref)
  }, [onRef])

  const RowComponent = useCallback(({ index, style }: RowComponentProps) => {
    // top & bottom spacer
    if (index === 0 || index === numRows + 1) {
      return (
        <div key={index === 0 ? 'top' : 'bottom'} style={style} />
      )
    }

    return rowRenderer({
      index: --index,
      style: { ...style, paddingRight },
    })
  }, [numRows, rowRenderer, paddingRight])

  const getRowHeight = (index: number) => {
    // top & bottom spacer
    if (index === 0) return paddingTop
    if (index === numRows + 1) return paddingBottom

    return rowHeight(index - 1)
  }

  return (
    <List
      rowProps={fakeRowProps} // todo
      rowComponent={RowComponent}
      rowCount={numRows + 2} // top & bottom spacer
      rowHeight={getRowHeight}
      onRowsRendered={onRowsRendered}
      overscanCount={10}
      listRef={handleListRef}
      className={styles.container}
      style={{ width, height }}
    />
  )
}

export default PaddedList
