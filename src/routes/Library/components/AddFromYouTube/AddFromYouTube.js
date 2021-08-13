import React, { useCallback, useEffect, useRef, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import { addSongFromYouTube } from '../../../../store/modules/prefs'
import styles from './AddFromYouTube.css'
import Spinner from 'components/Spinner'

const AddFromYouTube = props => {
  const {
    isAddingFromYouTube,
    lastAddedFromYouTube,
    searchFilterString,
  } = props;

  false && console.log('isAddingFromYouTube', isAddingFromYouTube)
  false && console.log('lastAddedFromYouTube', lastAddedFromYouTube)

  const urlRef = useRef(null)
  const versionRef = useRef(null)

  const [showInputs, setShowInputs] = useState(false)
  const [url, setUrl] = useState('')

  const dispatch = useDispatch()
  const handleSubmit = useCallback(e => {
    e.preventDefault()
    dispatch(addSongFromYouTube({
      url: urlRef.current.value.trim(),
      version: versionRef.current.value.trim(),
    }))
  }, [dispatch])

  const toggle = useCallback(() => {
    const newShow = !showInputs
    setShowInputs(newShow)
    if (newShow) {
      setTimeout(() => {
        urlRef.current && urlRef.current.focus()
      }, 0)
    } else {
      setUrl('')
    }
  }, [showInputs])

  useEffect(() => {
    if (lastAddedFromYouTube && !isAddingFromYouTube) {
      setShowInputs(false)
      setUrl('')
    }
  }, [isAddingFromYouTube, lastAddedFromYouTube])

  const youTubePrefix = 'https://www.youtube.com/watch?v='
  const youTubePrefixes = [youTubePrefix, 'https://youtu.be/']
  const isValidLink = youTubePrefixes.some(prefix => url.startsWith(prefix) && url.length > prefix.length)

  const showToggleLink = true

  return (
    <>
      {showToggleLink && (
        <div className={styles.heading} style={{ justifyContent: 'center' }}>
          <span><a onClick={toggle}>Add song from YouTube</a></span>
        </div>
      )}

      {showInputs && (
        <div style={{
          maxHeight: '25vh',
          overflowX: 'auto',
        }}>
          {!isValidLink && (
            <div className={styles.heading} style={{ justifyContent: 'center' }}>
              <span style={{ textAlign: 'center' }}>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${searchFilterString} karaoke`)}`} target="blank">Open YouTube</a>
                {' '}
                and search for the song by title or artist.
                <br />Include the word "karaoke" in the search.
                <br />When you find the video you want, open it and click SHARE.
                <br />Click COPY to copy the video link to the clipboard.
                <br />Return here and paste the link below.
              </span>
            </div>
          )}

          <form noValidate>
            <input type='text'
              placeholder="YouTube video link"
              disabled={isAddingFromYouTube}
              onChange={() => setUrl(urlRef.current.value.trim())}
              ref={urlRef}
              className={styles.field}
            />

            {isValidLink && (
              <>
                <div className={styles.heading} style={{ justifyContent: 'center' }}>
                  <span style={{ textAlign: 'center' }}>
                    Optionally, enter the song version (e.g., "Jim's version").
                  </span>
                </div>
                <input type='text'
                  placeholder="song version (optional)"
                  disabled={!isValidLink || isAddingFromYouTube}
                  ref={versionRef}
                  className={styles.field}
                />
              </>
            )}

            {isValidLink && (
              <div className={styles.heading} style={{ justifyContent: 'center' }}>
                <span style={{ textAlign: 'center' }}>
                  Click GET SONG to import the video.
                </span>
              </div>
            )}

            {isValidLink && !isAddingFromYouTube && (
              <button
                onClick={handleSubmit}
                disabled={!isValidLink || isAddingFromYouTube}
                className='primary'
              >
                Get Song
              </button>
            )}
          </form>
        </div>
      )}

      {isAddingFromYouTube &&
        <Spinner />
      }
    </>
  )
}

AddFromYouTube.propTypes = {
  // TODO: add types
}

const mapStateToProps = state => {
  return {
    isAddingFromYouTube: state.prefs.isAddingFromYouTube,
    lastAddedFromYouTube: state.prefs.lastAddedFromYouTube,
  }
}

export default connect(mapStateToProps)(AddFromYouTube)
