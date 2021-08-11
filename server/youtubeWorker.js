const log = require('./lib/Log')
  .set('console', process.env.KF_YOUTUBE_CONSOLE_LEVEL, process.env.NODE_ENV === 'development' ? 5 : 4)
  .set('file', process.env.KF_YOUTUBE_LOG_LEVEL, process.env.NODE_ENV === 'development' ? 0 : 3)
  .getLogger(`youtube[${process.pid}]`)
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const {
  YOUTUBE_CMD_STOP,
  YOUTUBE_CMD_UPDATE,
} = require('../shared/actionTypes')

let YoutubeProcessor, Prefs
let _Processor

Database.open({ readonly: true, log: log.info }).then(db => {
  Prefs = require('./Prefs')
  YoutubeProcessor = require('./Youtube/YoutubeProcessor')

  IPC.use({
    [YOUTUBE_CMD_STOP]: async () => {
      log.info('Stopping YouTube processor gracefully')
      cancelProcessing()
    },
    [YOUTUBE_CMD_UPDATE]: async () => {
      log.info('Updating YouTube processor')
      update()
    }
  })

  startProcessing()
})

async function startProcessing () {
  log.info('Starting YouTube processor')

  const prefs = await Prefs.get()
  _Processor = new YoutubeProcessor(prefs)
  await _Processor.process()

  process.exit()
}

async function update () {
  log.info('Updating YouTube processor')

  if (_Processor) {
    const prefs = await Prefs.get()
    _Processor.setPrefs(prefs)
  } else {
    startProcessing()
  }
}

function cancelProcessing () {
  if (_Processor) {
    _Processor.cancel()
  }
}
