import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'
import TextOverlay from 'components/TextOverlay'
import Spinner from 'components/Spinner'
import styles from './LibraryView.css'

const LibraryView = (props) => {
  const { isAdmin, isEmpty, isLoading, isSearching } = props

  return (
    <>
      {!isSearching &&
        <ArtistList {...props} />
      }

      {isSearching &&
        <SearchResults {...props} />
      }

      {isLoading &&
        <Spinner />
      }

      {!isLoading && isEmpty &&
        <TextOverlay className={styles.empty}>
          <h1>Library Empty</h1>
          {isAdmin &&
            <p><Link to='/account'>Add media folders</Link> to get started.</p>
          }
        </TextOverlay>
      }
    </>
  )
}

LibraryView.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isSearching: PropTypes.bool.isRequired,
  isEmpty: PropTypes.bool.isRequired,
}

export default LibraryView
