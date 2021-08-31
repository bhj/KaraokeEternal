import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import styles from './YouTubeIdentify.css'
import ColorCycle from '../../../Player/components/PlayerTextOverlay/ColorCycle'
import HttpApi from 'lib/HttpApi'
import { _ERROR, USERS_REQUEST } from '../../../../../shared/actionTypes'
import { fetchUsers, receiveUsers } from '../../../Account/modules/users'
import { durationToSeconds } from 'lib/dateTime'
import YouTubeSongItem from '../YouTubeSongItem'

const api = new HttpApi('')

class YouTubeIdentify extends React.Component {
  static propTypes = {
    query: PropTypes.string.isRequired,
    video: PropTypes.object.isRequired,
    ui: PropTypes.object.isRequired,
    onQueued: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    // actions
    queueYoutubeVideo: PropTypes.func,
  }

  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      error: false,
      manual: false,
      added: false,
      songs: [],
      artist: '',
      title: '',
      lyrics: '',
    }

    this.handleArtistChange = this.handleArtistChange.bind(this)
    this.handleTitleChange = this.handleTitleChange.bind(this)
    this.handleLyricsChange = this.handleLyricsChange.bind(this)
  }

  handleArtistChange (event) { this.setState({ artist: event.target.value }) }
  handleTitleChange (event) { this.setState({ title: event.target.value }) }
  handleLyricsChange (event) { this.setState({ lyrics: event.target.value }) }

  componentDidMount () {
    this.performIdentification(null, false)
  }

  performIdentification = (songID = null, includeArtistTitle = true) => {
    const body = {
      video: this.props.video,
      songID: songID,
    }

    if (includeArtistTitle) {
      body.artist = this.state.artist
      body.title = this.state.title
    }

    api('POST', 'youtubeidentify', {
      body
    })
      .then((response) => {
        this.setState({
          songs:response.songs,
          lyrics:response.lyrics,
          loading:false,
          artist: response.artist,
          title: response.title,
        })

        if (songID && this.state.lyrics) {
          this.useLyrics()
        }
      })
      .catch(() => {
        this.setState({
          loading: false,
          error: true,
          manual: false,
          songs: [],
          artist: '',
          title: '',
          lyrics: '',
        })
      })
  }

  useLyrics = () => {
    this.props.queueYoutubeVideo(
      this.props.video.id,
      this.props.video.thumbnail,
      this.props.video.url,
      durationToSeconds(this.props.video.duration),
      this.state.artist,
      this.state.title,
      this.state.lyrics,
      this.props.video.karaoke,
    )
    this.setState({
      added:true,
    })
  }

  render () {
    if (this.state.loading) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <ColorCycle text='IDENTIFYING SONG' className={styles.backdrop}/>
        </div>
      )
    } else if (this.state.error) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <div className={styles.error}>The server had a hickup :(</div>
          <label className={styles.label}>
            <button onClick={this.retry} className={`${styles.btn} primary`}>Try Again</button>
          </label>
        </div>
      )
    } else if (this.state.added) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <div className={styles.success}>
            {this.props.video.karaoke && <><strong>"{ this.state.title }"</strong> by <strong>{ this.state.artist }</strong> has been added! Feel free to add more songs while we download the video.</>}
            {!this.props.video.karaoke && <><strong>"{ this.state.title }"</strong> by <strong>{ this.state.artist }</strong> has been added! Feel free to add more songs while our robots generate a karaoke mix 🤖</>}
          </div>
          <label className={styles.label}>
            <button onClick={this.done} className={`${styles.btn} primary`}>Nice!</button>
          </label>
        </div>
      )
    } else if (this.state.manual) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <div className={styles.info}>
            Enter the song's lyrics below so we can make a karaoke mix. Maybe Google and copy/paste them?
          </div>
          <label className={styles.label}>
            Artist
            <input type='text'
                   className={styles.input}
                   placeholder='Artist'
                   value={this.state.artist}
                   onChange={this.handleArtistChange}
            />
          </label>
          <label className={styles.label}>
            Song
            <input type='text'
                   className={styles.input}
                   placeholder='Song Title'
                   value={this.state.title}
                   onChange={this.handleTitleChange}
            />
          </label>
          <label className={styles.label}>
            Lyrics
            <textarea style={{ height:this.props.ui.innerHeight - 550, minHeight:50 }}
                   className={styles.input}
                   placeholder='Paste lyrics here'
                   value={this.state.lyrics}
                   onChange={this.handleLyricsChange}
            />
          </label>
          <label className={styles.label}>
            <button onClick={this.useLyrics} className={`${styles.btn} primary`}>
              {this.state.lyrics && 'Use These Lyrics'}
              {!this.state.lyrics && 'I\'m good without any lyrics'}
            </button>
          </label>
        </div>
      )
    } else if (this.props.video.karaoke) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <div className={styles.info}>
            <strong>Nice!</strong> This looks like a pre-made karaoke mix, which will take just
            a few seconds to prepare. Feel free to correct the artist and title below...
          </div>
          <label className={styles.label}>
            Artist
            <input type='text'
                   className={styles.input}
                   placeholder='Artist'
                   value={this.state.artist}
                   onChange={this.handleArtistChange}
            />
          </label>
          <label className={styles.label}>
            Song
            <input type='text'
                   className={styles.input}
                   placeholder='Song Title'
                   value={this.state.title}
                   onChange={this.handleTitleChange}
            />
          </label>
          <label className={styles.label} style={{ paddingTop:15 }}>
            <button onClick={this.useLyrics} className={`${styles.btn} primary`}>Add This Song!</button>
          </label>
          <label className={styles.label} style={{ paddingTop:5 }}>
            <button onClick={this.props.onCancel} className={`${styles.btnLink} primary`}>
              Back to Search Results
            </button>
          </label>
        </div>
      )
    } else if (this.state.songs.length === 0) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <div className={styles.info}>
            <strong>Help!</strong> Enter the correct artist and song title to help us find this song.
          </div>
          <label className={styles.label}>
            Artist
            <input type='text'
                   className={styles.input}
                   placeholder='Artist'
                   value={this.state.artist}
                   onChange={this.handleArtistChange}
            />
          </label>
          <label className={styles.label}>
            Song
            <input type='text'
                   className={styles.input}
                   placeholder='Song Title'
                   value={this.state.title}
                   onChange={this.handleTitleChange}
            />
          </label>
          <label className={styles.label} style={{ paddingTop:15 }}>
            <button onClick={this.retry} className={`${styles.btn} primary`}>Try Again</button>
          </label>
          <label className={styles.label} style={{ paddingTop:5 }}>
            <button onClick={this.enterManually} className={`${styles.btnLink} primary`}>
              Let me enter lyrics myself
            </button>
          </label>
          <label className={styles.label} style={{ paddingTop:5 }}>
            <button onClick={this.props.onCancel} className={`${styles.btnLink} primary`}>
              Back to Search Results
            </button>
          </label>
        </div>
      )
    } else if (this.state.songs.length === 1) {
      if (this.state.lyrics) {
        return (
          <div className={styles.container} style={{
            paddingTop:this.props.ui.headerHeight,
            paddingBottom:this.props.ui.footerHeight,
            width:this.props.ui.innerWidth,
            height:this.props.ui.innerHeight,
          }}>
            <div className={styles.success}>
              We think this is <strong>"{ this.state.title }"</strong> by <strong>{ this.state.artist }</strong>, and it goes like this...
            </div>
            <label className={styles.label}>
              <pre className={styles.lyricsContainer} style={{
                height:this.props.ui.innerHeight - 450,
              }}>
                { this.state.lyrics }
              </pre>
            </label>
            <label className={styles.label} style={{ paddingTop:15 }}>
              <button onClick={this.useLyrics} className={`${styles.btn} primary`}>That's it!</button>
            </label>
            <label className={styles.label} style={{ paddingTop:5 }}>
              <button onClick={this.enterArtistAndTitle} className={`${styles.btnLink} primary`}>
                No, that doesn't look right
              </button>
            </label>
          </div>
        )
      } else {
        return (
          <div className={styles.container} style={{
            paddingTop:this.props.ui.headerHeight,
            paddingBottom:this.props.ui.footerHeight,
            width:this.props.ui.innerWidth,
            height:this.props.ui.innerHeight,
          }}>
            <div className={styles.info}>
              We found <strong>"{ this.state.title }"</strong> by <strong>{ this.state.artist }</strong>, but we couldn't find the lyrics. Can you help? Maybe Google and copy/paste them?
            </div>
            <label className={styles.label}>
              Lyrics
              <textarea style={{ height:this.props.ui.innerHeight - 500, minHeight:50 }}
                        className={styles.input}
                        placeholder='Paste lyrics here'
                        value={this.state.lyrics}
                        onChange={this.handleLyricsChange}
              />
            </label>
            <label className={styles.label}>
              <button onClick={this.useLyrics} className={`${styles.btn} primary`}>
                {this.state.lyrics && 'Use These Lyrics'}
                {!this.state.lyrics && 'I\'m good without any lyrics'}
              </button>
            </label>
            <label className={styles.label} style={{ paddingTop:5 }}>
              <button onClick={this.enterArtistAndTitle} className={`${styles.btnLink} primary`}>
                Try a different artist/title
              </button>
            </label>
          </div>
        )
      }
    }

    return (
      <div className={styles.container} style={{
        paddingTop:this.props.ui.headerHeight,
        paddingBottom:this.props.ui.footerHeight,
        width:this.props.ui.innerWidth,
        height:this.props.ui.innerHeight,
      }}>
        <div className={styles.info}>
          We found lots of matches! Which song is this?
        </div>
        <PaddedList
          numRows={this.state.songs.length}
          rowHeight={() => { return YouTubeSongItem.ITEM_HEIGHT }}
          rowRenderer={this.rowRenderer}
          paddingTop={0}
          paddingRight={4}
          paddingBottom={0}
          width={this.props.ui.innerWidth}
          height={this.props.ui.innerHeight - 300}
        />
        <label className={styles.label} style={{ paddingTop:15 }}>
          <button onClick={this.enterArtistAndTitle} className={`${styles.btnLink} primary`}>
            None of these look right
          </button>
        </label>
      </div>
    )
  }

  rowRenderer = ({ index, style }) => {
    const { songs } = this.state

    // song results
    return (
      <YouTubeSongItem
        key={songs[index].id}
        song={songs[index]}
        style={style}
        onSongTap={this.useSong }
      />
    )
  }

  done = () => {
    this.props.onQueued()
  }

  useSong = (song) => {
    this.setState({
      loading: true,
      error: false,
      manual: false,
      songs: [],
      lyrics: '',
    })
    this.performIdentification(song.id)
  }

  retry = () => {
    this.setState({
      loading: true,
      error: false,
      manual: false,
      songs: [],
      lyrics: '',
    })
    this.performIdentification()
  }

  enterArtistAndTitle = () => {
    this.setState({
      loading: false,
      error: false,
      manual: false,
      songs: [],
      lyrics: '',
    })
  }

  enterManually = () => {
    this.setState({
      loading: false,
      error: false,
      manual: true,
      songs: [],
    })
    this.performIdentification()
  }
}

export default YouTubeIdentify
