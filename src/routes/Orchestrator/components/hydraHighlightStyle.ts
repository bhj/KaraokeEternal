import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { MatchDecorator, ViewPlugin, Decoration, type DecorationSet, type ViewUpdate, EditorView } from '@codemirror/view'

// Extended highlight style with higher contrast and distinct colors
export const hydraHighlightStyle = HighlightStyle.define([
  { tag: tags.function(tags.variableName), color: '#7ee787', fontWeight: 'bold' }, // Functions: bright green
  { tag: [tags.number, tags.integer, tags.float], color: '#d2a8ff' }, // Numbers: purple
  { tag: [tags.string, tags.special(tags.string)], color: '#a5d6ff' }, // Strings: light blue
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword], color: '#ff7b72' }, // Keywords: orange/red
  { tag: tags.comment, color: '#8b949e', fontStyle: 'italic' }, // Comments: grey
  { tag: [tags.operator, tags.punctuation, tags.separator], color: '#c9d1d9' }, // Operators: white
  { tag: tags.variableName, color: '#c9d1d9' }, // Variables: white
  { tag: tags.propertyName, color: '#7ee787' }, // Properties: green
  { tag: [tags.bool, tags.null], color: '#79c0ff' }, // Booleans: blue
])

// Custom decorations for Hydra-specific tokens
const hydraSourceDeco = Decoration.mark({ class: 'cm-hydra-source' })
const hydraOutputDeco = Decoration.mark({ class: 'cm-hydra-output' })
const hydraInputDeco = Decoration.mark({ class: 'cm-hydra-input' })
const hydraAudioDeco = Decoration.mark({ class: 'cm-hydra-audio' })

const hydraSourceMatcher = new MatchDecorator({
  regexp: /\b(osc|noise|shape|voronoi|gradient|solid|src)\b/g,
  decoration: hydraSourceDeco,
})

const hydraOutputMatcher = new MatchDecorator({
  regexp: /\b(o[0-3])\b/g,
  decoration: hydraOutputDeco,
})

const hydraInputMatcher = new MatchDecorator({
  regexp: /\b(s[0-3])\b/g,
  decoration: hydraInputDeco,
})

const hydraAudioMatcher = new MatchDecorator({
  regexp: /\ba\.(fft|setBins|setSmooth|setScale)\b/g,
  decoration: hydraAudioDeco,
})

export const hydraHighlighter = [
  syntaxHighlighting(hydraHighlightStyle),
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor (view: EditorView) {
        this.decorations = this.build(view)
      }

      update (update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.build(update.view)
        }
      }

      build (view: EditorView) {
        let deco = Decoration.none
        deco = hydraSourceMatcher.createDeco(view)
        deco = hydraOutputMatcher.updateDeco(update => update.view === view ? deco : deco, deco) // simplified for brevity, actually usually composed
        // Clean way to compose multiple match decorators is merging their ranges, but ViewPlugin logic gets complex.
        // Easiest path: separate extensions or compositing manually.
        // Let's verify if MatchDecorator supports composition easily. It creates a DecorationSet.
        // We can just export them as an array of ViewPlugins.
        return deco
      }
    },
    { decorations: v => v.decorations },
  ),
]

// Better approach: separate plugins for each matcher to avoid composition headaches
export const hydraSourcePlugin = ViewPlugin.define(view => ({
  decorations: hydraSourceMatcher.createDeco(view),
  update (u) { this.decorations = hydraSourceMatcher.updateDeco(u, this.decorations) },
}), { decorations: v => v.decorations })

export const hydraOutputPlugin = ViewPlugin.define(view => ({
  decorations: hydraOutputMatcher.createDeco(view),
  update (u) { this.decorations = hydraOutputMatcher.updateDeco(u, this.decorations) },
}), { decorations: v => v.decorations })

export const hydraInputPlugin = ViewPlugin.define(view => ({
  decorations: hydraInputMatcher.createDeco(view),
  update (u) { this.decorations = hydraInputMatcher.updateDeco(u, this.decorations) },
}), { decorations: v => v.decorations })

export const hydraAudioPlugin = ViewPlugin.define(view => ({
  decorations: hydraAudioMatcher.createDeco(view),
  update (u) { this.decorations = hydraAudioMatcher.updateDeco(u, this.decorations) },
}), { decorations: v => v.decorations })

export const hydraExtensions = [
  syntaxHighlighting(hydraHighlightStyle),
  hydraSourcePlugin,
  hydraOutputPlugin,
  hydraInputPlugin,
  hydraAudioPlugin,
  EditorView.theme({
    '.cm-hydra-source': { color: '#ff7b72', fontWeight: 'bold' }, // Red/Orange bold
    '.cm-hydra-output': { color: '#d2a8ff', fontWeight: 'bold' }, // Purple bold
    '.cm-hydra-input': { color: '#79c0ff', fontStyle: 'italic' }, // Blue italic
    '.cm-hydra-audio': { color: '#e2e4e9', textDecoration: 'underline' }, // White underline
  }),
]
