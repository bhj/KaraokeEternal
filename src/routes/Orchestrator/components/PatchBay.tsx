import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import KnobPanel, { type KnobParam } from './KnobPanel'
import styles from './PatchBay.css'

// --- Module definitions ---

type ModuleCategory = 'source' | 'transform' | 'combiner' | 'color' | 'audio' | 'output'

interface ModuleDef {
  type: string
  category: ModuleCategory
  inputs: string[] // Named input ports
  params: { key: string, label: string, min: number, max: number, step?: number, default: number }[]
}

const MODULE_DEFS: ModuleDef[] = [
  // Sources
  { type: 'osc', category: 'source', inputs: [], params: [
    { key: 'freq', label: 'Freq', min: 0.1, max: 100, step: 0.1, default: 20 },
    { key: 'sync', label: 'Sync', min: 0, max: 1, step: 0.01, default: 0.1 },
    { key: 'offset', label: 'Offset', min: 0, max: 2, step: 0.01, default: 0 },
  ] },
  { type: 'noise', category: 'source', inputs: [], params: [
    { key: 'scale', label: 'Scale', min: 1, max: 100, step: 1, default: 10 },
    { key: 'offset', label: 'Offset', min: 0, max: 1, step: 0.01, default: 0.1 },
  ] },
  { type: 'voronoi', category: 'source', inputs: [], params: [
    { key: 'scale', label: 'Scale', min: 1, max: 50, step: 1, default: 5 },
    { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01, default: 0.3 },
    { key: 'blending', label: 'Blend', min: 0, max: 1, step: 0.01, default: 0.3 },
  ] },
  { type: 'shape', category: 'source', inputs: [], params: [
    { key: 'sides', label: 'Sides', min: 2, max: 12, step: 1, default: 3 },
    { key: 'radius', label: 'Radius', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'smoothing', label: 'Smooth', min: 0, max: 1, step: 0.01, default: 0.01 },
  ] },
  { type: 'gradient', category: 'source', inputs: [], params: [
    { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01, default: 0 },
  ] },
  // Transforms (1 input)
  { type: 'rotate', category: 'transform', inputs: ['in'], params: [
    { key: 'angle', label: 'Angle', min: -3.14, max: 3.14, step: 0.01, default: 0.5 },
    { key: 'speed', label: 'Speed', min: 0, max: 1, step: 0.01, default: 0 },
  ] },
  { type: 'scale', category: 'transform', inputs: ['in'], params: [
    { key: 'amount', label: 'Amount', min: 0.1, max: 5, step: 0.01, default: 1 },
  ] },
  { type: 'kaleid', category: 'transform', inputs: ['in'], params: [
    { key: 'sides', label: 'Sides', min: 1, max: 12, step: 1, default: 4 },
  ] },
  { type: 'repeat', category: 'transform', inputs: ['in'], params: [
    { key: 'x', label: 'X', min: 1, max: 10, step: 1, default: 3 },
    { key: 'y', label: 'Y', min: 1, max: 10, step: 1, default: 3 },
  ] },
  { type: 'pixelate', category: 'transform', inputs: ['in'], params: [
    { key: 'x', label: 'X', min: 1, max: 100, step: 1, default: 20 },
    { key: 'y', label: 'Y', min: 1, max: 100, step: 1, default: 20 },
  ] },
  { type: 'scrollX', category: 'transform', inputs: ['in'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'speed', label: 'Speed', min: 0, max: 1, step: 0.01, default: 0 },
  ] },
  { type: 'scrollY', category: 'transform', inputs: ['in'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'speed', label: 'Speed', min: 0, max: 1, step: 0.01, default: 0 },
  ] },
  // Combiners (2 inputs)
  { type: 'modulate', category: 'combiner', inputs: ['in', 'mod'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.1 },
  ] },
  { type: 'blend', category: 'combiner', inputs: ['in', 'blend'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
  ] },
  { type: 'add', category: 'combiner', inputs: ['in', 'add'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
  ] },
  { type: 'diff', category: 'combiner', inputs: ['in', 'diff'], params: [] },
  { type: 'mult', category: 'combiner', inputs: ['in', 'mult'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.5 },
  ] },
  { type: 'modulateRotate', category: 'combiner', inputs: ['in', 'mod'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 3.14, step: 0.01, default: 1 },
  ] },
  { type: 'modulateScale', category: 'combiner', inputs: ['in', 'mod'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 1 },
  ] },
  // Color (1 input)
  { type: 'color', category: 'color', inputs: ['in'], params: [
    { key: 'r', label: 'R', min: 0, max: 2, step: 0.01, default: 1 },
    { key: 'g', label: 'G', min: 0, max: 2, step: 0.01, default: 0.5 },
    { key: 'b', label: 'B', min: 0, max: 2, step: 0.01, default: 0.5 },
  ] },
  { type: 'saturate', category: 'color', inputs: ['in'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 4, step: 0.01, default: 2 },
  ] },
  { type: 'colorama', category: 'color', inputs: ['in'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.005 },
  ] },
  { type: 'hue', category: 'color', inputs: ['in'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 2, step: 0.01, default: 0.4 },
  ] },
  { type: 'brightness', category: 'color', inputs: ['in'], params: [
    { key: 'amount', label: 'Amount', min: -1, max: 2, step: 0.01, default: 0.4 },
  ] },
  { type: 'invert', category: 'color', inputs: ['in'], params: [
    { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 1 },
  ] },
  // Output
  { type: 'out', category: 'output', inputs: ['in'], params: [] },
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
  toPort: string // 'in' (main), 'mod', 'blend', etc.
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

