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

interface PaddedRowProps {
  padNumRows: number
  padPaddingRight?: number
  padRowComponent: React.ComponentType<RowComponentProps>
  [key: string]: unknown
}

// module scope so its identity is stable across PaddedList renders; a changing
// rowComponent identity makes React remount every row (and reload row images)
const PaddedRowComponent = ({
  index,
  style,
  ariaAttributes,
  padNumRows,
  padPaddingRight,
  padRowComponent: RowComponent,
  ...rest
}: RowComponentProps<PaddedRowProps>) => {
  // top & bottom spacer
  if (index === 0 || index === padNumRows + 1) {
    return (
      <div style={style} />
    )
  }

  // inset the row itself (not just its content) so row backgrounds are contained too,
  // while the scroll container stays full-width so wheeling over the gutter still scrolls
  return (
    <RowComponent
      index={index - 1}
      style={{
        ...style,
        left: 'var(--content-gutter)',
        width: 'calc(100% - 2 * var(--content-gutter))',
        paddingRight: padPaddingRight,
      }}
      ariaAttributes={ariaAttributes}
      {...rest}
    />
  )
}

const PaddedList = ({
  defaultScrollOffset,
  numRows,
  onRef,
  onScroll,
  paddingTop,
  paddingRight,
  paddingBottom,
  rowComponent,
  rowHeight,
  rowProps = {},
  width,
  height,
}: PaddedListProps) => {
  const handleListRef = (ref: ListImperativeAPI | null) => {
    if (onRef) onRef(ref)
  }

  const getRowHeight = (index: number) => {
    // top & bottom spacer
    if (index === 0) return paddingTop
    if (index === numRows + 1) return paddingBottom

    return rowHeight(index - 1)
  }

  return (
    <List
      rowProps={{
        ...rowProps,
        padNumRows: numRows,
        padPaddingRight: paddingRight,
        padRowComponent: rowComponent,
      }}
      rowComponent={PaddedRowComponent}
      rowCount={numRows + 2} // top & bottom spacer
      rowHeight={getRowHeight}
      defaultScrollOffset={defaultScrollOffset}
      onScroll={onScroll}
      overscanCount={10}
      listRef={handleListRef}
      className={styles.container}
      // scrollToRow() aligns within scroll-padding, so rows land below the
      // header/footer that overlay the spacers regardless of their heights
      style={{ width, height, scrollPaddingTop: paddingTop, scrollPaddingBottom: paddingBottom }}
    />
  )
}

export default PaddedList
