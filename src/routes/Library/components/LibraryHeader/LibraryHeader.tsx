import React from 'react'
import Button from 'components/Button/Button'
import styles from './LibraryHeader.css'

interface LibraryHeaderProps {
  filterStr: string
  filterStarred: boolean
  // actions
  setFilterStr(search: string): void
  resetFilterStr(): void
  toggleFilterStarred(): void
}

class LibraryHeader extends React.Component<LibraryHeaderProps> {
  searchInput = React.createRef<HTMLInputElement>()
  state = {
    value: this.props.filterStr,
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ value: event.target.value })
    this.props.setFilterStr(event.target.value)
  }

  handleMagnifierClick = () => {
    if (this.state.value.trim()) this.clearSearch()
    else this.searchInput.current.focus()
  }

  clearSearch = () => {
    this.setState({ value: '' })
    this.props.resetFilterStr()
  }

  render () {
    const { filterStr, filterStarred } = this.props

    return (
      <div className={styles.container}>
        <Button
          className={filterStr ? styles.btnActive : styles.btn}
          icon='MAGNIFIER'
          onClick={this.handleMagnifierClick}
          size={40}
        />
        <input
          type='search'
          className={styles.searchInput}
          placeholder='search'
          value={this.state.value}
          onChange={this.handleChange}
          ref={this.searchInput}
        />
        {filterStr && (
          <Button
            icon='CLEAR'
            onClick={this.clearSearch}
            className={styles.btnActive}
            size={40}
          />
        )}
        <Button
          animateClassName={styles.btnAnimate}
          className={filterStarred ? styles.btnActive : styles.btn}
          icon='STAR_FULL'
          onClick={this.props.toggleFilterStarred}
          size={44}
        />
      </div>
    )
  }
}

export default LibraryHeader