// --- Code generation (Recursive) ---

function compileToHydra (nodes: PatchNode[], connections: PatchConnection[]): string {
  // Find the 'out' node
  const outNode = nodes.find(n => n.type === 'out')
  if (!outNode) return ''

  // Set of visited nodes to detect cycles (simple linear check)
  const visited = new Set<string>()

  function compileNode (nodeId: string): string {
    if (visited.has(nodeId)) return 'src(o0)' // Feedback loop protection (basic)
    visited.add(nodeId)

    const node = nodes.find(n => n.id === nodeId)
    if (!node) return ''

    // Generate params string
    const def = MODULE_DEFS.find(d => d.type === node.type)
    const paramStr = def ? def.params.map(p => {
      const audioInput = node.audioMod[p.key]
      if (audioInput) {
        return `() => ${audioInput}() * ${node.params[p.key].toFixed(2)}`
      }
      return node.params[p.key].toString()
    }).join(', ') : ''

    // Source: Leaf node
    if (node.category === 'source') {
      visited.delete(nodeId)
      return `${node.type}(${paramStr})`
    }

    // Output: special handling
    if (node.category === 'output') {
      const inputConn = connections.find(c => c.toId === nodeId && c.toPort === 'in')
      if (inputConn) {
        const inputCode = compileNode(inputConn.fromId)
        visited.delete(nodeId)
        return `${inputCode}.out()`
      }
      visited.delete(nodeId)
      return ''
    }

    // Transform / Color: Chain off input
    if (node.category === 'transform' || node.category === 'color') {
      const inputConn = connections.find(c => c.toId === nodeId && c.toPort === 'in')
      // If no input, transform implies src(o0) or invalid. Hydra transforms need a source.
      const inputCode = inputConn ? compileNode(inputConn.fromId) : 'src(o0)'
      
      visited.delete(nodeId)
      return `${inputCode}.${node.type}(${paramStr})`
    }

    // Combiner: Chain off 'in', param is 'mod' connection
    if (node.category === 'combiner') {
      const inConn = connections.find(c => c.toId === nodeId && c.toPort === 'in')
      const modConn = connections.find(c => c.toId === nodeId && c.toPort !== 'in') // The 2nd input
      
      const inCode = inConn ? compileNode(inConn.fromId) : 'src(o0)'
      const modCode = modConn ? compileNode(modConn.fromId) : 'noise(2)' // Default noise if unconnected

      // Combiner signature: .blend(texture, amount)
      // modCode is the texture. paramStr is the amount.
      const args = paramStr ? `${modCode}, ${paramStr}` : modCode

      visited.delete(nodeId)
      return `${inCode}.${node.type}(${args})`
    }

    visited.delete(nodeId)
    return ''
  }

  // Find input to 'out'
  const finalCode = compileNode(outNode.id)
  return finalCode
}

// --- Component ---

interface PatchBayProps {
  onCodeChange: (code: string) => void
}

