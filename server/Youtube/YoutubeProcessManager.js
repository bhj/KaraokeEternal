const sql = require('sqlate')
const env = require('../lib/cli')
const log = require('../lib/Log')
  .set('console', env.KF_SERVER_CONSOLE_LEVEL, env.NODE_ENV === 'development' ? 5 : 4)
  .set('file', env.KF_SERVER_LOG_LEVEL, env.NODE_ENV === 'development' ? 0 : 3)
  .getLogger(`main[${process.pid}]`)
const IPC = require('../lib/IPCBridge')
const childProcess = require('child_process')
const path = require('path')

const {
  YOUTUBE_CMD_STOP,
  YOUTUBE_CMD_UPDATE,
} = require('../../shared/actionTypes')

let youtubeProcess = null

const resetProcessingVideos = async () => {
  // reset videos left in any sort of processing state...
  const db = require('../lib/Database').db // need to wait until here to do this so the DB is connected. This seems hackish?
  log.info('Resetting YouTube videos left processing')
  const query = sql`
    UPDATE youtubeVideos SET status='pending'
    WHERE status NOT IN ('pending', 'ready', 'failed')
  `
  await db.run(String(query))
}

const startYoutubeProcessor = async () => {
  if (youtubeProcess === null) {
    await resetProcessingVideos()
    log.info('Starting YouTube processor')
    let options = { env: { ...env, KF_CHILD_PROCESS: 'youtube' } }
    if (process.env.NODE_ENV === 'development') {
      options.execArgv = ['--inspect=5724']
    }

    youtubeProcess = childProcess.fork(path.join(__dirname, '..', 'youtubeWorker.js'), [], options)

    youtubeProcess.on('exit', (code, signal) => {
      log.info(`YouTube processor exited (${signal || code})`)
      IPC.removeChild(youtubeProcess)
      youtubeProcess = null
    })

    IPC.addChild(youtubeProcess)
  } else {
    log.info('YouTube processor already running')
  }
}

const updateYoutubeProcessor = () => {
  log.info('Updating YouTube processor')
  if (youtubeProcess === null) {
    startYoutubeProcessor()
  } else {
    IPC.send({ type: YOUTUBE_CMD_UPDATE })
  }
}

const stopYoutubeProcessor = () => {
  if (youtubeProcess) {
    IPC.send({ type: YOUTUBE_CMD_STOP })
  }
}

const killYoutubeProcess = () => {
  if (youtubeProcess) {
    youtubeProcess.kill()
  }
}

exports.startYoutubeProcessor = startYoutubeProcessor
exports.stopYoutubeProcessor = stopYoutubeProcessor
exports.killYoutubeProcess = killYoutubeProcess
exports.updateYoutubeProcessor = updateYoutubeProcessor
