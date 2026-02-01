import { audioizeHydraCode } from 'routes/Player/components/Player/PlayerVisualizer/hooks/audioizeHydraCode'
import { getDefaultPreset, getRandomPreset, getPresetByIndex } from './hydraPresets'

export const DEFAULT_SKETCH = audioizeHydraCode(getDefaultPreset())

/**
 * Returns a random sketch from the gallery, with audio injection visible.
 *
 * The gallery contains 58 canonical Hydra sketches. This replaces the
 * previous curated SKETCHES[] array with the full gallery as the source.
 */
export function getRandomSketch (): string {
  return audioizeHydraCode(getPresetByIndex(getRandomPreset()))
}
