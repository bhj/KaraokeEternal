import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'components/Icon'
import { setPref } from 'store/modules/prefs'
import styles from './YouTubePrefs.css'
import HttpApi from 'lib/HttpApi'

const api = new HttpApi('prefs')

const YouTubePrefs = props => {
  const [isExpanded, setExpanded] = useState(false)
  const isYouTubeEnabled = useSelector(state => state.prefs.isYouTubeEnabled)
  const isKaraokeGeneratorEnabled = useSelector(state => state.prefs.isKaraokeGeneratorEnabled)
  const isConcurrentAlignmentEnabled = useSelector(state => state.prefs.isConcurrentAlignmentEnabled)
  const spleeterPath = useSelector(state => state.prefs.spleeterPath)
  const autoLyrixHost = useSelector(state => state.prefs.autoLyrixHost)
  const ffmpegPath = useSelector(state => state.prefs.ffmpegPath)
  const tmpOutputPath = useSelector(state => state.prefs.tmpOutputPath)
  const upcomingLyricsColor = useSelector(state => state.prefs.upcomingLyricsColor)
  const playedLyricsColor = useSelector(state => state.prefs.playedLyricsColor)
  const maxYouTubeProcesses = useSelector(state => state.prefs.maxYouTubeProcesses)
  const [testingSpleeter, setTestingSpleeter] = useState(false)
  const [spleeterResult, setSpleeterResult] = useState(null)
  const [testingAutoLyrix, setTestingAutoLyrix] = useState(false)
  const [autoLyrixResult, setAutoLyrixResult] = useState(null)
  const [testingFfmpeg, setTestingFfmpeg] = useState(false)
  const [ffmpegResult, setFfmpegResult] = useState(null)

  const toggleExpanded = useCallback(() => {
    setExpanded(!isExpanded)
  }, [isExpanded])

  const dispatch = useDispatch()
  const toggleCheckbox = useCallback((e) => {
    dispatch(setPref(e.target.name, e.target.checked))
  }, [dispatch])
  const updateTextbox = useCallback((e) => {
    dispatch(setPref(e.target.name, e.target.value))
  }, [dispatch])

  const testSpleeter = () => {
    setTestingSpleeter(true)
    setSpleeterResult(null)
    api('GET', '/testspleeter')
      .then((response) => {
        setTestingSpleeter(false)
        setSpleeterResult(response)
      })
      .catch((err) => {
        setTestingSpleeter(false)
        setSpleeterResult({ success:false, message:err.message })
      })
  }

  const testAutoLyrix = () => {
    setTestingAutoLyrix(true)
    setAutoLyrixResult(null)
    api('GET', '/testautolyrix')
      .then((response) => {
        setTestingAutoLyrix(false)
        setAutoLyrixResult(response)
      })
      .catch((err) => {
        setTestingAutoLyrix(false)
        setAutoLyrixResult({ success:false, message:err.message })
      })
  }

  const testFfmpeg = () => {
    setTestingFfmpeg(true)
    setFfmpegResult(null)
    api('GET', '/testffmpeg')
      .then((response) => {
        setTestingFfmpeg(false)
        setFfmpegResult(response)
      })
      .catch((err) => {
        setTestingFfmpeg(false)
        setFfmpegResult({ success:false, message:err.message })
      })
  }

  return (
    <div className={styles.container}>
      <div className={styles.heading} onClick={toggleExpanded}>
        <Icon icon='YOUTUBE' size={28} className={styles.icon} />
        <div className={styles.title}>YouTube</div>
        <div>
          <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} className={styles.icon} />
        </div>
      </div>

      <div style={{ display: isExpanded ? 'block' : 'none' }}>
        <div className={styles.content}>
          <label>
            <input type='checkbox'
              checked={isYouTubeEnabled}
              onChange={toggleCheckbox}
              name='isYouTubeEnabled'
            /> Enable YouTube search
          </label>
        </div>

        <div className={styles.content} style={{ display: isYouTubeEnabled ? 'block' : 'none' }}>
          <label>
            Path to FFMPEG
            <input type='text'
                   defaultValue={ffmpegPath}
                   onChange={updateTextbox}
                   name='ffmpegPath'
            />
            <div className={styles.tip}>
              If ffmpeg is available in your global PATH, this can be left as-is.
              Otherwise, enter the full path to the ffmpeg executable.
            </div>
          </label>
          {!testingFfmpeg && (<a onClick={testFfmpeg}>Test FFMPEG</a>)}
          {testingFfmpeg && (<div>Testing FFMPEG...</div>)}
          {ffmpegResult !== null && ffmpegResult.success && <div className={styles.testSuccess}>{ffmpegResult.message}</div>}
          {ffmpegResult !== null && !ffmpegResult.success && <div className={styles.testFailed}>{ffmpegResult.message}</div>}
        </div>

        <div className={styles.content} style={{ display: isYouTubeEnabled ? 'block' : 'none' }}>
          <label>
            <input type='checkbox'
              checked={isKaraokeGeneratorEnabled}
              onChange={toggleCheckbox}
              name='isKaraokeGeneratorEnabled'
            /> Automatically create karaoke mixes
            <div className={styles.tip}>
              If checked, users can search for anything on YouTube and we'll
              use spleeter and AutoLyrixAlignService to create a karaoke mix out of it. If unchecked,
              users can only search for pre-made karaoke songs on YouTube.
            </div>
          </label>
        </div>

        <div className={styles.content} style={{ display: (isKaraokeGeneratorEnabled && isYouTubeEnabled) ? 'block' : 'none' }}>
          <label>
            Path to Spleeter
            <input type='text'
                   defaultValue={spleeterPath}
                   onChange={updateTextbox}
                   name='spleeterPath'
            />
            <div className={styles.tip}>
              If spleeter is available in your global PATH, this can be left as-is.
              Otherwise, enter the full path to the spleeter executable.
            </div>
          </label>
          {!testingSpleeter && (<a onClick={testSpleeter}>Test Spleeter</a>)}
          {testingSpleeter && (<div>Testing Spleeter...</div>)}
          {spleeterResult !== null && spleeterResult.success && <div className={styles.testSuccess}>{spleeterResult.message}</div>}
          {spleeterResult !== null && !spleeterResult.success && <div className={styles.testFailed}>{spleeterResult.message}</div>}
        </div>

        <div className={styles.content} style={{ display: (isKaraokeGeneratorEnabled && isYouTubeEnabled) ? 'block' : 'none' }}>
          <label>
            AutoLyrixAlign Service Host
            <input type='text'
                   defaultValue={autoLyrixHost}
                   onChange={updateTextbox}
                   name='autoLyrixHost'
            />
            <div className={styles.tip}>
              The host and port where AutoLyrixAlign Service is listening.
              If installed locally, this will be localhost:3000.
            </div>
          </label>
          {!testingAutoLyrix && (<a onClick={testAutoLyrix}>Test AutoLyrixAlign Service</a>)}
          {testingAutoLyrix && (<div>Testing AutoLyrixAlign Service...</div>)}
          {autoLyrixResult !== null && autoLyrixResult.success && <div className={styles.testSuccess}>{autoLyrixResult.message}</div>}
          {autoLyrixResult !== null && !autoLyrixResult.success && <div className={styles.testFailed}>{autoLyrixResult.message}</div>}
        </div>

        <div className={styles.content} style={{ display: (isKaraokeGeneratorEnabled && isYouTubeEnabled) ? 'block' : 'none' }}>
          <label>
            <input type='checkbox'
                   checked={isConcurrentAlignmentEnabled}
                   onChange={toggleCheckbox}
                   name='isConcurrentAlignmentEnabled'
            /> Align lyrics concurrently
            <div className={styles.tip}>
              If checked, we'll run both spleeter and AutoLyricsAlign at the same time.
              This saves a lot of time, but might overwhelm your computer if AutoLyrixAlign Service is running locally.
              If AutoLyrixAlign Service is running on a different server, you should check this.
            </div>
          </label>
        </div>

        <div className={styles.content} style={{ display: (isKaraokeGeneratorEnabled && isYouTubeEnabled) ? 'block' : 'none' }}>
          <label>
            Upcoming Lyrics Color
            <input type='text'
                   defaultValue={upcomingLyricsColor}
                   onChange={updateTextbox}
                   name='upcomingLyricsColor'
            />
            <div className={styles.tip}>
              The color of lyrics that haven't been sang yet. Use any CSS color value.
            </div>
          </label>
        </div>

        <div className={styles.content} style={{ display: (isKaraokeGeneratorEnabled && isYouTubeEnabled) ? 'block' : 'none' }}>
          <label>
            Played Lyrics Color
            <input type='text'
                   defaultValue={playedLyricsColor}
                   onChange={updateTextbox}
                   name='playedLyricsColor'
            />
            <div className={styles.tip}>
              Lyrics will change to this color as they are sang. Use any CSS color value.
            </div>
          </label>
        </div>

        <div className={styles.content} style={{ display: (isKaraokeGeneratorEnabled && isYouTubeEnabled) ? 'block' : 'none' }}>
          <label>
            Temporary output folder
            <input type='text'
                   defaultValue={tmpOutputPath}
                   onChange={updateTextbox}
                   name='tmpOutputPath'
            />
            <div className={styles.tip}>
              This is where we'll store downloaded YouTube videos and cache
              vocal and instrumental tracks. Unless there's a permissions
              problem, this can be left as-is.
            </div>
          </label>
        </div>

        <div className={styles.content} style={{ display: (isKaraokeGeneratorEnabled && isYouTubeEnabled) ? 'block' : 'none' }}>
          <label>
            Maximum processing threads
            <input type='number'
                   defaultValue={maxYouTubeProcesses}
                   onChange={updateTextbox}
                   name='maxYouTubeProcesses'
            />
            <div className={styles.tip}>
              Creating karaoke mixes is CPU intensive and can take several minutes
              per-song. To help keep things moving, you can process several songs
              at the same time. Try setting this to around half the number of
              cores your CPU has. If you notice any lagging while lots of songs
              are processing, try lowering this number. If you notice lots of songs
              are stuck processing for too long, try increasing this number. Note that
              AutoLyrixAlign Service also has its own additional concurrency setting.
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

export default YouTubePrefs
