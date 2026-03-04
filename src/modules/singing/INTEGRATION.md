# Singing Module – Integration Guide

`src/modules/singing` is a **self-contained, opt-in feature module** that adds
Smule-like real-time singing analysis to KaraokeEternal.  It has **zero impact
on the existing karaoke playback engine** – the app works exactly as before
when this module is not imported or when it is imported but not activated.

---

## Directory structure

```
src/modules/singing/
  index.js          – public API (re-exports from all sub-modules)
  microphone.js     – Web Audio API microphone capture
  pitchDetector.js  – autocorrelation pitch detection
  pitchGraph.js     – canvas-based real-time pitch graph
  timingAnalyzer.js – timestamp comparison & timing accuracy
  scoringEngine.js  – session scoring (pitch + timing → final score)
  scoreUI.js        – floating vanilla-DOM score overlay panel
  INTEGRATION.md    – this file
```

---

## Song metadata extension

Add an optional `expectedNotes` array to any song's metadata object to unlock
pitch-accuracy and timing-accuracy scoring:

```json
{
  "title": "My Song",
  "artist": "Some Artist",
  "expectedNotes": [
    { "time": 2.3,  "note": 440.00 },
    { "time": 2.8,  "note": 493.88 },
    { "time": 3.2,  "note": 523.25 }
  ]
}
```

| Field | Type   | Description                                         |
|-------|--------|-----------------------------------------------------|
| time  | number | Seconds from the start of the song                  |
| note  | number | Expected fundamental frequency in **Hz** (not MIDI) |

If `expectedNotes` is absent or empty the scoring engine falls back to
**presence-only scoring**: the singer is rewarded for actively singing,
regardless of pitch accuracy.

---

## API reference

### microphone.js

```js
import {
  startMicrophone,
  stopMicrophone,
  getAnalyserNode,
  getAudioContext,
  isMicrophoneActive,
} from 'modules/singing/microphone.js'
```

| Export              | Signature                             | Description                                       |
|---------------------|---------------------------------------|---------------------------------------------------|
| `startMicrophone`   | `() → Promise<void>`                  | Request mic access and build the Web Audio graph. |
| `stopMicrophone`    | `() → void`                           | Release the mic stream and AudioContext.          |
| `getAnalyserNode`   | `() → AnalyserNode \| null`           | Access the active AnalyserNode for PCM reads.     |
| `getAudioContext`   | `() → AudioContext \| null`           | Access the active AudioContext.                   |
| `isMicrophoneActive`| `() → boolean`                        | `true` while the stream is running.               |

---

### pitchDetector.js

```js
import { detectPitch, frequencyToNoteName, midiToFrequency }
  from 'modules/singing/pitchDetector.js'
```

#### `detectPitch(audioBuffer, sampleRate, minHz?, maxHz?)`

Detect the fundamental frequency of one audio frame.

```js
const buf = new Float32Array(analyser.fftSize / 2)
analyser.getFloatTimeDomainData(buf)

const result = detectPitch(buf, audioCtx.sampleRate)
// → { pitch: 440.12, note: "A4" }   or null when silent
```

| Parameter    | Type         | Default | Description                                |
|--------------|--------------|---------|--------------------------------------------|
| audioBuffer  | Float32Array | –       | PCM time-domain data from AnalyserNode     |
| sampleRate   | number       | –       | AudioContext sample rate (Hz)              |
| minHz        | number       | 80      | Lower frequency bound for detection        |
| maxHz        | number       | 1400    | Upper frequency bound for detection        |

**Returns** `{ pitch: number, note: string }` or `null` on silence/noise.

---

### pitchGraph.js

```js
import { PitchGraph } from 'modules/singing/pitchGraph.js'
```

#### `new PitchGraph(canvas, options?)`

| Option      | Type   | Default | Description                   |
|-------------|--------|---------|-------------------------------|
| maxSamples  | number | 120     | Rolling history window size   |
| minHz       | number | 80      | Lowest frequency on Y-axis    |
| maxHz       | number | 1400    | Highest frequency on Y-axis   |

#### Methods

| Method                            | Description                                             |
|-----------------------------------|---------------------------------------------------------|
| `addSample(userFreq, expectedFreq?)` | Append one sample and redraw the canvas.             |
| `clear()`                         | Erase history and blank the canvas.                     |
| `resize(width, height)`           | Update canvas dimensions and redraw.                    |

The **expected pitch line** is dashed blue.  The **user pitch line** is:
- Green when the singer is within ~1 semitone of the expected note.
- Red when the singer is more than ~1 semitone away.
- Neutral blue-white when no expected note is available for that frame.

---

### timingAnalyzer.js

```js
import {
  evaluateSample,
  analyzeTimings,
  findNearestMetadata,
  ALLOWED_DEVIATION_MS,   // = 300
} from 'modules/singing/timingAnalyzer.js'
```

#### `evaluateSample(userTimestamp, expectedTimestamp)`

```js
const { isOnTime, deviation } = evaluateSample(userMs, expectedMs)
// deviation: positive = late, negative = early
```

