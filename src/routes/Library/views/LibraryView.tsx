import React from 'react'
import { Link } from 'react-router-dom'
import ArtistList from '../components/ArtistList/ArtistList'
import SearchResults from '../components/SearchResults/SearchResults'
import TextOverlay from 'components/TextOverlay/TextOverlay'
import Spinner from 'components/Spinner/Spinner'
import styles from './LibraryView.css'

interface LibraryViewProps {
  isAdmin: boolean
  isLoading: boolean
  isSearching: boolean
  isEmpty: boolean
}

const LibraryView = (props: LibraryViewProps) => {
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

export default LibraryView
