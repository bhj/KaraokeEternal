import React, { useCallback } from 'react'
import { List, type RowComponentProps, type ListImperativeAPI } from 'react-window'
import styles from './PaddedList.css'

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
  rowComponent: React.ComponentType<RowComponentProps>
  rowHeight(index: number): number
  rowProps?: Partial<RowComponentProps> & Record<string, unknown>
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
  rowComponent: RowComponent,
  rowHeight,
  rowProps = {},
  width,
  height,
}: PaddedListProps) => {
  const handleListRef = useCallback((ref: ListImperativeAPI | null) => {
    if (onRef) onRef(ref)
  }, [onRef])

  const PaddedRowComponent = useCallback(({ index, style, ariaAttributes, ...rest }: RowComponentProps) => {
    // top & bottom spacer
    if (index === 0 || index === numRows + 1) {
      return (
        <div key={index === 0 ? 'top' : 'bottom'} style={style} />
      )
    }

    return <RowComponent index={--index} style={{ ...style, paddingRight }} ariaAttributes={ariaAttributes} {...rest} />
  }, [numRows, RowComponent, paddingRight])

  const getRowHeight = (index: number) => {
    // top & bottom spacer
    if (index === 0) return paddingTop
    if (index === numRows + 1) return paddingBottom

    return rowHeight(index - 1)
  }

  return (
    <List
      rowProps={rowProps}
      rowComponent={PaddedRowComponent}
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
