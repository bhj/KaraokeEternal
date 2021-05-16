import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import styles from './LibraryHeader.css'

class LibraryHeader extends React.Component {
  static propTypes = {
    filterStr: PropTypes.string.isRequired,
    filterStarred: PropTypes.bool.isRequired,
    // actions
    setFilterStr: PropTypes.func.isRequired,
    resetFilterStr: PropTypes.func.isRequired,
    toggleFilterStarred: PropTypes.func.isRequired,
  }

  searchInput = React.createRef()
  state = {
    value: this.props.filterStr,
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
    this.props.setFilterStr(event.target.value)
  }

  handleMagnifierClick = () => {
    this.state.value.trim() ? this.clearSearch() : this.searchInput.current.focus()
  }

  clearSearch = () => {
    this.setState({ value: '' })
    this.props.resetFilterStr()
  }

  render () {
    const { filterStr, filterStarred } = this.props

    return (
      <div className={styles.container}>
        <div onClick={this.handleMagnifierClick} className={filterStr ? styles.btnActive : styles.btn}>
          <Icon icon='MAGNIFIER' size={40}/>
        </div>
        <input type='search'
          className={styles.searchInput}
          placeholder='search'
          value={this.state.value}
          onChange={this.handleChange}
          ref={this.searchInput}
        />
        {filterStr &&
          <div onClick={this.clearSearch} className={styles.btnActive}>
            <Icon icon='CLEAR' size={40}/>
          </div>
        }

        <div onClick={this.props.toggleFilterStarred} className={filterStarred ? styles.btnActive : styles.btn}>
          <Icon icon='STAR_FULL' size={44}/>
        </div>
      </div>
    )
  }
}

export default LibraryHeader
