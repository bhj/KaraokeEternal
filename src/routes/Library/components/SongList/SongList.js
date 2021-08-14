import PropTypes from 'prop-types'
import React from 'react'
import SongItem from '../SongItem'
import queryString from 'query-string'
import { logout } from '../../../../store/modules/user'
import { connect, useDispatch } from 'react-redux'
import history from 'lib/history'

const params = queryString.parse(window.location.search)
console.log('isPublicDeviceParam', params.public)
if (params.public === null || params.public === 'true') {
  window.localStorage.setItem('isPublicDevice', 'true')
} else if (params.public === 'false') {
  window.localStorage.removeItem('isPublicDevice')
}
export const isPublicDevice = window.localStorage.getItem('isPublicDevice') === 'true'
console.log('isPublicDevice', isPublicDevice)

const SongList = (props) => {
  const dispatch = useDispatch()

  const {
    userDisplayName,
    username,
    onModal,
  } = props

  return (
    <>
      {props.songIds.map(songId => {
        const song = props.songs[songId]
        const title = song.title
        const artist = props.showArtist ? props.artists[song.artistId].name : ''
        const isQueued = props.queuedSongs.includes(songId)
        const wasPlayed = props.playedSongs.includes(songId)

        return (
          <SongItem
            {...song}
            artist={artist}
            filterKeywords={props.filterKeywords}
            isQueued={isQueued}
            isStarred={props.starredSongs.includes(songId)}
            isAdmin={props.isAdmin}
            key={songId}
            numStars={props.starredSongCounts[songId] || 0}
            onSongQueue={songId => {
              let songDescription = `"${title}"`
              if (artist) {
                songDescription = `${songDescription} by ${artist}`
              }
              const allowDupsInQueue = true
              const warnDupsInQueue = true
              const alreadyPlayedMessage = 'has already been played'
              const alreadyQueuedMessage = 'is already in the queue'

              const closeModal = () => onModal()

              if ((isQueued || wasPlayed) && !allowDupsInQueue) {
                onModal({
                  title: `Already queued`,
                  content: (
                    <span><i>{songDescription}</i> {wasPlayed ? alreadyPlayedMessage : alreadyQueuedMessage}</span>
                  ),
                  buttons: (
                    <>
                      <button onClick={closeModal}>OK</button>
                    </>
                  ),
                })
                return
              }

              const showQueueAfterQueuing = true

              const queueIt = () => {
                closeModal()
                props.queueSong(songId)
                if (showQueueAfterQueuing) {
                  setTimeout(() => {
                    history.push('queue')
                  }, 1200)
                }
              }

              const logOut = () => {
                closeModal()
                dispatch(logout())
              }

              const informLogOut = () => {
                onModal({
                  title: `Sign in`,
                  content: (
                    <>
                      <p>Please sign in or create an account before queuing up your song</p>
                    </>
                  ),
                  buttons: (
                    <>
                      <button onClick={logOut}>Sign in</button>
                    </>
                  ),
                })
              }

              const checkPerson = () => {
                if (isPublicDevice) {
                  onModal({
                    title: (
                      <span>Are you <i>{userDisplayName}</i>?</span>
                    ),
                    content: (
                      <>
                        <span>username: <i>{username}</i></span>
                        <br /><span>display name: <i>{userDisplayName}</i></span>
                        <p>
                          <i>(Please check that you're not accidentally signed in as someone else)</i>
                        </p>
                      </>
                    ),
                    buttons: (
                      <>
                        <button onClick={informLogOut}>That's not me</button>
                        <button onClick={queueIt}>Yes, I'm "{userDisplayName}"</button>
                      </>
                    ),
                  })
                } else {
                  queueIt()
                }
              }

              if ((isQueued || wasPlayed) && warnDupsInQueue) {
                onModal({
                  title: 'Add it again?',
                  content: (
                    <span><i>{songDescription}</i> {wasPlayed ? alreadyPlayedMessage : alreadyQueuedMessage}. Add it again?</span>
                  ),
                  buttons: (
                    <>
                      <button onClick={checkPerson}>Yes</button>
                      <button onClick={closeModal}>No</button>
                    </>
                  ),
                })
                return
              }

              onModal({
                title: 'Add to queue?',
                content: (
                  <span>Add <i>{songDescription}</i> to the queue?</span>
                ),
                buttons: (
                  <>
                    <button onClick={checkPerson}>Yes</button>
                    <button onClick={closeModal}>No</button>
                  </>
                ),
              })
            }}
            onSongStarClick={props.toggleSongStarred}
            onSongInfo={props.showSongInfo}
          />
        )
      })}
    </>
  )
}

SongList.propTypes = {
  artists: PropTypes.object.isRequired,
  filterKeywords: PropTypes.array.isRequired,
  queuedSongs: PropTypes.array.isRequired,
  showArtist: PropTypes.bool.isRequired,
  songs: PropTypes.object.isRequired,
  songIds: PropTypes.array.isRequired,
  starredSongs: PropTypes.array.isRequired,
  starredSongCounts: PropTypes.object.isRequired,
  // actions
  queueSong: PropTypes.func.isRequired,
  showSongInfo: PropTypes.func.isRequired,
  toggleSongStarred: PropTypes.func.isRequired,
}

export default connect(state => ({
  userDisplayName: state.user.name,
  username: state.user.username,
}))(SongList)
