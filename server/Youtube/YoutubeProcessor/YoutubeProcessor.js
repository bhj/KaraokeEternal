const fs = require('fs')
const rimraf = require('rimraf')
const ytdl = require('ytdl-core')
const axios = require('axios')
const FormData = require('form-data')
const db = require('../../lib/Database').db
const sql = require('sqlate')
const shell = require('../../lib/Shell')
const log = require('../../lib/Log')
  .set('console', process.env.KF_YOUTUBE_CONSOLE_LEVEL, process.env.NODE_ENV === 'development' ? 5 : 4)
  .set('file', process.env.KF_YOUTUBE_LOG_LEVEL, process.env.NODE_ENV === 'development' ? 0 : 3)
  .getLogger(`youtube[${process.pid}]`)
const Youtube = require('../Youtube')
const IPC = require('../../lib/IPCBridge')
const {
  YOUTUBE_VIDEO_UPDATE
} = require('../../../shared/actionTypes')

class YoutubeProcessor extends Youtube {
  constructor (prefs) {
    super()
    this.setPrefs(prefs)
    this.processCount = 0
  }

  setPrefs (prefs) {
    this.isYouTubeEnabled = prefs.isYouTubeEnabled
    this.isKaraokeGeneratorEnabled = prefs.isKaraokeGeneratorEnabled
    this.isConcurrentAlignmentEnabled = prefs.isConcurrentAlignmentEnabled
    this.spleeterPath = prefs.spleeterPath
    this.autoLyrixHost = prefs.autoLyrixHost
    this.ffmpegPath = prefs.ffmpegPath
    this.tmpOutputPath = prefs.tmpOutputPath
    this.maxYouTubeProcesses = prefs.maxYouTubeProcesses * 1

    if (this.maxYouTubeProcesses < 1) {
      this.maxYouTubeProcesses = 1
    }
  }

  processingError (video, err) {
    this.processCount--
    log.error(err)
    IPC.req({
      type: YOUTUBE_VIDEO_UPDATE,
      payload: {
        video,
        status: 'failed'
      }
    })
  }

  async process () {
    let lastUserId = 0
    let video = null

    while (true) {
      if (!this.isYouTubeEnabled) {
        log.info('YouTube is not enabled. Exiting YouTube processor...')
        return
      }

      log.debug('Looking for the next video while ' + this.processCount + ' other processes are running...')

      // This query gets the next pending youtube video that we should process.
      // We get all pending youtube videos, grouped by userId, containing each user's earliest added video.
      // The results are sorted by userId, but with userIds below the last served userId getting an enormous
      // bump. This results in the next video to process being at the top.
      const query = sql`
        SELECT youtubeVideos.*,
          CASE WHEN youtubeVideos.userId < ${lastUserId}
            THEN youtubeVideos.userId + 9999999999999
            ELSE youtubeVideos.userId
          END AS position
        FROM youtubeVideos
          INNER JOIN (
            SELECT userId, MIN(id) AS firstId
            FROM youtubeVideos
            WHERE status = 'pending'
            GROUP BY userId
          ) AS firstVideo ON youtubeVideos.id = firstVideo.firstId AND youtubeVideos.userId = firstVideo.userId
        ORDER BY position DESC
        LIMIT 1
      `
      const videos = await db.all(String(query), query.parameters)

      // if there are more videos to process...
      if (videos.length > 0) {
        // otherwise, the first (and only) row is the next video to process...
        video = videos[0]
        lastUserId = video.userId
        this.processCount++

        this.processVideo(video).finally(() => {
          this.processCount--
          log.info('There are now ' + this.processCount + ' processes running')
        })
      } else {
        // there were no new videos to start processing. If there are no more processes, we can stop the worker...
        if (this.processCount === 0) {
          log.info('No more videos to process. Stopping YouTube worker...')
          return
        }
      }

      if (this.isCanceling) {
        log.info('Cancelling youtube worker gracefully...')
        return
      }

      // pause a moment just to make sure status update requests over IPC have
      // all had a chance to take place before we try getting the next video.
      // we'll also stay here if we're already running the max number of processes.
      do {
        log.debug('Waiting with ' + this.processCount + ' out of ' + this.maxYouTubeProcesses + ' processes running...')
        await shell.sleep(2000)
      } while (this.processCount >= this.maxYouTubeProcesses)
    }
  }

