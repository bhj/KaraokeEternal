import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import KnobPanel, { type KnobParam } from './KnobPanel'
import styles from './PatchBay.css'

// --- Module definitions ---

type ModuleCategory = 'source' | 'transform' | 'combiner' | 'color' | 'audio' | 'output'

interface ModuleDef {
  type: string
  category: ModuleCategory
  params: { key: string, label: string, min: number, max: number, step?: number, default: number }[]
}

const MODULE_DEFS: ModuleDef[] = [
  // Sources
  { type: 'osc', category: 'source', params: [
    { key: 'freq', label: 'Freq', min: 0.1, max: 100, step: 0.1, default: 20 },
    { key: 'sync', label: 'Sync', min: 0, max: 1, step: 0.01, default: 0.1 },
    { key: 'offset', label: 'Offset', min: 0, max: 2, step: 0.01, default: 0 },
  ] },
  { type: 'noise', category: 'source', params: [
    { key: 'scale', label: 'Scale', min: 1, max: 100, step: 1, default: 10 },
    { key: 'offset', label: 'Offset', min: 0, max: 1, step: 0.01, default: 0.1 },
  ] },
  { type: 'voronoi', category: 'source', params: [
    { key: 'scale', label: 'Scale', min: 1, max: 50, step: 1, default: 5 },
    { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01, default: 0.3 },
    { key: 'blending', label: 'Blend', min: 0, max: 1, step: 0.01, default: 0.3 },
  ] },
  { type: 'shape', category: 'source', params: [
    { key: 'sides', label: 'Sides', min: 2, max: 12, step: 1, default: 3 },
    { key: 'radius', label: 'Radius', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'smoothing', label: 'Smooth', min: 0, max: 1, step: 0.01, default: 0.01 },
  ] },
  { type: 'gradient', category: 'source', params: [
    { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01, default: 0 },
  ] },
  // Transforms
  { type: 'rotate', category: 'transform', params: [
    { key: 'angle', label: 'Angle', min: -3.14, max: 3.14, step: 0.01, default: 0.5 },
    { key: 'speed', label: 'Speed', min: 0, max: 1, step: 0.01, default: 0 },
  ] },
  { type: 'scale', category: 'transform', params: [
    { key: 'amount', label: 'Amount', min: 0.1, max: 5, step: 0.01, default: 1 },
  ] },
  { type: 'kaleid', category: 'transform', params: [
    { key: 'sides', label: 'Sides', min: 1, max: 12, step: 1, default: 4 },
  ] },
  { type: 'repeat', category: 'transform', params: [
    { key: 'x', label: 'X', min: 1, max: 10, step: 1, default: 3 },
    { key: 'y', label: 'Y', min: 1, max: 10, step: 1, default: 3 },
  ] },
  { type: 'pixelate', category: 'transform', params: [
    { key: 'x', label: 'X', min: 1, max: 100, step: 1, default: 20 },
    { key: 'y', label: 'Y', min: 1, max: 100, step: 1, default: 20 },
  ] },
  { type: 'scrollX', category: 'transform', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'speed', label: 'Speed', min: 0, max: 1, step: 0.01, default: 0 },
  ] },
  { type: 'scrollY', category: 'transform', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'speed', label: 'Speed', min: 0, max: 1, step: 0.01, default: 0 },
  ] },
  // Combiners (require a second source — compiled inline)
  { type: 'modulate', category: 'combiner', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.1 },
  ] },
  { type: 'blend', category: 'combiner', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
  ] },
  { type: 'add', category: 'combiner', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
  ] },
  { type: 'diff', category: 'combiner', params: [] },
  { type: 'mult', category: 'combiner', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
  ] },
  { type: 'modulateRotate', category: 'combiner', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 3.14, step: 0.01, default: 1 },
  ] },
  { type: 'modulateScale', category: 'combiner', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 1 },
  ] },
  // Color
  { type: 'color', category: 'color', params: [
    { key: 'r', label: 'R', min: 0, max: 2, step: 0.01, default: 1 },
    { key: 'g', label: 'G', min: 0, max: 2, step: 0.01, default: 0.5 },
    { key: 'b', label: 'B', min: 0, max: 2, step: 0.01, default: 0.5 },
  ] },
  { type: 'saturate', category: 'color', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 4, step: 0.01, default: 2 },
  ] },
  { type: 'colorama', category: 'color', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.005 },
  ] },
  { type: 'hue', category: 'color', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 2, step: 0.01, default: 0.4 },
  ] },
  { type: 'brightness', category: 'color', params: [
    { key: 'amount', label: 'Amount', min: -1, max: 2, step: 0.01, default: 0.4 },
  ] },
  { type: 'invert', category: 'color', params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 1 },
  ] },
]

