import React from 'react'
import { List, type RowComponentProps, type ListImperativeAPI } from 'react-window'
import styles from './PaddedList.css'

interface PaddedListProps {
  defaultScrollOffset?: number
  numRows: number
  onRef?(ref: ListImperativeAPI | null): void
  onScroll?: React.UIEventHandler<HTMLDivElement>
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
  defaultScrollOffset,
  numRows,
  onRef,
  onScroll,
  paddingTop,
  paddingRight,
  paddingBottom,
  rowComponent: RowComponent,
  rowHeight,
  rowProps = {},
  width,
  height,
}: PaddedListProps) => {
  const handleListRef = (ref: ListImperativeAPI | null) => {
    if (onRef) onRef(ref)
  }

  const PaddedRowComponent = ({ index, style, ariaAttributes, ...rest }: RowComponentProps) => {
    // top & bottom spacer
    if (index === 0 || index === numRows + 1) {
      return (
        <div key={index === 0 ? 'top' : 'bottom'} style={style} />
      )
    }

    return <RowComponent index={--index} style={{ ...style, paddingRight }} ariaAttributes={ariaAttributes} {...rest} />
  }

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
      defaultScrollOffset={defaultScrollOffset}
      onScroll={onScroll}
      overscanCount={10}
      listRef={handleListRef}
      className={styles.container}
      style={{ width, height }}
    />
  )
}

export default PaddedList