function PatchBay ({ onCodeChange }: PatchBayProps) {
  const [nodes, setNodes] = useState<PatchNode[]>([])
  const [connections, setConnections] = useState<PatchConnection[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory>('source')
  
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null) // nodeId
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ nodeId: string, offsetX: number, offsetY: number } | null>(null)

  // Initialize with an Output node if none exists
  useEffect(() => {
    setNodes(prev => {
      if (prev.some(n => n.type === 'out')) return prev
      return [...prev, createNode(MODULE_DEFS.find(d => d.type === 'out')!, 600, 300)]
    })
  }, [])

  const compiledCode = useMemo(() => compileToHydra(nodes, connections), [nodes, connections])

  useEffect(() => {
    if (compiledCode) {
      onCodeChange(compiledCode)
    }
  }, [compiledCode, onCodeChange])

  const handleAddModule = useCallback((def: ModuleDef) => {
    const canvas = canvasRef.current
    const x = canvas ? canvas.scrollLeft + 100 : 100
    const y = canvas ? canvas.scrollTop + 100 + Math.random() * 100 : 100
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
      const idx = currentMod ? AUDIO_INPUTS.indexOf(currentMod) : -1
      const nextIdx = idx + 1
      const nextMod = nextIdx < AUDIO_INPUTS.length ? AUDIO_INPUTS[nextIdx] : null
      return { ...n, audioMod: { ...n.audioMod, [paramKey]: nextMod } }
    }))
  }, [])

  // Start connection drag from Output jack
  const handleOutputClick = useCallback((nodeId: string) => {
    if (connectingFrom === null) {
      setConnectingFrom(nodeId)
    }
  }, [connectingFrom])

  // End connection drag on Input jack
  const handleInputClick = useCallback((nodeId: string, portName: string) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      setConnections(prev => {
        // Remove existing connection to this port (one input per port)
        const filtered = prev.filter(c => !(c.toId === nodeId && c.toPort === portName))
        // Prevent duplicates
        if (filtered.some(c => c.fromId === connectingFrom && c.toId === nodeId && c.toPort === portName)) return prev
        return [...filtered, { fromId: connectingFrom, toId: nodeId, toPort: portName }]
      })
    }
    setConnectingFrom(null)
  }, [connectingFrom])

  const handleRemoveConnection = useCallback((fromId: string, toId: string, toPort: string) => {
    setConnections(prev => prev.filter(c => !(c.fromId === fromId && c.toId === toId && c.toPort === toPort)))
  }, [])

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

  const filteredModules = MODULE_DEFS.filter(d => d.category === selectedCategory && d.type !== 'out')

  return (
    <div className={styles.container}>
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

      <div
        ref={canvasRef}
        className={styles.canvas}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onClick={() => setConnectingFrom(null)}
      >
        <svg className={styles.connectionsSvg}>
          {connections.map(c => {
            const fromNode = nodes.find(n => n.id === c.fromId)
            const toNode = nodes.find(n => n.id === c.toId)
            if (!fromNode || !toNode) return null
            
            // Calculate jack positions
            const x1 = fromNode.x + 180 // Right side
            const y1 = fromNode.y + 20
            
            // Destination jack depends on port index?
            // Simple visual approximation: 
            // Main 'in' is on left, 2nd input is on Top? Or just vertically stacked on left?
            const def = MODULE_DEFS.find(d => d.type === toNode.type)
            const portIdx = def?.inputs.indexOf(c.toPort) ?? 0
            
            const x2 = toNode.x
            const y2 = toNode.y + 20 + (portIdx * 20) // Stack ports vertically
            
            const cx = (x1 + x2) / 2
            return (
              <g key={`${c.fromId}-${c.toId}-${c.toPort}`}>
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
                  onContextMenu={e => { e.preventDefault(); handleRemoveConnection(c.fromId, c.toId, c.toPort) }}
                />
              </g>
            )
          })}
          {connectingFrom && (
            // Draw a dangling line from the connecting node to mouse? 
            // Too complex for V1 without mouse tracking state.
            // Just hint.
            null
          )}
        </svg>

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
              style={{ 
                left: node.x, 
                top: node.y,
                border: node.id === connectingFrom ? '2px solid #fff' : undefined 
              }}
            >
              <div
                className={styles.nodeHeader}
                style={{ background: CATEGORY_COLORS[node.category] }}
                onPointerDown={e => handleNodePointerDown(e, node.id)}
              >
                {/* Input Jacks */}
                <div className={styles.inputJacks}>
                  {def.inputs.map((portName, idx) => (
                    <div
                      key={portName}
                      className={`${styles.jack} ${styles.inputJack}`}
                      title={portName}
                      onClick={e => { e.stopPropagation(); handleInputClick(node.id, portName) }}
                    />
                  ))}
                </div>

                <span className={styles.nodeType}>{node.type}</span>
                
                {node.type !== 'out' && (
                  <button
                    className={styles.removeNode}
                    onClick={e => { e.stopPropagation(); handleRemoveNode(node.id) }}
                  >
                    x
                  </button>
                )}
                
                {/* Output Jack */}
                {node.category !== 'output' && (
                  <div
                    className={`${styles.jack} ${styles.outputJack}`}
                    onClick={e => { e.stopPropagation(); handleOutputClick(node.id) }}
                  />
                )}
              </div>
              
              {knobParams.length > 0 && (
                <KnobPanel
                  title=''
                  params={knobParams}
                  onChange={(key, value) => handleParamChange(node.id, key, value)}
                />
              )}
              
              {def.params.length > 0 && (
                <div className={styles.audioModRow}>
                  {def.params.map(p => (
                    <button
                      key={p.key}
                      className={`${styles.audioModButton} ${node.audioMod[p.key] ? styles.audioModActive : ''}`}
                      onClick={() => handleAudioModToggle(node.id, p.key)}
                      title={p.key}
                    >
                      {p.label[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {connectingFrom && (
          <div className={styles.connectingHint}>Select destination input port</div>
        )}
      </div>
    </div>
  )
}

export default PatchBay