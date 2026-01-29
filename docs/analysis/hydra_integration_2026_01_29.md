# Hydra Visual Synth Integration & Orchestrator

**Date**: 2026-01-29
**Commit**: `f36c5f5d`
**Branch**: `refactor/redux-modernization`
**Scope**: Complete replacement of Physarum GPU particle simulator with hydra-synth video synthesizer; introduction of admin-only `/orchestrator` route for real-time visual control.
**Red Team**: See `red_team_hydra_integration_2026_01_29.md`

---

## Table of Contents

1. [Motivation](#1-motivation)
2. [What Was Removed](#2-what-was-removed)
3. [What Was Added](#3-what-was-added)
4. [Architecture](#4-architecture)
5. [File Inventory](#5-file-inventory)
6. [HydraVisualizer: Rendering Engine](#6-hydravisualizer-rendering-engine)
7. [Audio Bridge: useHydraAudio](#7-audio-bridge-usehydraaudio)
8. [Code Execution Model](#8-code-execution-model)
9. [Error Handling & Recovery](#9-error-handling--recovery)
10. [Socket.io Action Pipeline](#10-socketio-action-pipeline)
11. [Redux State Changes](#11-redux-state-changes)
12. [Orchestrator Route](#12-orchestrator-route)
13. [Patch Bay: Visual Node Editor](#13-patch-bay-visual-node-editor)
14. [Code Editor Panel](#14-code-editor-panel)
15. [Knob Panel: Rotary Controls](#15-knob-panel-rotary-controls)
16. [Type System](#16-type-system)
17. [Routing & Authorization](#17-routing--authorization)
18. [Security Analysis](#18-security-analysis)
19. [WebGL Lifecycle Management](#19-webgl-lifecycle-management)
20. [Test Coverage](#20-test-coverage)
21. [Verification Checklist](#21-verification-checklist)
22. [Known Limitations & Future Work](#22-known-limitations--future-work)
23. [Dependency Changes](#23-dependency-changes)

---

## 1. Motivation

The Physarum simulator was a custom Three.js + raw WebGL implementation (492 lines of GLSL shaders, ping-pong framebuffer management, DataTexture agent seeding). While visually striking, it had several limitations:

- **Rigid**: Parameters were hardcoded audio mappings. Adding new visual behaviors required shader modifications.
- **Heavy**: Three.js + R3F + postprocessing (Bloom, ChromaticAberration, Vignette) created a large bundle and complex render pipeline.
- **Opaque**: Non-programmers had no way to experiment with visuals.

Hydra-synth is a live-codeable video synthesizer originally built for projection mapping and VJ performance. It provides:

- **Composable API**: Chain sources, transforms, and combinators in a functional pipeline.
- **Live coding**: Evaluate new visual programs at runtime without page reload.
- **Audio reactivity via closures**: Parameters accept `() => number` functions, perfect for bridging our existing `useAudioAnalyser`.
- **Standalone WebGL**: Owns its own canvas and regl context, no Three.js dependency.

---

## 2. What Was Removed

### Deleted Files

| File | Lines | Purpose |
|------|-------|---------|
| `PlayerVisualizer/modes/PhysarumMode.tsx` | 492 | GPU agent simulation with 6 GLSL shaders, 3-pass render pipeline (diffuse/decay, agent update, deposit), beat-reactive decay/steering/spawning |
| `PlayerVisualizer/utils/colorPalettes.ts` | 68 | HSL-based 5-color palette generator, shader uniform conversion |
| `PlayerVisualizer/ThreeVisualizer.tsx` | 162 | R3F Canvas wrapper, PerformanceMonitor, AudioDataProvider, AudioReactiveEffects (Bloom/ChromaticAberration/Vignette postprocessing) |
| `PlayerVisualizer/ThreeVisualizer.css` | 15 | Container/canvas positioning |

### Removed Dependencies (no longer imported)

The following are no longer imported by any active code path:

- `@react-three/fiber` (Canvas, useFrame) - *still in package.json for MilkdropVisualizer potential use*
- `@react-three/drei` (PerformanceMonitor)
- `@react-three/postprocessing` (EffectComposer, Bloom, etc.)
- `postprocessing` (BlendFunction)
- `three` (THREE.Color, THREE.Vector2)

### Dead Code Left In Place

- `contexts/AudioDataContext.tsx` - Was used by ThreeVisualizer's `AudioDataProvider` and `useAudioData`. Now only referenced by `useSmoothedAudio.ts` which also has no importers. Left in place as potentially useful infrastructure for future Three.js modes.
- `hooks/useSmoothedAudio.ts` - Same situation. Provides frame-lerped audio smoothing.

### Removed Directories

- `PlayerVisualizer/modes/` (empty after PhysarumMode deletion)
- `PlayerVisualizer/utils/` (empty after colorPalettes deletion)

---

## 3. What Was Added

### New Files (Phase 1: Player)

| File | Lines | Purpose |
|------|-------|---------|
| `src/types/hydra-synth.d.ts` | 67 | TypeScript declarations for `hydra-synth` (ships no types) |
| `PlayerVisualizer/HydraVisualizer.tsx` | 232 | Hydra canvas, init, animation loop, error boundary |
| `PlayerVisualizer/HydraVisualizer.css` | 15 | Container/canvas positioning (identical to former ThreeVisualizer.css) |
| `PlayerVisualizer/hooks/useHydraAudio.ts` | 52 | Mutable ref audio bridge with stable closures |

### New Files (Phase 2: Orchestrator)

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/Orchestrator/views/OrchestratorView.tsx` | 36 | Main view: PatchBay + CodeEditor + Redux dispatch |
| `src/routes/Orchestrator/views/OrchestratorView.css` | 17 | Full-viewport dark layout |
| `src/routes/Orchestrator/components/PatchBay.tsx` | 362 | Draggable module nodes, patch cables, audio modulation, code generation |
| `src/routes/Orchestrator/components/PatchBay.css` | 186 | Eurorack-inspired dark panel styling |
| `src/routes/Orchestrator/components/CodeEditor.tsx` | 96 | Collapsible code panel with manual/generated modes |
| `src/routes/Orchestrator/components/CodeEditor.css` | 95 | Dark IDE-style textarea |
| `src/routes/Orchestrator/components/KnobPanel.tsx` | 104 | Pointer-drag rotary encoders |
| `src/routes/Orchestrator/components/KnobPanel.css` | 79 | Hardware-inspired knob visuals |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Added `hydra-synth` dependency |
| `shared/types.ts` | `VisualizerMode`: `'physarum'` -> `'hydra'` |
| `shared/actionTypes.ts` | Added `VISUALIZER_HYDRA_CODE_REQ` and `VISUALIZER_HYDRA_CODE` |
| `server/Player/socket.ts` | Added admin-gated handler for hydra code broadcast |
| `src/routes/Player/modules/playerVisualizer.ts` | Default mode -> `'hydra'`, added `hydraCode` state + reducer case |
| `src/routes/Player/modules/playerVisualizer.test.ts` | Updated all `'physarum'` references to `'hydra'`, added 4 hydra code tests |
| `src/components/Header/PlaybackCtrl/DisplayCtrl/DisplayCtrl.tsx` | Mode label: `'Physarum'` -> `'Hydra'` |
| `src/routes/Player/components/Player/Player.tsx` | Passes `hydraCode` prop to PlayerVisualizer |
| `src/routes/Player/components/Player/PlayerVisualizer/PlayerVisualizer.tsx` | Replaced ThreeVisualizer routing with HydraVisualizer, passes `code` prop |
| `src/components/App/Routes/Routes.tsx` | Added `/orchestrator` route with `RequireAdmin` guard |

### Net Change

**+1918 lines, -750 lines** across 26 files. The Physarum shaders alone were 492 lines; the new system is more lines but provides live-coding capability rather than static shaders.

---

## 4. Architecture

### Signal Flow

```
                    ┌──────────────────────────────────────┐
                    │         /orchestrator (Admin)         │
                    │                                      │
                    │  ┌──────────┐     ┌──────────────┐  │
                    │  │ PatchBay │────>│ CodeEditor   │  │
                    │  │ (nodes)  │     │ (textarea)   │  │
                    │  └──────────┘     └──────┬───────┘  │
                    └──────────────────────────┼──────────┘
                                               │
                              dispatch(VISUALIZER_HYDRA_CODE_REQ)
                                               │
                    ┌──────────────────────────┼──────────┐
                    │       Socket Middleware   │          │
                    │    (intercepts server/ prefix)       │
                    └──────────────────────────┼──────────┘
                                               │
                                        socket.emit()
                                               │
                    ┌──────────────────────────┼──────────┐
                    │       Server (socket.ts)  │          │
                    │    if (!isAdmin) return   │          │
                    │    broadcast to room      │          │
                    └──────────────────────────┼──────────┘
                                               │
                              VISUALIZER_HYDRA_CODE action
                                               │
                    ┌──────────────────────────┼──────────┐
                    │    Player Client (Redux)  │          │
                    │    playerVisualizer reducer updates  │
                    │    state.hydraCode                   │
                    └──────────────────────────┼──────────┘
                                               │
                    ┌──────────────────────────┼──────────┐
                    │    Player -> PlayerVisualizer        │
                    │           -> HydraVisualizer         │
                    │                                      │
                    │  ┌─────────────┐  ┌──────────────┐  │
                    │  │useHydraAudio│  │executeHydra   │  │
                    │  │ (closures)  │──│  Code()       │  │
                    │  └──────┬──────┘  └──────┬───────┘  │
                    │         │                │          │
                    │         └───> hydra.tick(dt) <──────┘  │
                    │                  │                    │
                    │              <canvas>                 │
                    └──────────────────────────────────────┘
```

### Rendering Pipeline (per frame)

1. `requestAnimationFrame` fires `tick()`
2. `updateAudio()` reads Web Audio API AnalyserNode, writes to `audioRef.current`
3. `hydra.tick(dt)` executes the compiled Hydra program
4. Hydra calls each source/transform function; closures like `() => bass()` read `audioRef.current.bass`
5. regl renders the fragment shader pipeline to the canvas

### Key Design Decision: autoLoop: false

Hydra normally runs its own `requestAnimationFrame` loop internally. We disable this (`autoLoop: false`) and drive it from our own loop so we can update audio data *before* each tick. This ensures audio values are fresh when Hydra evaluates closures.

### Key Design Decision: makeGlobal: false

Hydra's default behavior pollutes `window` with `osc`, `noise`, `voronoi`, etc. We disable this (`makeGlobal: false`) and instead pass these functions explicitly via `new Function()` parameters. This prevents namespace collisions and makes the component safe for multiple instances.

---

## 5. File Inventory

### PlayerVisualizer directory (after changes)

```
src/routes/Player/components/Player/PlayerVisualizer/
├── PlayerVisualizer.tsx          # Routes mode to HydraVisualizer or MilkdropVisualizer
├── PlayerVisualizer.css          # Container positioning
├── HydraVisualizer.tsx           # Hydra canvas + init + error boundary
├── HydraVisualizer.css           # Canvas positioning
├── MilkdropVisualizer.tsx        # Legacy Butterchurn (unchanged)
├── contexts/
│   └── AudioDataContext.tsx      # Dead code (was used by ThreeVisualizer)
└── hooks/
    ├── useAudioAnalyser.ts       # Web Audio FFT/beat analysis (unchanged, shared)
    ├── useSmoothedAudio.ts       # Dead code (was used by PhysarumMode via Three context)
    └── useHydraAudio.ts          # NEW: Mutable ref bridge for Hydra closures
```

### Orchestrator directory (new)

```
src/routes/Orchestrator/
├── views/
│   ├── OrchestratorView.tsx      # Main view: PatchBay + CodeEditor + dispatch
│   └── OrchestratorView.css      # Full-viewport dark layout
└── components/
    ├── PatchBay.tsx              # Visual node graph editor
    ├── PatchBay.css              # Eurorack-inspired styling
    ├── CodeEditor.tsx            # Collapsible code panel
    ├── CodeEditor.css            # Dark IDE styling
    ├── KnobPanel.tsx             # Rotary encoder UI
    └── KnobPanel.css             # Hardware knob visuals
```

---

## 6. HydraVisualizer: Rendering Engine

**File**: `PlayerVisualizer/HydraVisualizer.tsx` (232 lines)

### Initialization

```typescript
new Hydra({
  canvas,              // Our own <canvas> ref
  width, height,       // From Player dimensions
  detectAudio: false,  // We handle audio ourselves
  makeGlobal: false,   // Don't pollute window
  autoLoop: false,     // We drive the render loop
  precision: 'mediump' // Balance quality vs. performance
})
```

### Lifecycle

| Event | Action |
|-------|--------|
| Mount | Create Hydra instance, execute initial patch |
| `width`/`height` change | Destroy + re-create Hydra (WebGL context needs new dimensions) |
| `code` prop change | Re-execute code via `executeHydraCode()`, reset error counter |
| `isPlaying` true | Start `requestAnimationFrame` loop |
| `isPlaying` false | Cancel animation frame |
| Unmount | Cancel animation frame, call `hydra.regl.destroy()`, null out ref |

### Default Patch

The built-in default renders an audio-reactive composition using all seven audio closures:

```javascript
osc(20, 0.1, () => bass() * 2)        // Bass drives oscillator offset
  .color(1, 0.5, () => treble())       // Treble drives blue channel
  .modulate(noise(3), () => beat() * 0.4)     // Beat modulates with noise
  .modulate(voronoi(5, () => energy() * 2), () => beat() * 0.2)  // Energy drives voronoi
  .rotate(() => mid() * 0.5)           // Mids drive rotation
  .kaleid(() => 2 + beat() * 4)        // Beat drives kaleidoscope
  .saturate(() => 0.6 + energy() * 0.4) // Energy drives saturation
  .out()
```

---

## 7. Audio Bridge: useHydraAudio

**File**: `PlayerVisualizer/hooks/useHydraAudio.ts` (52 lines)

### Problem

Hydra code needs to read audio values inside arrow functions that execute during GPU rendering. React re-renders would be far too slow. We need frame-rate access without triggering React.

### Solution

A mutable ref (`audioRef`) that's written to every animation frame, with stable closures that read from it:

```typescript
const audioRef = useRef<AudioData>(defaultAudioData)

const closures = useMemo(() => ({
  bass:   () => audioRef.current.bass,
  mid:    () => audioRef.current.mid,
  treble: () => audioRef.current.treble,
  beat:   () => audioRef.current.beatIntensity,
  energy: () => audioRef.current.energy,
  bpm:    () => audioRef.current.beatFrequency,
  bright: () => audioRef.current.spectralCentroid,
}), [])  // Never changes — safe to close over
```

### Contract

- `update()` must be called once per animation frame *before* `hydra.tick()`
- `closures` object is memoized and referentially stable
- Each closure returns a `number` in the range `[0, 1]`

### Audio Variable Reference

| Closure | Source Field | Range | Description |
|---------|-------------|-------|-------------|
| `bass()` | `AudioData.bass` | 0-1 | Low-frequency band average (~0-500Hz) |
| `mid()` | `AudioData.mid` | 0-1 | Mid-frequency band average (~300-2000Hz) |
| `treble()` | `AudioData.treble` | 0-1 | High-frequency band average (~2000Hz+) |
| `beat()` | `AudioData.beatIntensity` | 0-1 | Beat transient strength (spike-based detection) |
| `energy()` | `AudioData.energy` | 0-1 | Overall RMS loudness |
| `bpm()` | `AudioData.beatFrequency` | 0-1 | Normalized BPM (0.5 = 120bpm) |
| `bright()` | `AudioData.spectralCentroid` | 0-1 | Spectral brightness (high = harsh, low = warm) |

---

## 8. Code Execution Model

### executeHydraCode()

User/generated code is executed via `new Function()` with explicit named parameters:

```typescript
const fn = new Function(
  // Hydra API (bound to synth instance)
  'osc', 'noise', 'voronoi', 'shape', 'gradient', 'src',
  'o0', 'o1', 'o2', 'o3', 'render',
  // Audio closures
  'bass', 'mid', 'treble', 'beat', 'energy', 'bpm', 'bright',
  // User code body
  code,
)
```

### Why new Function() Over eval()

- **Scoped**: Creates a new function scope. Variables declared in user code don't leak to the component scope.
- **Explicit API surface**: Only the 18 named parameters are available. No implicit `window`, `document`, `fetch` access (though prototype chain traversal can still reach them -- see Security section).
- **Debuggable**: Function objects are inspectable in DevTools.

### What's Exposed to User Code

| Name | Type | Binding |
|------|------|---------|
| `osc` | `(freq?, sync?, offset?) => HydraSource` | `synth.osc.bind(synth)` |
| `noise` | `(scale?, offset?) => HydraSource` | `synth.noise.bind(synth)` |
| `voronoi` | `(scale?, speed?, blending?) => HydraSource` | `synth.voronoi.bind(synth)` |
| `shape` | `(sides?, radius?, smoothing?) => HydraSource` | `synth.shape.bind(synth)` |
| `gradient` | `(speed?) => HydraSource` | `synth.gradient.bind(synth)` |
| `src` | `(output) => HydraSource` | `synth.src.bind(synth)` |
| `o0`-`o3` | `HydraOutput` | Direct reference |
| `render` | `(output?) => void` | `synth.render.bind(synth)` |
| `bass`-`bright` | `() => number` | Stable closures from `useHydraAudio` |

---

## 9. Error Handling & Recovery

### Three-Layer Defense

**Layer 1: executeHydraCode try/catch** (line 22-41)
- Catches syntax errors and immediate runtime errors from `new Function()` compilation and invocation.
- Logs a warning; does not crash. Last working frame persists on canvas.

**Layer 2: tick() error counter** (line 134-146)
- Catches errors that occur during `hydra.tick()` (the per-frame rendering step).
- Counts consecutive errors. Logs the first 3.
- After 10 consecutive errors: auto-reverts to `DEFAULT_PATCH` and resets the counter.
- This handles cases where code compiles but produces runtime errors on specific frames (e.g., NaN propagation, division by zero in shader uniforms).

**Layer 3: React ErrorBoundary** (line 180-221)
- Catches unhandled exceptions that escape the try/catch layers (e.g., synchronous throws from React rendering, regl crashes).
- Renders a static dark gradient fallback.
- Auto-recovers after 2 seconds by resetting `hasError` state.
- Cleans up recovery timer on unmount.
- Player audio/lyrics/queue remain fully functional.

### WebGL Context Loss

The browser can lose a WebGL context at any time (GPU driver crash, context limit exceeded). The `regl.destroy()` call in the cleanup function is wrapped in a try/catch because the context may already be lost. If initialization fails (line 88-90), the component renders an empty canvas with no animation loop.

---

## 10. Socket.io Action Pipeline

### Action Types

```typescript
// shared/actionTypes.ts
export const VISUALIZER_HYDRA_CODE_REQ = 'server/VISUALIZER_HYDRA_CODE'  // Client → Server
export const VISUALIZER_HYDRA_CODE = 'player/VISUALIZER_HYDRA_CODE'       // Server → Clients
```

### Flow

```
Orchestrator client
  → dispatch({ type: 'server/VISUALIZER_HYDRA_CODE', payload: { code } })
  → socketMiddleware intercepts (prefix: 'server/')
  → socket.emit('action', action)
  → Server ACTION_HANDLERS['server/VISUALIZER_HYDRA_CODE']
  → Authorization check: if (!sock.user.isAdmin) return
  → sock.server.to(Rooms.prefix(roomId)).emit('action', {
       type: 'player/VISUALIZER_HYDRA_CODE',
       payload: { code }
     })
  → All clients in room receive action
  → socketMiddleware dispatches to Redux store
  → playerVisualizer reducer sets state.hydraCode = payload.code
  → Player component re-renders
  → PlayerVisualizer passes code prop to HydraVisualizer
  → useEffect [code] fires executeHydraCode()
  → Hydra renders new visual on next tick
```

### Server Handler

```typescript
// server/Player/socket.ts
[VISUALIZER_HYDRA_CODE_REQ]: async (sock, { payload }) => {
  if (!sock.user.isAdmin) return  // Silent rejection for non-admins
  sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
    type: VISUALIZER_HYDRA_CODE,
    payload,
  })
},
```

Non-admin requests are silently dropped. No error response, no logging. This is consistent with the existing pattern in `socket.ts` (e.g., `PLAYER_REQ_OPTIONS` does not check authorization either, but the orchestrator route is admin-only on the client side).

---

## 11. Redux State Changes

### PlayerVisualizerState

```typescript
// Before
interface PlayerVisualizerState {
  isEnabled: boolean
  isSupported: boolean
  presetKey: string
  presetName: string
  sensitivity: number
  mode: VisualizerMode    // was 'physarum' | 'milkdrop' | 'off'
  colorHue: number
  lyricsMode: LyricsMode
}

// After
interface PlayerVisualizerState {
  isEnabled: boolean
  isSupported: boolean
  presetKey: string
  presetName: string
  sensitivity: number
  mode: VisualizerMode    // now 'hydra' | 'milkdrop' | 'off'
  colorHue: number
  lyricsMode: LyricsMode
  hydraCode?: string      // NEW: code received from orchestrator
}
```

### Initial State Default

```typescript
mode: 'hydra'    // was 'physarum'
colorHue: 20     // unchanged
```

### New Reducer Case

```typescript
.addCase(hydraCodeReceived, (state, { payload }) => {
  state.hydraCode = payload.code
})
```

### Prop Chain

```
Redux state.playerVisualizer.hydraCode
  → Player.tsx (visualizer.hydraCode)
  → PlayerVisualizer.tsx (hydraCode prop)
  → HydraVisualizer.tsx (code prop)
  → executeHydraCode(code ?? DEFAULT_PATCH, ...)
```

---

## 12. Orchestrator Route

### Route Registration

```typescript
// src/components/App/Routes/Routes.tsx
<Route
  path='/orchestrator'
  element={(
    <RequireAdmin redirectTo='/account'>
      <OrchestratorView />
    </RequireAdmin>
  )}
/>
```

### RequireAdmin Guard

```typescript
const RequireAdmin = ({ children, redirectTo }) => {
  const { isAdmin, userId } = useAppSelector(state => state.user)
  if (userId === null || !isAdmin) {
    return <Navigate to={redirectTo} replace />
  }
  return children
}
```

This is stricter than `RequireAuth` — it checks both authentication AND admin role. Guests and standard users are redirected to `/account`.

### OrchestratorView Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  PatchBay                            │
│           (flex: 1, scrollable canvas)              │
│                                                     │
├─────────────────────────────────────────────────────┤
│           CodeEditor (collapsible)                  │
└─────────────────────────────────────────────────────┘
```

The PatchBay auto-sends generated code to the player on every change. The CodeEditor shows the generated code and allows manual override.

---

## 13. Patch Bay: Visual Node Editor

**File**: `src/routes/Orchestrator/components/PatchBay.tsx` (362 lines)

### Module Catalog

27 modules across 4 categories:

| Category | Color | Modules |
|----------|-------|---------|
| **Source** | `#2d6a4f` (green) | `osc`, `noise`, `voronoi`, `shape`, `gradient` |
| **Transform** | `#1d3557` (blue) | `rotate`, `scale`, `kaleid`, `repeat`, `pixelate`, `scrollX`, `scrollY` |
| **Combiner** | `#5a189a` (purple) | `modulate`, `blend`, `add`, `diff`, `mult`, `modulateRotate`, `modulateScale` |
| **Color** | `#bc4b1e` (orange) | `color`, `saturate`, `colorama`, `hue`, `brightness`, `invert` |

### Node State

```typescript
interface PatchNode {
  id: string                           // "node_0", "node_1", ...
  type: string                         // "osc", "rotate", etc.
  category: ModuleCategory             // For header color
  params: Record<string, number>       // Current parameter values
  audioMod: Record<string, string|null> // Per-param audio modulation
  x: number; y: number                // Canvas position (absolute pixels)
}
```

### Connection State

```typescript
interface PatchConnection {
  fromId: string   // Output node
  toId: string     // Input node
}
```

### Interactions

| Action | Behavior |
|--------|----------|
| Click module in palette | Creates node at scroll position + random offset |
| Drag node header | Repositions node (pointer capture for smooth dragging) |
| Click output jack (right circle) | Start connection mode |
| Click input jack (left circle) | Complete connection from pending output |
| Click canvas background | Cancel pending connection |
| Right-click connection line | Delete connection |
| Click "x" button on node | Remove node and all its connections |
| Drag knob vertically | Adjust parameter value |
| Click audio mod button | Cycle through audio inputs: null → bass → mid → treble → beat → energy → bpm → bright → null |

### Code Generation: compileToHydra()

The algorithm walks the connection graph as a linear chain:

1. Find the start node (has outgoing connections but no incoming).
2. Walk from start → connected nodes in sequence.
3. First node must be a source (osc, noise, etc.) — compiles to `osc(freq, sync, offset)`.
4. Subsequent nodes compile as chained methods: `.rotate(angle)`, `.color(r, g, b)`.
5. Combiner nodes inject a default modulator: `.modulate(noise(3), amount)`.
6. Chain ends with `.out()`.

Audio-modulated parameters compile as closures:

```javascript
// Static:  osc(20, 0.1, 0)
// With bass mod on offset:  osc(20, 0.1, () => bass() * 0.50)
```

### Connection Visualization

Connections render as SVG cubic bezier curves with control points at the horizontal midpoint:

```
M x1,y1 C cx,y1, cx,y2, x2,y2
```

A transparent wider stroke overlays the visible line as a click target for deletion.

---

## 14. Code Editor Panel

**File**: `src/routes/Orchestrator/components/CodeEditor.tsx` (96 lines)

### Modes

| Mode | Behavior |
|------|----------|
| **Generated** (default when PatchBay has output) | Textarea shows PatchBay-generated code, read-only. Syncs when PatchBay changes. |
| **Manual** (toggle or on any keystroke) | Textarea is editable. PatchBay changes no longer overwrite. |

### Features

- **Collapsible**: Click header to toggle body visibility.
- **Tab handling**: Inserts 2 spaces instead of changing focus.
- **Ctrl+Enter**: Sends current code to player via Redux dispatch.
- **Send button**: Same as Ctrl+Enter.
- **Audio variable reference**: Footer shows available closures (`bass()`, `mid()`, etc.) as styled chips.

### Default Code

When no `generatedCode` is provided (no PatchBay nodes), the editor pre-fills with the same `DEFAULT_PATCH` used by HydraVisualizer.

---

## 15. Knob Panel: Rotary Controls

**File**: `src/routes/Orchestrator/components/KnobPanel.tsx` (104 lines)

### Knob Behavior

- **Visual**: 48px circular dial with radial gradient and colored indicator dot.
- **Range**: 270 degrees of rotation (-135 to +135).
- **Interaction**: Vertical pointer drag. Upward increases value, downward decreases.
- **Sensitivity**: `range / 150` units per pixel of drag.
- **Quantization**: Rounds to nearest `step` value.
- **Display**: Value shown below knob with adaptive decimal precision.

### CSS Custom Properties

```css
--knob-color: #0ff;        /* Indicator and hover border color */
--knob-angle: 45deg;       /* Current rotation */
```

Audio-modulated knobs use `#d4a017` (amber); static knobs use `#0ff` (cyan).

### Pointer Capture

The knob captures the pointer on `pointerdown` so dragging works even when the cursor moves outside the knob element. Released on `pointerup`.

---

## 16. Type System

### hydra-synth.d.ts

Since `hydra-synth` ships no TypeScript declarations, we provide ambient module types:

- **`Hydra`** class: Constructor options, `synth` property, `tick()` method, `regl.destroy()` for cleanup.
- **`HydraSynth`** interface: Source generators (`osc`, `noise`, etc.), output buffers (`o0`-`o3`), external sources (`s0`-`s3`), audio (`a`), `render()`.
- **`HydraSource`** interface: All chainable methods (transforms, combinators, color ops) returning `HydraSource`. Includes `[key: string]: any` catch-all for methods we haven't typed.
- **`HydraOutput`**, **`HydraExtSource`**, **`HydraAudio`** interfaces.

All numeric parameters accept `number | (() => number)` to support both static values and audio-reactive closures.

### VisualizerMode

```typescript
// shared/types.ts
export type VisualizerMode = 'hydra' | 'milkdrop' | 'off'
```

---

## 17. Routing & Authorization

### Access Matrix

| Route | Auth Required | Role Required | Guard |
|-------|--------------|---------------|-------|
| `/orchestrator` | Yes | Admin | `RequireAdmin` |
| `/player` | Yes | Non-guest | `RequireAuth` (path check) |
| `/library` | Yes | Any | `RequireAuth` |
| `/queue` | Yes | Any | `RequireAuth` |

### Socket Authorization

The `VISUALIZER_HYDRA_CODE_REQ` handler checks `sock.user.isAdmin` server-side. Even if a non-admin client somehow dispatches this action (e.g., via browser DevTools), the server silently drops it.

---

## 18. Security Analysis

### Threat: Arbitrary Code Execution

**Status**: Accepted risk per `red_team_hydra_integration_2026_01_29.md`.

- Code executes in the Player browser's main thread, same origin.
- `new Function()` provides naming isolation but not true sandboxing (prototype chain can reach `window` via `this.constructor.constructor('return window')()`).
- Only admins can send code. The orchestrator UI is admin-gated both client-side (RequireAdmin) and server-side (isAdmin check).

### Threat: Client-Side DoS

**Status**: Accepted risk.

- Infinite loops (`while(true){}`) will freeze the Player tab.
- No practical mitigation short of Web Worker isolation (future work).
- Error boundary catches *thrown* errors but cannot interrupt infinite loops.

### Threat: WebGL Context Exhaustion

**Status**: Mitigated.

- `hydra.regl.destroy()` called on every unmount.
- Re-initialization only on dimension changes, not on code changes.
- Error in destroy is caught silently.

### Mitigations In Place

1. Server-side `isAdmin` check on socket handler
2. Client-side `RequireAdmin` route guard
3. `new Function()` with explicit parameter binding (not raw `eval()`)
4. `try/catch` in `executeHydraCode()` and `tick()`
5. Error counter with auto-revert after 10 consecutive failures
6. React ErrorBoundary with 2-second auto-recovery
7. Explicit WebGL context destruction on unmount

---

## 19. WebGL Lifecycle Management

### Context Creation

One regl context per HydraVisualizer mount. Created in the Hydra constructor. Canvas dimensions are set via HTML attributes (`width`, `height`), not CSS.

### Context Destruction

```typescript
return () => {
  cancelAnimationFrame(rafRef.current)
  try {
    hydra.regl.destroy()      // Release GPU resources
  } catch {
    // Context may already be lost
  }
  hydraRef.current = null     // Allow GC
}
```

### Re-initialization Triggers

The Hydra instance is destroyed and re-created when `width` or `height` props change. The `code` prop changes do *not* trigger re-initialization — they only re-execute the code on the existing Hydra instance.

### Browser Limits

Browsers enforce a hard limit of ~16 WebGL contexts. In a kiosk scenario where users switch between Hydra/Milkdrop/Off repeatedly, proper destruction prevents context exhaustion. The MilkdropVisualizer (Butterchurn) manages its own WebGL context independently.

---

## 20. Test Coverage

### Test File

`src/routes/Player/modules/playerVisualizer.test.ts` — 27 tests total.

### Tests Updated (physarum → hydra)

| Test | Change |
|------|--------|
| "should have default mode of 'hydra'" | Was `'physarum'` |
| "should have mode field in initial state" | Expects `'hydra'` |
| Initial state inline | `mode: 'hydra'` |
| Type definition | `'hydra'` in union |

### New Tests Added (4)

| Test | Assertion |
|------|-----------|
| "should have no hydraCode in initial state" | `state.hydraCode` is `undefined` |
| "should update hydraCode via VISUALIZER_HYDRA_CODE" | Dispatching action sets `state.hydraCode` to payload |
| "should replace hydraCode on subsequent VISUALIZER_HYDRA_CODE" | Second dispatch overwrites first |
| "should preserve hydraCode when other options change" | `PLAYER_CMD_OPTIONS` with sensitivity change doesn't clear `hydraCode` |

### Full Suite

All 196 tests pass across 16 test files (verified at commit time).

---

## 21. Verification Checklist

### Phase 1 (Player)

- [x] `npm install` succeeds with hydra-synth (31 packages added)
- [x] `npx tsc --noEmit` passes (both tsconfig.json configs)
- [x] Mode selector shows "Hydra" instead of "Physarum" in DisplayCtrl
- [x] Default mode is `'hydra'` in Redux initial state
- [x] HydraVisualizer renders canvas with default audio-reactive patch
- [x] Audio closures receive data from useAudioAnalyser
- [x] Sensitivity slider affects audio gain via useHydraAudio → useAudioAnalyser
- [x] Milkdrop mode still works (MilkdropVisualizer unchanged)
- [x] Mode 'off' renders nothing (early return in PlayerVisualizer)
- [x] Error boundary catches crashes and auto-recovers
- [x] WebGL context destroyed on unmount

### Phase 2 (Orchestrator)

- [x] `/orchestrator` route accessible to admins
- [x] Non-admin users redirected to `/account`
- [x] PatchBay renders module palette with 4 categories
- [x] Nodes can be created, positioned, connected, and deleted
- [x] Knob drag adjusts parameters
- [x] Audio modulation toggles cycle through 7 audio inputs
- [x] Code generation produces valid Hydra syntax
- [x] CodeEditor shows generated code
- [x] Manual mode allows direct editing
- [x] Ctrl+Enter and Send button dispatch VISUALIZER_HYDRA_CODE_REQ
- [x] Server broadcasts VISUALIZER_HYDRA_CODE to room (admin only)
- [x] Player receives and executes new code

---

## 22. Known Limitations & Future Work

### Current Limitations

| Limitation | Impact | Future Mitigation |
|-----------|--------|-------------------|
| Linear chain only in PatchBay | Can't create branching or feedback graphs | Support DAG topology with multiple input jacks per combiner |
| Combiners use hardcoded `noise(3)` as second source | Can't modulate with custom sources | Allow connecting a second source node to combiner's modulation input |
| No preset save/load | Patch configurations are ephemeral | Persist patches to server (per-room or per-user) |
| No per-song patch association | All songs use the same visual | Map song IDs to patch presets |
| No transition effects | Abrupt visual change when code updates | Crossfade between o0/o1 buffers |
| Code runs on main thread | Infinite loops freeze the Player tab | Move to Web Worker + OffscreenCanvas |
| No MIDI controller support | Physical knobs would improve VJ workflow | Web MIDI API integration |
| `colorHue` prop unused by Hydra mode | DisplayCtrl still shows the slider for non-milkdrop modes | Either remove for Hydra mode or map to a Hydra parameter |

### Phase 3 Roadmap (from original plan)

- Preset library: save/load named patches
- Per-song auto-switching: associate patches with songs
- Transition effects between patch changes
- Multi-output composition (Hydra o0-o3 buffers)
- MIDI controller support for physical knobs

---

## 23. Dependency Changes

### Added

| Package | Version | Purpose |
|---------|---------|---------|
| `hydra-synth` | latest | Live-codeable video synthesizer (regl-based WebGL) |

### Transitive Dependencies Added

31 packages total, including `regl` (WebGL abstraction), `glslify` (GLSL module system), and `array-pinch` (array manipulation).

### No Longer Imported (but still in package.json)

These are still used by MilkdropVisualizer or other parts of the app:

- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/postprocessing`
- `postprocessing`
- `three`

They remain in `package.json` but are no longer imported by any active code path in the visualizer pipeline. They could be removed if MilkdropVisualizer doesn't use Three.js (it uses Butterchurn directly with its own canvas).
