import React, { useState, useRef } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setFilterStr, resetFilterStr, toggleFilterStarred } from '../../modules/library'
import Button from 'components/Button/Button'
import styles from './LibraryHeader.css'

const LibraryHeader = () => {
  const dispatch = useAppDispatch()
  const { filterStr, filterStarred } = useAppSelector(state => state.library)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(filterStr)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
    dispatch(setFilterStr(event.target.value))
  }

  const clearSearch = () => {
    setValue('')
    dispatch(resetFilterStr())
  }

  const handleMagnifierClick = () => {
    if (value.trim()) clearSearch()
    else searchInputRef.current?.focus()
  }

  return (
    <div className={styles.container}>
      <Button
        className={clsx(styles.btnMagnifier, filterStr && styles.active)}
        icon='MAGNIFIER'
        onClick={handleMagnifierClick}
        aria-label={value.trim() ? 'Clear Search' : 'Search'}
      />
      <input
        type='search'
        className={styles.searchInput}
        placeholder='Search'
        value={value}
        onChange={handleChange}
        ref={searchInputRef}
      />
      {filterStr && (
        <Button
          icon='CLEAR'
          onClick={clearSearch}
          className={clsx(styles.btnClear, styles.active)}
          aria-label='Clear Search'
        />
      )}
      <Button
        className={clsx(styles.btnStar, filterStarred && styles.active)}
        icon='STAR_FULL'
        onClick={() => dispatch(toggleFilterStarred())}
        aria-label='Starred Only'
        aria-pressed={filterStarred}
      />
    </div>
  )
}

export default LibraryHeader
