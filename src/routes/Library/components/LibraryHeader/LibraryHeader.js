import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import Icon from 'components/Icon'
import styles from './LibraryHeader.css'
import AddFromYouTube from '../AddFromYouTube'
import { connect } from 'react-redux'

const LibraryHeader = props => {
  const {
    filterStr,
    filterStarred,
    setFilterStr,
    resetFilterStr,
    toggleFilterStarred,
    isAddingFromYouTube,
    lastAddedFromYouTube,
  } = props

  const searchInput = React.createRef()
  const [value, setValue] = useState(filterStr)

  const handleChange = (event) => {
    setValue(event.target.value)
    setFilterStr(event.target.value)
  }

  const clearSearch = () => {
    setValue('')
    resetFilterStr()
  }

  const handleMagnifierClick = () => {
    value.trim() ? clearSearch() : searchInput.current.focus()
  }

  const filterStarredRef = useRef()
  const toggleFilterStarredRef = useRef()

  filterStarredRef.current = props.filterStarred
  toggleFilterStarredRef.current = props.toggleFilterStarred

  useEffect(() => {
    if (!isAddingFromYouTube && lastAddedFromYouTube) {
      if (searchInput.current) {
        searchInput.current.focus()
      }
      const tokens = lastAddedFromYouTube.title.split(/[\s-]+/)
      const words = []
      for (const token of tokens) {
        if (token.length <= 2) {
          continue
        }
        if (/karaoke/i.test(token)) {
          continue
        }
        words.push(token)
        if (words.length >= 2) {
          break
        }
      }
      if (words.length) {
        const newValue = words.join(' ')
        setValue(newValue)
        setFilterStr(newValue)
        if (filterStarredRef.current && toggleFilterStarredRef.current) {
          toggleFilterStarredRef.current()
        }
      }
    }
  }, [isAddingFromYouTube, lastAddedFromYouTube, filterStarredRef, toggleFilterStarredRef])

  return (
    <>
      {lastAddedFromYouTube && (
        <div className={styles.container} style={{ justifyContent: 'center' }}>
          <span style={{ textAlign: 'center' }}><i>"{lastAddedFromYouTube.title}" recently added</i></span>
        </div>
      )}

      <div className={styles.container}>
        <div onClick={handleMagnifierClick} className={filterStr ? styles.btnActive : styles.btn}>
          <Icon icon='MAGNIFIER' size={40}/>
        </div>
        <input type='search'
          className={styles.searchInput}
          placeholder='search'
          value={value}
          onChange={handleChange}
          ref={searchInput}
        />
        {filterStr &&
          <div onClick={clearSearch} className={styles.btnActive}>
            <Icon icon='CLEAR' size={40}/>
          </div>
        }

        <div onClick={toggleFilterStarred} className={filterStarred ? styles.btnActive : styles.btn}>
          <Icon icon='STAR_FULL' size={44}/>
        </div>
      </div>
      <AddFromYouTube searchFilterString={filterStr} />
    </>
  )
}

LibraryHeader.propTypes = {
  filterStr: PropTypes.string.isRequired,
  filterStarred: PropTypes.bool.isRequired,
  // actions
  setFilterStr: PropTypes.func.isRequired,
  resetFilterStr: PropTypes.func.isRequired,
  toggleFilterStarred: PropTypes.func.isRequired,
}

export default connect(state => ({
  isAddingFromYouTube: state.prefs.isAddingFromYouTube,
  lastAddedFromYouTube: state.prefs.lastAddedFromYouTube,
}))(LibraryHeader)
