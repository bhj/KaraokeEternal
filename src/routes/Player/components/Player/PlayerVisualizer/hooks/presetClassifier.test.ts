import { describe, it, expect } from 'vitest'
import { classifyPreset, getInjectionChain, type PresetCategory } from './presetClassifier'
import { DEFAULT_PROFILE } from './audioInjectProfiles'
import { stripInjectedLines } from 'lib/injectedLines'
import { HYDRA_GALLERY } from 'routes/Orchestrator/components/hydraGallery'
import { getPresetByIndex, getPresetCount } from 'routes/Orchestrator/components/hydraPresets'

describe('classifyPreset', () => {
  it('classifies camera preset (s0.initCam + src(s0))', () => {
    const code = 's0.initCam()\nsrc(s0).saturate(2).contrast(1.3).out(o0)'
    expect(classifyPreset(code)).toBe('camera')
  })

  it('classifies camera preset from detectCameraUsage sources', () => {
    const code = 's0.initCam()\nsrc(s0).out()'
    expect(classifyPreset(code)).toBe('camera')
  })

  it('classifies feedback preset (src(o0) self-reference not in .layer())', () => {
    const code = 'src(o0).modulate(o0, 0.01).out(o0)'
    expect(classifyPreset(code)).toBe('feedback')
  })

  it('does NOT classify as feedback when src(o0) is inside .layer()', () => {
    // flor_1 pattern: src(o0) inside .layer() is NOT feedback
    const code = 's0.initCam()\nsrc(s0).saturate(2).layer(src(o0).mask(shape(4,2)).modulate(o0,0.001).out(o0))'
    // Has camera usage, so should be camera, not feedback
    expect(classifyPreset(code)).toBe('camera')
  })

  it('classifies kaleid preset', () => {
    const code = 'osc(10).kaleid(4).out()'
    expect(classifyPreset(code)).toBe('kaleid')
  })

  it('classifies kaleid even with complex chain', () => {
    const code = 'osc(20, 0.03, 1.7).kaleid().mult(osc(20, 0.001, 0).rotate(1.58)).out(o0)'
    expect(classifyPreset(code)).toBe('kaleid')
  })

  it('does NOT classify as kaleid when .kaleid is in a comment', () => {
    const code = '// .kaleid(4)\nosc(10).out()'
    expect(classifyPreset(code)).toBe('default')
  })

  it('classifies default for simple osc', () => {
    const code = 'osc(10).out()'
    expect(classifyPreset(code)).toBe('default')
  })

  it('classifies default for osc without kaleid/camera/feedback', () => {
    const code = 'osc(10).color(1, 0.5, 0.3).rotate(0.5).out()'
    expect(classifyPreset(code)).toBe('default')
  })

  it('camera takes priority over kaleid when both present', () => {
    const code = 's0.initCam()\nsrc(s0).kaleid(4).out()'
    expect(classifyPreset(code)).toBe('camera')
  })

  it('camera takes priority over feedback', () => {
    const code = 's0.initCam()\nsrc(s0).layer(src(o0)).out()'
    expect(classifyPreset(code)).toBe('camera')
  })

  describe('gallery contract', () => {
    it('all presets classify without error', () => {
      for (let i = 0; i < getPresetCount(); i++) {
        const code = getPresetByIndex(i)
        const category = classifyPreset(code)
        expect(
          ['camera', 'feedback', 'kaleid', 'default'].includes(category),
          `Preset ${i} (${HYDRA_GALLERY[i].sketch_id}) returned invalid category: ${category}`,
        ).toBe(true)
      }
    })

    it('flor_1 classifies as camera', () => {
      const florIdx = HYDRA_GALLERY.findIndex(g => g.sketch_id === 'flor_1')
      expect(florIdx).toBeGreaterThan(-1)
      const code = getPresetByIndex(florIdx)
      expect(classifyPreset(code)).toBe('camera')
    })
  })
})

describe('getInjectionChain', () => {
  const p = DEFAULT_PROFILE

  it('camera chain does NOT contain .modulate(osc(', () => {
    const chain = getInjectionChain('camera', p)
    expect(chain).not.toContain('.modulate(osc(')
  })

  it('camera chain contains .saturate(', () => {
    const chain = getInjectionChain('camera', p)
    expect(chain).toContain('.saturate(')
  })

  it('camera chain contains .contrast(', () => {
    const chain = getInjectionChain('camera', p)
    expect(chain).toContain('.contrast(')
  })

  it('feedback chain contains .brightness(', () => {
    const chain = getInjectionChain('feedback', p)
    expect(chain).toContain('.brightness(')
  })

  it('feedback chain contains .contrast(', () => {
    const chain = getInjectionChain('feedback', p)
    expect(chain).toContain('.contrast(')
  })

  it('feedback chain does NOT contain .modulate(osc(', () => {
    const chain = getInjectionChain('feedback', p)
    expect(chain).not.toContain('.modulate(osc(')
  })

  it('kaleid chain contains .brightness(', () => {
    const chain = getInjectionChain('kaleid', p)
    expect(chain).toContain('.brightness(')
  })

  it('kaleid chain contains .color(', () => {
    const chain = getInjectionChain('kaleid', p)
    expect(chain).toContain('.color(')
  })

  it('kaleid chain does NOT contain .rotate(', () => {
    const chain = getInjectionChain('kaleid', p)
    expect(chain).not.toContain('.rotate(')
  })

  it('default chain contains .modulate(osc(', () => {
    const chain = getInjectionChain('default', p)
    expect(chain).toContain('.modulate(osc(')
  })

  it('default chain contains .rotate(', () => {
    const chain = getInjectionChain('default', p)
    expect(chain).toContain('.rotate(')
  })

  it('default chain contains .scale(', () => {
    const chain = getInjectionChain('default', p)
    expect(chain).toContain('.scale(')
  })

  it('default chain contains .color(', () => {
    const chain = getInjectionChain('default', p)
    expect(chain).toContain('.color(')
  })

  describe('stripInjectedLines roundtrip', () => {
    const categories: PresetCategory[] = ['camera', 'feedback', 'kaleid', 'default']
    it.each(categories)('%s: stripping injected lines from chain yields empty/whitespace', (category) => {
      const chain = getInjectionChain(category, p)
      const stripped = stripInjectedLines(chain)
      expect(stripped.trim()).toBe('')
    })
  })
})