const AUDIO_INPUTS = ['bass', 'mid', 'treble', 'beat', 'energy', 'bpm', 'bright']

const CATEGORY_COLORS: Record<ModuleCategory, string> = {
  source: '#2d6a4f',
  transform: '#1d3557',
  combiner: '#5a189a',
  color: '#bc4b1e',
  audio: '#d4a017',
  output: '#9d0208',
}

// --- Node state ---

interface PatchNode {
  id: string
  type: string
  category: ModuleCategory
  params: Record<string, number>
  audioMod: Record<string, string | null> // param key → audio input name
  x: number
  y: number
}

interface PatchConnection {
  fromId: string
  toId: string
}

let nextNodeId = 0

function createNode (def: ModuleDef, x: number, y: number): PatchNode {
  const params: Record<string, number> = {}
  for (const p of def.params) {
    params[p.key] = p.default
  }
  return {
    id: `node_${nextNodeId++}`,
    type: def.type,
    category: def.category,
    params,
    audioMod: {},
    x,
    y,
  }
}

// --- Code generation ---

function compileToHydra (nodes: PatchNode[], connections: PatchConnection[]): string {
  // Build adjacency: find the chain from source → transforms/colors/combiners → out
  // Simple linear chain for v1: first source node → chained transforms/colors → .out()
  if (nodes.length === 0) return ''

  // Find nodes in connection order
  const connectedFrom = new Map<string, string>() // toId → fromId
  for (const c of connections) {
    connectedFrom.set(c.toId, c.fromId)
  }

  // Find the end of the chain (a node that is fromId but not toId, or has no outgoing)
  const toIds = new Set(connections.map(c => c.toId))
  const fromIds = new Set(connections.map(c => c.fromId))

  // Find terminal node (in fromIds but not in toIds → it's the start)
  // Actually, find the start: a node that is in fromIds but never in toIds
  let startId: string | null = null
  for (const id of fromIds) {
    if (!toIds.has(id)) {
      startId = id
      break
    }
  }

  // If no connections, just compile standalone nodes
  if (!startId && nodes.length > 0) {
    // Use the first source node
    const sourceNode = nodes.find(n => n.category === 'source')
    if (!sourceNode) return ''
    return compileNode(sourceNode) + '\n  .out()'
  }

  if (!startId) return ''

  // Walk the chain
  const chain: PatchNode[] = []
  let currentId: string | null = startId
  const visited = new Set<string>()

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const node = nodes.find(n => n.id === currentId)
    if (node) chain.push(node)

    // Find next node connected from this one
    const next = connections.find(c => c.fromId === currentId)
    currentId = next ? next.toId : null
  }

  if (chain.length === 0) return ''

  // First node must be a source
  const first = chain[0]
  if (first.category !== 'source') return '// First node must be a source'

  let code = compileNode(first)

  for (let i = 1; i < chain.length; i++) {
    const node = chain[i]
    if (node.category === 'combiner') {
      // Combiners take a source as first arg — use noise() as default modulator
      const paramStr = compileParams(node)
      code += `\n  .${node.type}(noise(3)${paramStr ? ', ' + paramStr : ''})`
    } else {
      const paramStr = compileParams(node)
      code += `\n  .${node.type}(${paramStr})`
    }
  }

  code += '\n  .out()'
  return code
}

