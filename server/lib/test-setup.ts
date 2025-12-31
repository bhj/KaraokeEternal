import { initLogger } from './Log.js'

// Initialize logger before any tests run
initLogger('test', {
  console: { level: 2 }, // warn level
  file: { level: 0 }, // disable file logging
})
