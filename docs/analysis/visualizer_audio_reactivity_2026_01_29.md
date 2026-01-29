# Visualizer Audio-Reactivity Analysis

**Date**: 2026-01-29
**Branch**: `refactor/redux-modernization`
**Scope**: Physarum slime mold simulation vs upstream Butterchurn

---

## Upstream: Butterchurn (MilkDrop)

Upstream Karaoke Eternal (`bhj/KaraokeEternal`) uses **Butterchurn** (`butterchurn@3.0.0-beta.4`), a WebGL port of Winamp's MilkDrop visualizer.

- **Class component** wrapping a `<canvas>` element
- **Audio handling**: Passes a `GainNode` (for sensitivity) directly to `butterchurn.connectAudio()` — Butterchurn handles all FFT analysis internally
- **No custom audio analysis**: Zero frequency-band splitting, beat detection, or spectral analysis in userland code
- **Preset-driven**: Selects from ~500+ MilkDrop presets via `butterchurn-presets/all`, randomized per song
- **Rendering**: Butterchurn's own `render()` loop via `requestAnimationFrame`
- **Audio reactivity**: Entirely inside Butterchurn's GLSL pipelines — per-frame and per-vertex equations in each preset define how audio maps to visual parameters (warp, motion vectors, color cycling, etc.)

### Dependencies removed in our fork
- `butterchurn@3.0.0-beta.4`
- `butterchurn-presets@3.0.0-beta.4`

---

## Ours: Physarum Slime Mold Simulation

We replaced Butterchurn with a custom GPGPU Physarum simulation in Three.js / React Three Fiber. `PhysarumMode` is the sole visualization mode.

### Architecture

- 65,536 agents encoded in a 256×256 RGBA float texture (x, y, angle, 1.0)
- 1024×1024 trail/pheromone field with diffuse-decay pass
- 4-pass per-frame pipeline: Deposit → Diffuse+Decay → Agent Update → Display
- Ping-pong double-buffering on both agent and trail textures

### Audio Pipeline (3 layers)

#### Layer 1: `useAudioAnalyser` — Raw Web Audio API

| Feature | Derivation |
|---|---|
| `bass` | Mean of frequency bins 0–15% (~0–300 Hz) |
| `mid` | Mean of bins 15–50% (~300–2000 Hz) |
| `treble` | Mean of bins 50–100% (~2000+ Hz) |
| `energy` | RMS of waveform (instant loudness) |
| `energySmooth` | EMA of energy, α=0.008 (~2s window at 60fps) |
| `spectralCentroid` | Weighted average of bin indices, EMA-smoothed (α=0.1) |
| `isBeat` / `beatIntensity` | Bass spike > adaptive threshold, 200ms debounce |
| `beatFrequency` | BPM estimated from last 16 beat intervals, normalized to 0–1 |

FFT: 256-point (128 bins), `smoothingTimeConstant=0.8`.

#### Layer 2: `useSmoothedAudio` — Per-frame lerp

PhysarumMode uses `lerpFactor=0.25`:
- All scalars lerped at 0.25
- `beatIntensity` lerped at 4× (1.0) for fast decay
- `energySmooth` and `spectralCentroid` passed through (already EMA-smoothed)

#### Layer 3: PhysarumMode — Audio → Simulation Mapping

| Simulation Param | Formula | Musical Meaning |
|---|---|---|
| `ss` (step size / speed) | `0.0005 + (energySmooth + bass) × 0.002` | Louder / bass-heavy → faster agents |
| `sa` (sensor angle) | `0.2 + spectralCentroid × 0.6` | Brighter timbre → wider forking patterns |
| `ra` (rotation angle) | `0.2 + beatIntensity × 0.5` | Beat hits → sharper turns |
| `so` (sensor offset) | `0.005 + mid × 0.02` | Mid-range energy → longer look-ahead |
| `decay` | `0.97 - energySmooth × 0.07` | Louder passages → faster trail fade |
| `depositStrength` | `0.3 + energy × 0.4 + beatIntensity × 0.3` | Energy + beats → brighter deposits |
| `energyBoost` (display) | `energySmooth` | Overall intensity boost on display |
| `beatFlash` (display) | `beatIntensity` | White flash on beat |

---

## Assessment

### Strengths

- **Musically meaningful mappings**: Each audio feature maps to a semantically appropriate simulation parameter rather than arbitrary noise.
- **Spectral centroid → sensor angle** is effective: bright/harsh music (metal, EDM) produces wider branching; warm/mellow music (ballads) produces tighter, smoother trails.
- **Transient vs sustained separation**: Beat detection drives short-lived effects (rotation bursts, deposit spikes, flashes) while sustained energy drives structural changes (speed, decay).
- **Smoothing pipeline** prevents jittery visuals while preserving beat responsiveness via the 4× lerp multiplier on `beatIntensity`.

### Concerns

1. **Dynamic range compression**: `lerpFactor=0.25` + analyser `smoothingTimeConstant=0.8` + EMA on `energySmooth` yields an effective response time of ~3–4 seconds for sustained energy changes. Genre shifts (quiet verse → loud chorus) unfold slowly.

2. **Bass double-counting**: `ss` uses `energySmooth + bass`, but `energySmooth` already includes bass energy via RMS. Bass-heavy tracks disproportionately speed up agents.

3. **Bass-only beat detection**: `isBeat` relies solely on bass spikes. Music without strong bass hits (acoustic, classical, ambient) produces near-zero beat response, leaving `ra` and `depositStrength` nearly static.

4. **Unused audio features**:
   - `treble` — computed but never consumed. High-frequency content (cymbals, vocals, harmonics) has zero visual effect.
   - `beatFrequency` — BPM estimation computed but unmapped. Could drive periodic color cycling or decay oscillation.

5. **Narrow parameter ranges**: Some mappings have subtle visual impact across their full range. `so` ranges from 0.005 to 0.025 (5× range) which may not produce dramatically different patterns.

### Comparison to Butterchurn

Butterchurn presets contain dozens of per-frame and per-vertex equations referencing multiple audio bands, beat state, and time simultaneously. Our Physarum mode has 6 audio-driven parameters — simpler but more intentional. The tradeoff is less visual variety but more coherent biological aesthetics and a single consistent visual identity.

---

## Potential Improvements

| Improvement | Approach |
|---|---|
| Use `treble` | Map to `gl_PointSize` in deposit shader or trail color saturation |
| Use `beatFrequency` | Modulate decay oscillation period or color palette rotation speed |
| Fix bass double-counting | Replace `energySmooth + bass` with `energySmooth + (bass - energySmooth)` (bass deviation from mean) |
| Broader beat detection | Add onset detection on mid/treble bands alongside bass |
| Widen `so` range | Scale to `0.005 + mid × 0.04` for more dramatic pattern shifts |
| Reduce smoothing latency | Lower `lerpFactor` to 0.15 for energy, keep 0.25 for spectral |
