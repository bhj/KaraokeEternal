import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useSmoothedAudio } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface PhysarumModeProps {
  colorPalette: ColorPalette
}

const AGENT_TEX_SIZE = 256 // 65,536 agents
const TRAIL_SIZE = 1024 // Trail/pheromone field resolution

// ── Shared fullscreen quad vertex shader ──
const fullscreenVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// ── Pass 1: Diffuse + Decay ──
// Blurs the trail texture (3x3 mean filter) and decays intensity.
// Also composites new agent deposits on top.
const diffuseDecayFrag = `
  uniform sampler2D trailPrev;
  uniform sampler2D deposits;
  uniform float decay;
  uniform vec2 texelSize; // 1.0 / TRAIL_SIZE

  varying vec2 vUv;

  void main() {
    // 3x3 mean blur of previous trail
    vec4 sum = vec4(0.0);
    for (int dx = -1; dx <= 1; dx++) {
      for (int dy = -1; dy <= 1; dy++) {
        sum += texture2D(trailPrev, vUv + vec2(float(dx), float(dy)) * texelSize);
      }
    }
    vec4 blurred = sum / 9.0;

    // Add new deposits
    vec4 deposit = texture2D(deposits, vUv);

    // Decay + deposit
    gl_FragColor = vec4(blurred.rgb * decay + deposit.rgb, 1.0);
  }
`

// ── Pass 2: Agent Update ──
// Each texel encodes one agent: (x, y, angle, 1.0)
// Agents sense the trail, steer, and move.
const agentUpdateFrag = `
  uniform sampler2D agentsPrev;
  uniform sampler2D trail;
  uniform float ss; // step size (speed)
  uniform float sa; // sensor angle (radians)
  uniform float ra; // rotation angle (radians)
  uniform float so; // sensor offset (look-ahead distance)
  uniform float time;
  uniform vec2 trailTexelSize; // 1.0 / TRAIL_SIZE

  varying vec2 vUv;

  // Simple hash for pseudo-random per-agent jitter
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec4 agent = texture2D(agentsPrev, vUv);
    float x = agent.r;
    float y = agent.g;
    float angle = agent.b;

    // Sensor positions (front-left, front, front-right)
    vec2 fl = vec2(x, y) + so * vec2(cos(angle + sa), sin(angle + sa));
    vec2 fc = vec2(x, y) + so * vec2(cos(angle),      sin(angle));
    vec2 fr = vec2(x, y) + so * vec2(cos(angle - sa), sin(angle - sa));

    // Sample trail at sensor positions
    float sL = texture2D(trail, fl).r;
    float sC = texture2D(trail, fc).r;
    float sR = texture2D(trail, fr).r;

    // Steering logic (Jones 2010)
    float rnd = hash(vUv + time);
    if (sC > sL && sC > sR) {
      // Front is strongest → go straight (no turn)
    } else if (sC < sL && sC < sR) {
      // Both sides stronger → random turn
      angle += (rnd > 0.5 ? ra : -ra);
    } else if (sL > sR) {
      angle += ra;
    } else if (sR > sL) {
      angle -= ra;
    }

    // Move forward
    x += ss * cos(angle);
    y += ss * sin(angle);

    // Wrap around [0, 1]
    x = fract(x);
    y = fract(y);

    gl_FragColor = vec4(x, y, angle, 1.0);
  }
`

// ── Pass 3: Agent Deposit (points shader) ──
// Each agent deposits pheromone at its position.
const depositVert = `
  uniform sampler2D agents;
  attribute vec2 texCoord;

  void main() {
    vec4 agent = texture2D(agents, texCoord);
    // Agent x,y are in [0,1] → map to clip space [-1, 1]
    vec2 pos = agent.xy * 2.0 - 1.0;
    gl_Position = vec4(pos, 0.0, 1.0);
    gl_PointSize = 1.0;
  }
`

const depositFrag = `
  uniform float depositStrength;

  void main() {
    gl_FragColor = vec4(vec3(depositStrength), 1.0);
  }
`