function compileNode (node: PatchNode): string {
  const paramStr = compileParams(node)
  return `${node.type}(${paramStr})`
}

function compileParams (node: PatchNode): string {
  const def = MODULE_DEFS.find(d => d.type === node.type)
  if (!def) return ''

  return def.params.map(p => {
    const audioInput = node.audioMod[p.key]
    if (audioInput) {
      return `() => ${audioInput}() * ${node.params[p.key].toFixed(2)}`
    }
    return node.params[p.key].toString()
  }).join(', ')
}

// --- Component ---

interface PatchBayProps {
  onCodeChange: (code: string) => void
}

function PatchBay ({ onCodeChange }: PatchBayProps) {
  const [nodes, setNodes] = useState<PatchNode[]>([])
  const [connections, setConnections] = useState<PatchConnection[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory>('source')
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ nodeId: string, offsetX: number, offsetY: number } | null>(null)

  // Compile and emit code whenever nodes/connections change
  const compiledCode = useMemo(() => compileToHydra(nodes, connections), [nodes, connections])

  useEffect(() => {
    if (compiledCode) {
      onCodeChange(compiledCode)
    }
  }, [compiledCode, onCodeChange])

  const handleAddModule = useCallback((def: ModuleDef) => {
    const canvas = canvasRef.current
    const x = canvas ? canvas.scrollLeft + 200 : 200
    const y = canvas ? canvas.scrollTop + 100 + Math.random() * 200 : 200
    setNodes(prev => [...prev, createNode(def, x, y)])
  }, [])

  const handleRemoveNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setConnections(prev => prev.filter(c => c.fromId !== id && c.toId !== id))
  }, [])

  const handleParamChange = useCallback((nodeId: string, key: string, value: number) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, params: { ...n.params, [key]: value } } : n
    ))
  }, [])

  const handleAudioModToggle = useCallback((nodeId: string, paramKey: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n
      const currentMod = n.audioMod[paramKey]
      // Cycle through: null → bass → mid → treble → beat → energy → bpm → bright → null
      const idx = currentMod ? AUDIO_INPUTS.indexOf(currentMod) : -1
      const nextIdx = idx + 1
      const nextMod = nextIdx < AUDIO_INPUTS.length ? AUDIO_INPUTS[nextIdx] : null
      return { ...n, audioMod: { ...n.audioMod, [paramKey]: nextMod } }
    }))
  }, [])

  const handleOutputClick = useCallback((nodeId: string) => {
    if (connectingFrom === null) {
      setConnectingFrom(nodeId)
    }
  }, [connectingFrom])

  const handleInputClick = useCallback((nodeId: string) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      // Don't create duplicate connections
      setConnections(prev => {
        if (prev.some(c => c.fromId === connectingFrom && c.toId === nodeId)) return prev
        return [...prev, { fromId: connectingFrom, toId: nodeId }]
      })
    }
    setConnectingFrom(null)
  }, [connectingFrom])

  const handleRemoveConnection = useCallback((fromId: string, toId: string) => {
    setConnections(prev => prev.filter(c => !(c.fromId === fromId && c.toId === toId)))
  }, [])

  // Node dragging
  const handleNodePointerDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    dragRef.current = {
      nodeId,
      offsetX: e.clientX - node.x,
      offsetY: e.clientY - node.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [nodes])

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const { nodeId, offsetX, offsetY } = dragRef.current
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, x: e.clientX - offsetX, y: e.clientY - offsetY } : n
    ))
  }, [])

  const handleCanvasPointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const filteredModules = MODULE_DEFS.filter(d => d.category === selectedCategory)

  return (
    <div className={styles.container}>
      {/* Module palette */}
      <div className={styles.palette}>
        <div className={styles.categoryTabs}>
          {(Object.keys(CATEGORY_COLORS) as ModuleCategory[])
            .filter(c => c !== 'audio' && c !== 'output')
            .map(cat => (
              <button
                key={cat}
                className={`${styles.categoryTab} ${selectedCategory === cat ? styles.active : ''}`}
                style={{ borderBottomColor: selectedCategory === cat ? CATEGORY_COLORS[cat] : 'transparent' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
        </div>
        <div className={styles.moduleList}>
          {filteredModules.map(def => (
            <button
              key={def.type}
              className={styles.moduleButton}
              style={{ borderLeftColor: CATEGORY_COLORS[def.category] }}
              onClick={() => handleAddModule(def)}
            >
              {def.type}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className={styles.canvas}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onClick={() => setConnectingFrom(null)}
      >
        {/* Connection lines */}
        <svg className={styles.connectionsSvg}>
          {connections.map(c => {
            const fromNode = nodes.find(n => n.id === c.fromId)
            const toNode = nodes.find(n => n.id === c.toId)
            if (!fromNode || !toNode) return null
            const x1 = fromNode.x + 170
            const y1 = fromNode.y + 30
            const x2 = toNode.x
            const y2 = toNode.y + 30
            const cx = (x1 + x2) / 2
            return (
              <g key={`${c.fromId}-${c.toId}`}>
                <path
                  d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                  stroke='#0ff'
                  strokeWidth={2}
                  fill='none'
                  opacity={0.6}
                />
                <path
                  d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                  stroke='transparent'
                  strokeWidth={12}
                  fill='none'
                  style={{ cursor: 'pointer' }}
                  onContextMenu={e => { e.preventDefault(); handleRemoveConnection(c.fromId, c.toId) }}
                />
              </g>
            )
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const def = MODULE_DEFS.find(d => d.type === node.type)
          if (!def) return null
          const knobParams: KnobParam[] = def.params.map(p => ({
            key: p.key,
            label: p.label,
            value: node.params[p.key],
            min: p.min,
            max: p.max,
            step: p.step,
            color: node.audioMod[p.key] ? '#d4a017' : '#0ff',
          }))

          return (
            <div
              key={node.id}
              className={styles.node}
              style={{ left: node.x, top: node.y }}
            >
              <div
                className={styles.nodeHeader}
                style={{ background: CATEGORY_COLORS[node.category] }}
                onPointerDown={e => handleNodePointerDown(e, node.id)}
              >
                {/* Input jack */}
                {node.category !== 'source' && (
                  <div
                    className={`${styles.jack} ${styles.inputJack}`}
                    onClick={e => { e.stopPropagation(); handleInputClick(node.id) }}
                  />
                )}
                <span className={styles.nodeType}>{node.type}</span>
                <button
                  className={styles.removeNode}
                  onClick={e => { e.stopPropagation(); handleRemoveNode(node.id) }}
                >
                  x
                </button>
                {/* Output jack */}
                <div
                  className={`${styles.jack} ${styles.outputJack} ${connectingFrom === node.id ? styles.jackActive : ''}`}
                  onClick={e => { e.stopPropagation(); handleOutputClick(node.id) }}
                />
              </div>
              {knobParams.length > 0 && (
                <KnobPanel
                  title=''
                  params={knobParams}
                  onChange={(key, value) => handleParamChange(node.id, key, value)}
                />
              )}
              {/* Audio mod toggles */}
              {def.params.length > 0 && (
                <div className={styles.audioModRow}>
                  {def.params.map(p => (
                    <button
                      key={p.key}
                      className={`${styles.audioModButton} ${node.audioMod[p.key] ? styles.audioModActive : ''}`}
                      onClick={() => handleAudioModToggle(node.id, p.key)}
                      title={node.audioMod[p.key] ? `${p.label}: ${node.audioMod[p.key]}()` : `${p.label}: static`}
                    >
                      {node.audioMod[p.key] ?? p.label[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {connectingFrom && (
          <div className={styles.connectingHint}>Click an input jack to connect</div>
        )}
      </div>
    </div>
  )
}

export default PatchBay
