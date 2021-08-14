import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'
import TextOverlay from 'components/TextOverlay'
import Spinner from 'components/Spinner'
import styles from './LibraryView.css'
import Modal from 'components/Modal'

const LibraryView = (props) => {
  const {
    isAdmin,
    isEmpty,
    isLoading,
    isSearching,
  } = props
  React.useLayoutEffect(() => props.setHeader(LibraryHeader))

  const [modal, setModal] = useState()

  const onModal = modal => setModal(modal)

  return (
    <>
      {!isSearching &&
        <ArtistList {...props} onModal={onModal} />
      }

      {isSearching &&
        <SearchResults {...props} onModal={onModal} />
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

      <Modal
        isVisible={!!modal}
        onClose={modal?.onClose || (() => setModal())}
        title={modal?.title}
        buttons={modal?.buttons}
        style={{ width: '100%', height: '100%' }}
      >
        {modal?.content}
      </Modal>
    </>
  )
}

LibraryView.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isSearching: PropTypes.bool.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  setHeader: PropTypes.func.isRequired,
}

export default LibraryView