  async processVideo (video) {
    try {
      log.info('Processing video ID #' + video.id + ' using process #' + this.processCount + '...')

      // immediately update the video's status so we don't start processing it a second time...
      await IPC.req({
        type: YOUTUBE_VIDEO_UPDATE,
        payload: {
          video,
          status: 'downloading'
        }
      })

      // make sure the output path exists...
      const outputDir = this.tmpOutputPath + '/' + video.youtubeVideoId
      fs.mkdirSync(outputDir, { recursive: true })

      // download the audio and video separately at the same time...
      log.info('Downloading video #' + video.id + '...')
      try {
        await Promise.all([
          shell.promisifiedPipe(ytdl(video.url, { quality: 'highestaudio', filter:'audioonly' }),
            fs.createWriteStream(outputDir + '/audio.mp3')),
          shell.promisifiedPipe(ytdl(video.url, { quality: 'highestvideo', filter:'videoonly' }),
            fs.createWriteStream(outputDir + '/video.mp4'))
        ])
      } catch (e) {
        // if something went wrong, it's possible there just isn't a separate audio/video stream to download.
        // so let's try downloading a combined stream and then separating it. This is not preferable because
        // the combined streams are usually of lower quality, but it's better than nothing as a fallback...

        // delete any audio/video files that might have partially downloaded before leading to the download error...
        fs.unlinkSync(outputDir + '/audio.mp3')
        fs.unlinkSync(outputDir + '/video.mp4')

        // download a combined audio/video file...
        await shell.promisifiedPipe(ytdl(video.url, { quality: 'highest', filter:'audioandvideo' }),
          fs.createWriteStream(outputDir + '/combined.mp4'))

        // ensure we got the combined file...
        if (!fs.existsSync(outputDir + '/combined.mp4') || fs.statSync(outputDir + '/combined.mp4').size < 1000) {
          throw new Error('Problem downloading combined audio and video file from YouTube')
        }

        // separate the audio and video...
        await Promise.all([
          shell.promisifiedExec(this.ffmpegPath + ' -y -nostdin -i "' + outputDir + '/combined.mp4" -vn "' + outputDir + '/audio.mp3"'),
          shell.promisifiedExec(this.ffmpegPath + ' -y -nostdin -i "' + outputDir + '/combined.mp4" -an -vcodec copy "' + outputDir + '/video.mp4"')
        ])

        // delete the unnecessary combined file...
        fs.unlinkSync(outputDir + '/combined.mp4')
      }

      // ensure we got the audio file...
      if (!fs.existsSync(outputDir + '/audio.mp3') || fs.statSync(outputDir + '/audio.mp3').size < 1000) {
        throw new Error('Problem downloading audio file from YouTube')
      }

      // ensure we got the video file...
      if (!fs.existsSync(outputDir + '/video.mp4') || fs.statSync(outputDir + '/video.mp4').size < 1000) {
        throw new Error('Problem downloading video file from YouTube')
      }

      // update the status to processing...
      log.info('Mixing video #' + video.id + '...')
      await IPC.req({
        type: YOUTUBE_VIDEO_UPDATE,
        payload: {
          video,
          status: 'processing'
        }
      })

      // if this isn't a pre-made karaoke mix, we need to isolate vocals and maybe align lyrics...
      if (!video.karaoke) {
        // split the vocals and maybe align the lyrics, either in parallel or one after the other...
        if (this.isConcurrentAlignmentEnabled) {
          const processPromises = []
          processPromises.push(this.splitVocals(outputDir, video)) // we always need to isolate vocals
          if (video.lyrics) { // if we have lyrics to align, we'll need to do that...
            processPromises.push(this.alignLyrics(outputDir, video))
          }

          await Promise.all(processPromises)
        } else {
          await this.splitVocals(outputDir, video) // we always need to isolate vocals
          if (video.lyrics) { // if we have lyrics to align, we'll need to do that...
            await this.alignLyrics(outputDir, video)
          }
        }

        log.info('Finalizing video #' + video.id + '...')

        // delete the leftover files and audio folder...
        try {
          fs.unlinkSync(outputDir + '/audio.mp3')
          fs.unlinkSync(outputDir + '/video.mp4')
          rimraf(outputDir + '/audio', () => { })
        } catch (err) {
          /* not a big deal. ignore deletion errors. */
        }
      } else { // this is a pre-made karaoke mix, so let's just combine the audio/video...
        await shell.promisifiedExec(this.ffmpegPath + ' -y -nostdin -i "' + outputDir + '/video.mp4" -i "' + outputDir + '/audio.mp3" -c:v copy -c:a aac "' + outputDir + '/karaoke.mp4"')

        // delete the leftover files...
        try {
          fs.unlinkSync(outputDir + '/audio.mp3')
          fs.unlinkSync(outputDir + '/video.mp4')
        } catch (err) {
          /* not a big deal. ignore deletion errors. */
        }
      }

      // double-check that we have a karaoke.mp4 file...
      if (!fs.existsSync(outputDir + '/karaoke.mp4') || fs.statSync(outputDir + '/karaoke.mp4').size < 1000) {
        throw new Error('Karaoke video could not be created')
      }

      // if we needed to align lyrics, check that we got them...
      if (!video.karaoke && video.lyrics && (!fs.existsSync(outputDir + '/aligned.txt') || fs.statSync(outputDir + '/aligned.txt').size < 1000)) {
        throw new Error('Karaoke lyrics could not be aligned')
      }

      // everything checks out!
      log.info('Successfully processed video ID #' + video.id + '!')
      await IPC.req({
        type: YOUTUBE_VIDEO_UPDATE,
        payload: {
          video,
          status: 'ready'
        }
      })
    } catch (err) {
      log.error('Problem processing video #' + video.id + '...')
      log.error(err)
      await IPC.req({
        type: YOUTUBE_VIDEO_UPDATE,
        payload: {
          video,
          status: 'failed'
        }
      })
    }
  }

