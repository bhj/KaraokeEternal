import { describe, it, expect } from 'vitest'
import { getSkipRegions } from 'lib/skipRegions'
import { audioizeHydraCode, hasAudioUsage } from './audioizeHydraCode'
import { HYDRA_GALLERY } from 'routes/Orchestrator/components/hydraGallery'
import { decodeSketch, getPresetByIndex, getPresetCount } from 'routes/Orchestrator/components/hydraPresets'

describe('audioizeHydraCode', () => {
  describe('hasAudioUsage detection', () => {
    const check = (code: string) => {
      const { regions } = getSkipRegions(code)
      return hasAudioUsage(code, regions)
    }

    it.each([
      ['a.fft', 'osc().modulate(noise(3), () => a.fft[0]).out()'],
      ['a.setBins', 'a.setBins(4)\nosc().out()'],
      ['a.setSmooth', 'a.setSmooth(0.4)\nosc().out()'],
      ['a.setScale', 'a.setScale(1.25)\nosc().out()'],
    ])('detects %s as audio usage', (_label, code) => {
      expect(check(code)).toBe(true)
    })

    it('does NOT detect audio in // line comments', () => {
      expect(check('// a.fft[0]\nosc().out()')).toBe(false)
    })

    it('does NOT detect audio in /* block */ comments', () => {
      expect(check('/* a.setBins(4) */\nosc().out()')).toBe(false)
    })
  })

  describe('render-aware injection', () => {
    it('injects 4-line audio chain before .out() (no args, treated as o0)', () => {
      const code = 'osc(10)\n  .out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      expect(result).toContain('.rotate(() => a.fft[1] * 0.08)')
      expect(result).toContain('.scale(() => 0.95 + a.fft[2] * 0.08)')
      expect(result).toContain('.color(1, 1 - a.fft[3] * 0.06, 1 + a.fft[3] * 0.06)')
      expect(result.indexOf('.modulate')).toBeLessThan(result.indexOf('.out()'))
    })

    it('injects before .out(o0)', () => {
      const code = 'osc(10)\n  .out(o0)'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      expect(result.indexOf('.modulate')).toBeLessThan(result.indexOf('.out(o0)'))
    })

    it('injects when no render() and single .out()', () => {
      const code = 'osc(10).color(1, 0.5, 0.3)\n  .out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
    })

    it('injects before last .out(o0) when no render() and multiple .out()', () => {
      const code = 'osc(10).out(o0)\nnoise(5).out(o1)'
      const result = audioizeHydraCode(code)
      // Should inject before .out(o0) — last match for default target o0
      const modIdx = result.indexOf('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      const outO0Idx = result.indexOf('.out(o0)')
      expect(modIdx).toBeGreaterThan(-1)
      expect(modIdx).toBeLessThan(outO0Idx)
    })

    it('injects before .out(o0) when render(o0)', () => {
      const code = 'osc(10).out(o0)\nnoise(5).out(o1)\nrender(o0)'
      const result = audioizeHydraCode(code)
      const modIdx = result.indexOf('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      const outO0Idx = result.indexOf('.out(o0)')
      expect(modIdx).toBeGreaterThan(-1)
      expect(modIdx).toBeLessThan(outO0Idx)
    })

    it('injects before .out(o1) when render(o1)', () => {
      const code = 'osc(10).out(o0)\nnoise(5).out(o1)\nrender(o1)'
      const result = audioizeHydraCode(code)
      const modIdx = result.indexOf('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      const outO1Idx = result.indexOf('.out(o1)')
      expect(modIdx).toBeGreaterThan(-1)
      expect(modIdx).toBeLessThan(outO1Idx)
    })

    it('last render() wins when multiple render() calls', () => {
      const code = 'osc(10).out(o0)\nnoise(5).out(o1)\nrender(o0)\nrender(o1)'
      const result = audioizeHydraCode(code)
      // Last render is o1, so inject before .out(o1)
      const modIdx = result.indexOf('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      const outO1Idx = result.indexOf('.out(o1)')
      expect(modIdx).toBeGreaterThan(-1)
      expect(modIdx).toBeLessThan(outO1Idx)
    })

    it('preserves code after .out()', () => {
      const code = 'osc(10)\n  .out()\nspeed = 0.1'
      const result = audioizeHydraCode(code)
      expect(result).toContain('speed = 0.1')
      expect(result).toContain('.out()')
    })

    it('returns unchanged if no .out() found', () => {
      const code = 'osc(10).color(1, 0.5, 0.3)'
      expect(audioizeHydraCode(code)).toBe(code)
    })

    it('returns unchanged when no matching .out(target)', () => {
      // render(o2) but only .out(o0) and .out(o1) present
      const code = 'osc(10).out(o0)\nnoise(5).out(o1)\nrender(o2)'
      expect(audioizeHydraCode(code)).toBe(code)
    })

    it('does not double-inject (already-audioized code)', () => {
      const code = 'osc(10)\n  .modulate(osc(3, 0.05), () => a.fft[0] * 0.25)\n  .out()'
      expect(audioizeHydraCode(code)).toBe(code)
    })

    it('is idempotent (audioize(audioize(code)) === audioize(code))', () => {
      const code = 'osc(10)\n  .out()'
      const once = audioizeHydraCode(code)
      const twice = audioizeHydraCode(once)
      expect(twice).toBe(once)
    })
  })

  describe('skip regions', () => {
    it('.out() in // comment is ignored', () => {
      const code = '// .out()\nosc(10).out()'
      const result = audioizeHydraCode(code)
      // Should inject before the real .out(), not the comment one
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      // The comment should be preserved
      expect(result).toContain('// .out()')
    })

    it('.out() in /* block */ comment is ignored', () => {
      const code = '/* .out() */\nosc(10).out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      expect(result).toContain('/* .out() */')
    })

    it('.out() in single-quoted string is ignored', () => {
      const code = 'var x = \'.out()\'\nosc(10).out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
    })

    it('.out() in double-quoted string is ignored', () => {
      const code = 'var x = ".out()"\nosc(10).out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
    })

    it('.out() in template literal is ignored', () => {
      const code = 'var x = `.out()`\nosc(10).out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
    })

    it('.out() in string with escaped quotes is ignored', () => {
      const code = 'var x = "foo \\" .out() \\""\nosc(10).out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
    })

    it('render() in string literal is ignored', () => {
      const code = 'var x = "render(o2)"\nosc(10).out(o0)\nnoise(5).out(o1)'
      const result = audioizeHydraCode(code)
      // render(o2) is in string → target should be o0 (default)
      const modIdx = result.indexOf('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
      const outO0Idx = result.indexOf('.out(o0)')
      expect(modIdx).toBeGreaterThan(-1)
      expect(modIdx).toBeLessThan(outO0Idx)
    })

    it('comments are preserved in output', () => {
      const code = '// my comment\nosc(10)\n  .out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('// my comment')
    })

    it('string literals are preserved in output', () => {
      const code = 'var x = "hello world"\nosc(10).out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('"hello world"')
    })
  })

  describe('unterminated literal/comment bailout', () => {
    it('unterminated double-quote string → returns unchanged', () => {
      const code = 'osc(10).out()\nvar x = "unterminated'
      const { hasUnterminated } = getSkipRegions(code)
      expect(hasUnterminated).toBe(true)
      expect(audioizeHydraCode(code)).toBe(code)
    })

    it('unterminated block comment → returns unchanged', () => {
      const code = 'osc(10).out()\n/* unterminated'
      const { hasUnterminated } = getSkipRegions(code)
      expect(hasUnterminated).toBe(true)
      expect(audioizeHydraCode(code)).toBe(code)
    })

    it('unterminated backtick → returns unchanged', () => {
      const code = 'osc(10).out()\nvar x = `unterminated'
      const { hasUnterminated } = getSkipRegions(code)
      expect(hasUnterminated).toBe(true)
      expect(audioizeHydraCode(code)).toBe(code)
    })

    it('line comment at EOF (no trailing newline) → hasUnterminated=false', () => {
      const code = 'osc(10).out()\n// end'
      const { hasUnterminated } = getSkipRegions(code)
      expect(hasUnterminated).toBe(false)
    })
  })

  describe('template literal opaque policy', () => {
    it('.out() inside ${} within template literal is skipped', () => {
      // Only .out() is inside template literal — no injection target outside
      const code = 'var x = `${something.out()}`'
      expect(audioizeHydraCode(code)).toBe(code)
    })

    it('template literal with ${expr} containing .out() → returns unchanged', () => {
      const code = 'var x = `result: ${osc(10).out()}`\nosc(5).out()'
      const result = audioizeHydraCode(code)
      // The real .out() outside the template should still be found
      expect(result).toContain('.modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')
    })
  })

  describe('default injection chain', () => {
    it('camera preset gets full 4-line chain', () => {
      const code = 's0.initCam()\nsrc(s0).out(o0)'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05)')
      expect(result).toContain('.rotate(')
      expect(result).toContain('.scale(')
      expect(result).toContain('.color(')
    })

    it('feedback preset gets full 4-line chain', () => {
      const code = 'src(o0).modulate(o0, 0.01).out(o0)'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05)')
      expect(result).toContain('.rotate(')
      expect(result).toContain('.scale(')
      expect(result).toContain('.color(')
    })

    it('kaleid preset gets full 4-line chain', () => {
      const code = 'osc(10).kaleid(4).out()'
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05)')
      expect(result).toContain('.rotate(')
      expect(result).toContain('.scale(')
      expect(result).toContain('.color(')
    })

    it('default chain is idempotent', () => {
      const codes = [
        's0.initCam()\nsrc(s0).out(o0)',
        'src(o0).modulate(o0, 0.01).out(o0)',
        'osc(10).kaleid(4).out()',
        'osc(10).out()',
      ]
      for (const code of codes) {
        const once = audioizeHydraCode(code)
        const twice = audioizeHydraCode(once)
        expect(twice).toBe(once)
      }
    })
  })

  describe('nested .out() handling', () => {
    it('does NOT inject before .out(o0) nested inside .layer()', () => {
      // flor_1 pattern: .out(o0) is inside .layer() at depth > 0
      const code = 's0.initCam()\nsrc(s0).saturate(2).contrast(1.3).layer(src(o0).mask(shape(4,2)).modulate(o0,0.001).out(o0))'
      const result = audioizeHydraCode(code)
      // Nested .out(o0) inside .layer() must be preserved intact
      expect(result).toContain('.layer(src(o0).mask(shape(4,2)).modulate(o0,0.001).out(o0))')
      // Instead, injection is appended with a new top-level .out()
      expect(result).toContain('.modulate(osc(3, 0.05)')
      expect(result.endsWith('.out(o0)\n')).toBe(true)
    })

    it('flor_1 gets default chain', () => {
      const florIdx = HYDRA_GALLERY.findIndex(g => g.sketch_id === 'flor_1')
      expect(florIdx).toBeGreaterThan(-1)
      const code = getPresetByIndex(florIdx)
      const result = audioizeHydraCode(code)
      expect(result).toContain('.modulate(osc(3, 0.05)')
      expect(result).toContain('.rotate(')
      expect(result).toContain('.scale(')
      expect(result).toContain('.color(')
    })
  })

  describe('gallery contract', () => {
    it('all presets: audioized code contains .out(', () => {
      for (let i = 0; i < getPresetCount(); i++) {
        const code = getPresetByIndex(i)
        const result = audioizeHydraCode(code)
        expect(result, `Preset ${i} (${HYDRA_GALLERY[i].sketch_id}) missing .out( after audioize`).toContain('.out(')
      }
    })

    it('presets with audio usage are returned unchanged', () => {
      let audioCount = 0
      for (let i = 0; i < getPresetCount(); i++) {
        const code = getPresetByIndex(i)
        const { regions } = getSkipRegions(code)
        if (hasAudioUsage(code, regions)) {
          expect(audioizeHydraCode(code)).toBe(code)
          audioCount++
        }
      }
      expect(audioCount).toBeGreaterThan(0)
    })

    it('presets without audio usage get audio injection (length increases)', () => {
      let nonAudioCount = 0
      for (let i = 0; i < getPresetCount(); i++) {
        const code = getPresetByIndex(i)
        const { regions } = getSkipRegions(code)
        if (!hasAudioUsage(code, regions)) {
          const result = audioizeHydraCode(code)
          expect(result.length, `Preset ${i} (${HYDRA_GALLERY[i].sketch_id}) should grow`).toBeGreaterThan(code.length)
          nonAudioCount++
        }
      }
      expect(nonAudioCount).toBeGreaterThan(0)
    })

    it('count of audio presets > 0 and < total (sanity)', () => {
      let audioCount = 0
      const total = getPresetCount()
      for (let i = 0; i < total; i++) {
        const code = getPresetByIndex(i)
        const { regions } = getSkipRegions(code)
        if (hasAudioUsage(code, regions)) audioCount++
      }
      expect(audioCount).toBeGreaterThan(0)
      expect(audioCount).toBeLessThan(total)
    })

    it('every preset with render(oX) has a matching .out(oX)', () => {
      const renderRe = /render\s*\(\s*(o[0-3])\s*\)/g
      const outRe = /\.out\s*\(\s*(o[0-3])?\s*\)/g

      for (let i = 0; i < getPresetCount(); i++) {
        const code = getPresetByIndex(i)
        const { regions } = getSkipRegions(code)

        // Find render targets outside skip regions
        let m: RegExpExecArray | null
        const renderTargets = new Set<string>()
        const re1 = new RegExp(renderRe.source, 'g')
        while ((m = re1.exec(code)) !== null) {
          if (!regions.some(r => m!.index >= r.start && m!.index < r.end)) {
            renderTargets.add(m[1])
          }
        }

        // Find out targets outside skip regions
        const outTargets = new Set<string>()
        const re2 = new RegExp(outRe.source, 'g')
        while ((m = re2.exec(code)) !== null) {
          if (!regions.some(r => m!.index >= r.start && m!.index < r.end)) {
            outTargets.add(m[1] ?? 'o0')
          }
        }

        for (const target of renderTargets) {
          expect(outTargets.has(target), `Preset ${i} (${HYDRA_GALLERY[i].sketch_id}): render(${target}) but no .out(${target})`).toBe(true)
        }
      }
    })

    it('no preset has .out() or render() inside string literals', () => {
      for (let i = 0; i < getPresetCount(); i++) {
        const code = getPresetByIndex(i)
        const { regions } = getSkipRegions(code)

        // Check .out() and render() are NOT inside skip regions (strings/comments)
        const patterns = [/\.out\s*\(/g, /render\s*\(/g]
        for (const pat of patterns) {
          const re = new RegExp(pat.source, 'g')
          let m: RegExpExecArray | null
          while ((m = re.exec(code)) !== null) {
            const inSkip = regions.some(r => m!.index >= r.start && m!.index < r.end)
            // Allow in comments (that's fine), but not in string literals
            // Comments start with // or /*, strings start with quotes
            if (inSkip) {
              const regionStart = code[regions.find(r => m!.index >= r.start && m!.index < r.end)!.start]
              const isComment = regionStart === '/'
              expect(isComment, `Preset ${i} (${HYDRA_GALLERY[i].sketch_id}): ${pat.source} inside string literal`).toBe(true)
            }
          }
        }
      }
    })

    it('every preset decodes to non-empty code containing .out(', () => {
      for (let i = 0; i < HYDRA_GALLERY.length; i++) {
        const code = decodeSketch(HYDRA_GALLERY[i])
        expect(code.length, `Preset ${i} (${HYDRA_GALLERY[i].sketch_id}) decoded empty`).toBeGreaterThan(0)
        expect(code, `Preset ${i} (${HYDRA_GALLERY[i].sketch_id}) missing .out(`).toContain('.out(')
      }
    })
  })
})