// ── Display shader ──
// Maps trail intensity through a 3-color palette gradient.
const displayFrag = `
  uniform sampler2D trail;
  uniform vec3 colorLow;
  uniform vec3 colorMid;
  uniform vec3 colorHigh;
  uniform float energyBoost;
  uniform float beatFlash;

  varying vec2 vUv;

  void main() {
    float intensity = texture2D(trail, vUv).r;

    // Boost intensity with energy
    intensity = clamp(intensity * (1.0 + energyBoost * 0.5), 0.0, 1.0);

    // 3-stop gradient: low → mid → high
    vec3 color;
    if (intensity < 0.5) {
      color = mix(colorLow, colorMid, intensity * 2.0);
    } else {
      color = mix(colorMid, colorHigh, (intensity - 0.5) * 2.0);
    }

    // Beat flash
    color += vec3(beatFlash * 0.15);

    gl_FragColor = vec4(color, 1.0);
  }
`

// Seeded random for deterministic agent initialization
function seededRandom (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

interface GPUResources {
  agentDataTextures: [THREE.DataTexture, THREE.DataTexture]
  agentRenderTargets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  trailRenderTargets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  depositRenderTarget: THREE.WebGLRenderTarget
  diffuseDecayMaterial: THREE.ShaderMaterial
  agentUpdateMaterial: THREE.ShaderMaterial
  agentDepositMaterial: THREE.ShaderMaterial
  displayMaterial: THREE.ShaderMaterial
  depositGeometry: THREE.BufferGeometry
  simScene: THREE.Scene
  simCamera: THREE.OrthographicCamera
  depositScene: THREE.Scene
}

function PhysarumMode ({ colorPalette }: PhysarumModeProps) {
  const { gl, viewport } = useThree()
  const { getSmoothedAudio } = useSmoothedAudio({ lerpFactor: 0.25 })

  const pingRef = useRef(true)
  const meshRef = useRef<THREE.Mesh>(null)

  const gpuResources = useMemo<GPUResources>(() => {
    // ── Agent data textures (RGBA float: x, y, angle, 1.0) ──
    const agentCount = AGENT_TEX_SIZE * AGENT_TEX_SIZE
    const agentData = new Float32Array(agentCount * 4)
    for (let i = 0; i < agentCount; i++) {
      const i4 = i * 4
      const seed = i * 7
      agentData[i4] = seededRandom(seed) // x in [0,1]
      agentData[i4 + 1] = seededRandom(seed + 1) // y in [0,1]
      agentData[i4 + 2] = seededRandom(seed + 2) * Math.PI * 2 // angle
      agentData[i4 + 3] = 1.0
    }

    const makeAgentDataTex = (data: Float32Array) => {
      const tex = new THREE.DataTexture(data, AGENT_TEX_SIZE, AGENT_TEX_SIZE, THREE.RGBAFormat, THREE.FloatType)
      tex.minFilter = THREE.NearestFilter
      tex.magFilter = THREE.NearestFilter
      tex.needsUpdate = true
      return tex
    }

    const agentTexA = makeAgentDataTex(new Float32Array(agentData))
    const agentTexB = makeAgentDataTex(new Float32Array(agentData))

    // ── Render targets ──
    const agentRTOpts = {
      minFilter: THREE.NearestFilter as THREE.TextureFilter,
      magFilter: THREE.NearestFilter as THREE.TextureFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType as THREE.TextureDataType,
    }

    const trailRTOpts = {
      minFilter: THREE.LinearFilter as THREE.TextureFilter,
      magFilter: THREE.LinearFilter as THREE.TextureFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType as THREE.TextureDataType,
    }

    const agentRTA = new THREE.WebGLRenderTarget(AGENT_TEX_SIZE, AGENT_TEX_SIZE, agentRTOpts)
    const agentRTB = new THREE.WebGLRenderTarget(AGENT_TEX_SIZE, AGENT_TEX_SIZE, agentRTOpts)
    const trailRTA = new THREE.WebGLRenderTarget(TRAIL_SIZE, TRAIL_SIZE, trailRTOpts)
    const trailRTB = new THREE.WebGLRenderTarget(TRAIL_SIZE, TRAIL_SIZE, trailRTOpts)
    const depositRT = new THREE.WebGLRenderTarget(TRAIL_SIZE, TRAIL_SIZE, trailRTOpts)

    // ── Materials ──
    const trailTexelSize = 1.0 / TRAIL_SIZE

    const diffuseDecayMat = new THREE.ShaderMaterial({
      uniforms: {
        trailPrev: { value: null },
        deposits: { value: null },
        decay: { value: 0.95 },
        texelSize: { value: new THREE.Vector2(trailTexelSize, trailTexelSize) },
      },
      vertexShader: fullscreenVert,
      fragmentShader: diffuseDecayFrag,
    })

    const agentUpdateMat = new THREE.ShaderMaterial({
      uniforms: {
        agentsPrev: { value: null },
        trail: { value: null },
        ss: { value: 0.001 },
        sa: { value: 0.3 },
        ra: { value: 0.3 },
        so: { value: 0.01 },
        time: { value: 0 },
        trailTexelSize: { value: new THREE.Vector2(trailTexelSize, trailTexelSize) },
      },
      vertexShader: fullscreenVert,
      fragmentShader: agentUpdateFrag,
    })

    const agentDepositMat = new THREE.ShaderMaterial({
      uniforms: {
        agents: { value: null },
        depositStrength: { value: 0.5 },
      },
      vertexShader: depositVert,
      fragmentShader: depositFrag,
    })

    const displayMat = new THREE.ShaderMaterial({
      uniforms: {
        trail: { value: null },
        colorLow: { value: new THREE.Color(0, 0, 0) },
        colorMid: { value: new THREE.Color(1, 1, 1) },
        colorHigh: { value: new THREE.Color(1, 1, 1) },
        energyBoost: { value: 0 },
        beatFlash: { value: 0 },
      },
      vertexShader: fullscreenVert,
      fragmentShader: displayFrag,
    })

    // ── Deposit geometry (GL_POINTS, one point per agent) ──
    const depositGeo = new THREE.BufferGeometry()
    const texCoords = new Float32Array(agentCount * 2)
    const positions = new Float32Array(agentCount * 3) // required by three.js
    for (let i = 0; i < AGENT_TEX_SIZE; i++) {
      for (let j = 0; j < AGENT_TEX_SIZE; j++) {
        const idx = i * AGENT_TEX_SIZE + j
        texCoords[idx * 2] = (j + 0.5) / AGENT_TEX_SIZE
        texCoords[idx * 2 + 1] = (i + 0.5) / AGENT_TEX_SIZE
        positions[idx * 3] = 0
        positions[idx * 3 + 1] = 0
        positions[idx * 3 + 2] = 0
      }
    }
    depositGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    depositGeo.setAttribute('texCoord', new THREE.BufferAttribute(texCoords, 2))

    // ── Scenes ──
    const simScene = new THREE.Scene()
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Fullscreen quad for sim passes (material swapped per pass)
    const simQuadGeo = new THREE.PlaneGeometry(2, 2)
    const simQuad = new THREE.Mesh(simQuadGeo, diffuseDecayMat)
    simScene.add(simQuad)

    // Separate scene for deposit points
    const depositScene = new THREE.Scene()
    const depositPoints = new THREE.Points(depositGeo, agentDepositMat)
    depositScene.add(depositPoints)

    return {
      agentDataTextures: [agentTexA, agentTexB],
      agentRenderTargets: [agentRTA, agentRTB],
      trailRenderTargets: [trailRTA, trailRTB],
      depositRenderTarget: depositRT,
      diffuseDecayMaterial: diffuseDecayMat,
      agentUpdateMaterial: agentUpdateMat,
      agentDepositMaterial: agentDepositMat,
      displayMaterial: displayMat,
      depositGeometry: depositGeo,
      simScene,
      simCamera,
      depositScene,
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      const r = gpuResources
      r.agentDataTextures.forEach(t => t.dispose())
      r.agentRenderTargets.forEach(t => t.dispose())
      r.trailRenderTargets.forEach(t => t.dispose())
      r.depositRenderTarget.dispose()
      r.diffuseDecayMaterial.dispose()
      r.agentUpdateMaterial.dispose()
      r.agentDepositMaterial.dispose()
      r.displayMaterial.dispose()
      r.depositGeometry.dispose()
    }
  }, [gpuResources])

  // ── Per-frame simulation loop ──
  useFrame((state) => {
    const audio = getSmoothedAudio()
    const time = state.clock.elapsedTime

    const ping = pingRef.current
    const {
      agentDataTextures,
      agentRenderTargets,
      trailRenderTargets,
      depositRenderTarget,
      diffuseDecayMaterial,
      agentUpdateMaterial,
      agentDepositMaterial,
      displayMaterial,
      simScene,
      simCamera,
      depositScene,
    } = gpuResources

    // Audio → simulation params
    const ss = 0.0005 + (audio.energySmooth + audio.bass) * 0.002 // step size
    const sa = 0.2 + audio.spectralCentroid * 0.6 // sensor angle
    const ra = 0.2 + audio.beatIntensity * 0.5 // rotation angle
    const so = 0.005 + audio.mid * 0.02 // sensor offset
    const decay = 0.97 - audio.energySmooth * 0.07 // trail decay
    const depositStrength = 0.3 + audio.energy * 0.4 + audio.beatIntensity * 0.3

    // Source textures for this frame
    const srcAgentRT = ping ? agentRenderTargets[0] : agentRenderTargets[1]
    const dstAgentRT = ping ? agentRenderTargets[1] : agentRenderTargets[0]
    const srcTrailRT = ping ? trailRenderTargets[0] : trailRenderTargets[1]
    const dstTrailRT = ping ? trailRenderTargets[1] : trailRenderTargets[0]

    // Use DataTexture on first frame, then RT texture
    const agentSource = srcAgentRT.texture.image
      ? srcAgentRT.texture
      : agentDataTextures[ping ? 0 : 1]

    // Get the sim quad mesh to swap materials
    const simQuad = simScene.children[0] as THREE.Mesh

    // ── Pass 3: Render agent deposits ──
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    agentDepositMaterial.uniforms.agents.value = agentSource
    agentDepositMaterial.uniforms.depositStrength.value = depositStrength

    gl.setRenderTarget(depositRenderTarget)
    gl.clearColor()
    gl.render(depositScene, simCamera)

    // ── Pass 1: Diffuse + Decay ──
    diffuseDecayMaterial.uniforms.trailPrev.value = srcTrailRT.texture
    diffuseDecayMaterial.uniforms.deposits.value = depositRenderTarget.texture
    diffuseDecayMaterial.uniforms.decay.value = decay

    simQuad.material = diffuseDecayMaterial
    gl.setRenderTarget(dstTrailRT)
    gl.render(simScene, simCamera)

    // ── Pass 2: Update agents ──
    agentUpdateMaterial.uniforms.agentsPrev.value = agentSource
    agentUpdateMaterial.uniforms.trail.value = dstTrailRT.texture
    agentUpdateMaterial.uniforms.ss.value = ss
    agentUpdateMaterial.uniforms.sa.value = sa
    agentUpdateMaterial.uniforms.ra.value = ra
    agentUpdateMaterial.uniforms.so.value = so
    agentUpdateMaterial.uniforms.time.value = time

    simQuad.material = agentUpdateMaterial
    gl.setRenderTarget(dstAgentRT)
    gl.render(simScene, simCamera)

    gl.setRenderTarget(null)

    // ── Update display material ──
    displayMaterial.uniforms.trail.value = dstTrailRT.texture
    displayMaterial.uniforms.colorLow.value = getColorFromPalette(colorPalette, 0.0)
    displayMaterial.uniforms.colorMid.value = getColorFromPalette(colorPalette, 0.5)
    displayMaterial.uniforms.colorHigh.value = getColorFromPalette(colorPalette, 1.0)
    displayMaterial.uniforms.energyBoost.value = audio.energySmooth
    displayMaterial.uniforms.beatFlash.value = audio.beatIntensity

    // Scale to fill viewport
    if (meshRef.current) {
      meshRef.current.scale.set(viewport.width, viewport.height, 1)
    }

    // Flip ping-pong
    pingRef.current = !ping
  })

  return (
    // eslint-disable-next-line react/no-unknown-property
    <mesh ref={meshRef} material={gpuResources.displayMaterial}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}

export default PhysarumMode