#### `analyzeTimings(pairs) → number`

```js
const accuracy = analyzeTimings([
  { userTimestamp: 1000, expectedTimestamp:  950 },
  { userTimestamp: 2000, expectedTimestamp: 1600 },
])
// → 0.5  (one of two on-time)
```

#### `findNearestMetadata(metadata, elapsedSeconds, windowSeconds?) → entry | null`

Find the closest `{ time, note }` entry within an optional time window.

---

### scoringEngine.js

```js
import { ScoringEngine } from 'modules/singing/scoringEngine.js'
```

#### Class `ScoringEngine`

| Method                              | Description                                        |
|-------------------------------------|----------------------------------------------------|
| `startScoring(songMetadata)`        | Begin a new session; clears previous data.         |
| `processVoiceInput(pitch, timestamp)` | Feed one analysis frame (pitch in Hz or null).  |
| `stopScoring()`                     | End the session.                                   |
| `getScore()`                        | Return current score breakdown.                    |

#### `getScore()` return value

```js
{
  pitchAccuracy:  82,  // integer 0–100
  timingAccuracy: 78,  // integer 0–100
  finalScore:     80,  // integer 0–100  = pitch*0.7 + timing*0.3
}
```

**Score formula:**

```
finalScore = (pitchAccuracy × 0.7) + (timingAccuracy × 0.3)
```

---

### scoreUI.js

```js
import { ScoreUI } from 'modules/singing/scoreUI.js'
```

#### Class `ScoreUI`

```js
const ui = new ScoreUI({
  container: document.getElementById('player-container'), // default: document.body
  position: 'bottom-right',  // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
})
```

| Method           | Description                                              |
|------------------|----------------------------------------------------------|
| `mount()`        | Append the panel to the container (idempotent).          |
| `unmount()`      | Remove the panel and release DOM references.             |
| `update(scores)` | Update displayed values with a `getScore()` result.      |
| `reset()`        | Set all values back to "–" (e.g. on song change).        |

The panel is pointer-events: none so it never blocks interaction with the
karaoke player behind it.

---

## End-to-end integration example

The following example shows how to wire all sub-modules together alongside
the existing player.  The karaoke player continues to operate unchanged.

```js
import {
  startMicrophone, stopMicrophone,
  getAnalyserNode, getAudioContext,
  detectPitch,
  PitchGraph,
  ScoringEngine,
  ScoreUI,
} from 'modules/singing'

// ── 1. Prepare song metadata ─────────────────────────────────────────────
const songMetadata = [
  { time: 1.0, note: 392.00 },   // G4
  { time: 1.5, note: 440.00 },   // A4
  { time: 2.0, note: 493.88 },   // B4
]

// ── 2. Set up UI widgets ─────────────────────────────────────────────────
const canvas = document.getElementById('pitchCanvas')   // <canvas> in your HTML
const graph  = new PitchGraph(canvas, { maxSamples: 100 })

const ui = new ScoreUI({ position: 'bottom-right' })
ui.mount()

// ── 3. Set up the scoring engine ─────────────────────────────────────────
const engine = new ScoringEngine()

// ── 4. Start singing analysis ─────────────────────────────────────────────
async function startSinging () {
  await startMicrophone()
  engine.startScoring(songMetadata)

  const analyser = getAnalyserNode()
  const ctx      = getAudioContext()
  const buf      = new Float32Array(analyser.fftSize / 2)

  // currentExpectedFreq should be updated from your player's time position
  let currentExpectedFreq = null

  const intervalId = setInterval(() => {
    analyser.getFloatTimeDomainData(buf)
    const result = detectPitch(buf, ctx.sampleRate)
    const pitch  = result?.pitch ?? null
    const ts     = Date.now()

    engine.processVoiceInput(pitch, ts)
    graph.addSample(pitch, currentExpectedFreq)
    ui.update(engine.getScore())
  }, 100)

  return intervalId
}

// ── 5. Stop singing analysis ──────────────────────────────────────────────
function stopSinging (intervalId) {
  clearInterval(intervalId)
  engine.stopScoring()
  stopMicrophone()
  console.log('Final score:', engine.getScore())
  // ui and graph remain visible for the user to review
}
```

---

## Backward-compatibility guarantee

- **No existing files are modified.**  All new code lives exclusively in
  `src/modules/singing/`.
- The module is **opt-in**; nothing imports it unless a consumer explicitly
  does so.
- The karaoke playback engine (`CDGPlayer`, `MP4Player`, `PlayerController`,
  etc.) is untouched.
- The existing `singing-analysis` module at `src/modules/singing-analysis/` is
  also untouched.
- If the browser does not support `navigator.mediaDevices.getUserMedia`, calling
  `startMicrophone()` throws – callers should wrap it in `try/catch`.

---

## Disabling the module

Simply do not import from `modules/singing` in your build.  Since the module
exports nothing that is auto-executed, tree-shaking will remove it entirely
when it is unused.
