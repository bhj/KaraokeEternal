import React, { useCallback, useEffect, useRef, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import { addSongFromYouTube } from '../../../../store/modules/prefs'
import styles from './AddFromYouTube.css'
import Spinner from 'components/Spinner'

const AddFromYouTube = props => {
  const {
    isAddingFromYouTube,
    lastAddedFromYouTube,
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

  return (
    <>
      <div className={styles.heading}>
        <span><a onClick={toggle}>Can&rsquo;t find your song? Add it from YouTube</a></span>
        {lastAddedFromYouTube && (
          <span><i>&nbsp; You added "{lastAddedFromYouTube.title}"</i></span>
        )}
      </div>

      {showInputs && (
        <form noValidate>
          <input type='text'
            placeholder={`${youTubePrefix}... (YouTube Link)`}
            disabled={isAddingFromYouTube}
            onChange={() => setUrl(urlRef.current.value.trim())}
            ref={urlRef}
            className={styles.field}
          />

          {isValidLink && (
            <input type='text'
              placeholder={`Version (Optional. e.g., "Dave's version")`}
              disabled={!isValidLink || isAddingFromYouTube}
              ref={versionRef}
              className={styles.field}
            />
          )}

          {isValidLink && !isAddingFromYouTube && (
            <button
              onClick={handleSubmit}
              disabled={!isValidLink || isAddingFromYouTube}
              className='primary'
            >
              Add Song from YouTube
            </button>
          )}
        </form>
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