  async splitVocals (outputDir, video) {
    log.info('Splitting vocals for video #' + video.id + '...')
    await shell.promisifiedExec(this.spleeterPath + ' separate -o "' + outputDir + '" "' + outputDir + '/audio.mp3"')

    // ensure we got the vocals file...
    if (!fs.existsSync(outputDir + '/audio/vocals.wav') || fs.statSync(outputDir + '/audio/vocals.wav').size < 1000) {
      throw new Error('Could not isolate vocals')
    }

    // ensure we got the accompaniment file...
    if (!fs.existsSync(outputDir + '/audio/accompaniment.wav') || fs.statSync(outputDir + '/audio/accompaniment.wav').size < 1000) {
      throw new Error('Could not isolate accompaniment')
    }

    log.info('Successfully split vocals for video ID #' + video.id + '!')

    // combine the video with the instrumental track...
    log.info('Combining audio/video for video ID #' + video.id + '!')
    await shell.promisifiedExec(this.ffmpegPath + ' -y -nostdin -i "' + outputDir + '/video.mp4" -i "' + outputDir + '/audio/accompaniment.wav" -c:v copy -c:a aac "' + outputDir + '/karaoke.mp4"')
  }

  async alignLyrics (outputDir, video) {
    log.info('Aligning lyrics for video #' + video.id + '...')

    const form = new FormData()
    form.append('audio_file', fs.createReadStream(outputDir + '/audio.mp3'))
    form.append('lyrics', video.lyrics)
    form.append('format', 'json')

    const result = await axios.post(
      this.autoLyrixHost + '/align',
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        transformResponse: []
      }
    )

    // make sure the result is good...
    if (result && result.status === 200 && Array.isArray(JSON.parse(result.data))) {
      // save the aligned lyrics to file...
      fs.writeFileSync(outputDir + '/aligned.txt', result.data)
      log.info('Successfully aligned lyrics for video ID #' + video.id + '!')
    } else {
      throw new Error('AutoAlignLyrix Service failed. Maybe try testing the configuration.')
    }
  }
}

module.exports = YoutubeProcessor
