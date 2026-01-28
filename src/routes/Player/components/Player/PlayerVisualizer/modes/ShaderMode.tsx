import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { COLOR_PALETTES } from '../utils/colorPalettes'

interface ShaderModeProps {
  colorPalette: ColorPalette
}

// Vertex shader - simple full-screen quad
const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment shader with multiple audio-reactive effects
const fragmentShader = `
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float treble;
  uniform float beatIntensity;
  uniform vec2 resolution;
  uniform vec3 palette[6];
  uniform int paletteSize;

  varying vec2 vUv;

  #define PI 3.14159265359

  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
  vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                           dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Get color from palette
  vec3 getPaletteColor(float t) {
    t = fract(t);
    float idx = t * float(paletteSize - 1);
    int i = int(floor(idx));
    float f = fract(idx);

    vec3 c1 = palette[i];
    vec3 c2 = palette[min(i + 1, paletteSize - 1)];

    return mix(c1, c2, f);
  }

  // Plasma effect
  float plasma(vec2 uv, float t) {
    float v = 0.0;
    v += sin(uv.x * 10.0 + t);
    v += sin((uv.y * 10.0 + t) * 0.5);
    v += sin((uv.x * 10.0 + uv.y * 10.0 + t) * 0.5);

    float cx = uv.x + 0.5 * sin(t * 0.5);
    float cy = uv.y + 0.5 * cos(t * 0.3);
    v += sin(sqrt(100.0 * (cx*cx + cy*cy) + 1.0) + t);

    return v * 0.5;
  }

  // Tunnel effect
  float tunnel(vec2 uv, float t) {
    vec2 p = uv - 0.5;
    float a = atan(p.y, p.x);
    float r = length(p);

    float v = a / PI + t * 0.1;
    v += 1.0 / (r + 0.5) * 0.5;

    return v;
  }

  // Kaleidoscope
  vec2 kaleidoscope(vec2 uv, float segments) {
    vec2 p = uv - 0.5;
    float a = atan(p.y, p.x);
    float r = length(p);

    a = mod(a, PI * 2.0 / segments);
    a = abs(a - PI / segments);

    return vec2(cos(a), sin(a)) * r + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    float aspectRatio = resolution.x / resolution.y;
    uv.x *= aspectRatio;

    // Time with audio modulation
    float t = time + bass * 0.5;

    // Kaleidoscope segments based on treble
    float segments = 6.0 + treble * 4.0;
    vec2 kUv = kaleidoscope(vUv, segments);

    // Multiple effects layered
    float plasmaVal = plasma(kUv * (2.0 + mid), t);
    float tunnelVal = tunnel(uv, t * (1.0 + bass));

    // Noise for texture
    float noise = snoise(uv * 5.0 + vec2(t * 0.5)) * 0.5 + 0.5;

    // Mix effects based on audio
    float effect = mix(plasmaVal, tunnelVal, mid);
    effect = mix(effect, noise, treble * 0.3);

    // Get color from palette
    vec3 color = getPaletteColor(effect * 0.5 + time * 0.05);

    // Add glow/brightness based on bass
    color *= 0.8 + bass * 0.4;

    // Beat flash
    color += vec3(beatIntensity * 0.3);

    // Vignette
    vec2 vigUv = vUv * (1.0 - vUv);
    float vig = vigUv.x * vigUv.y * 15.0;
    vig = pow(vig, 0.25);
    color *= vig;

    gl_FragColor = vec4(color, 1.0);
  }
`

function ShaderMode ({ colorPalette }: ShaderModeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { audioData } = useAudioData()
  const { size } = useThree()

  // Create shader material with useMemo for stable reference
  const material = useMemo(() => {
    const colors = COLOR_PALETTES[colorPalette]
    const paletteArray = new Array(6).fill(null).map((_, i) =>
      colors[i]?.clone() ?? new THREE.Color(0xffffff),
    )

    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
        treble: { value: 0 },
        beatIntensity: { value: 0 },
        resolution: { value: new THREE.Vector2(size.width, size.height) },
        palette: { value: paletteArray },
        paletteSize: { value: colors.length },
      },
      vertexShader,
      fragmentShader,
    })
  }, [colorPalette, size.width, size.height])

  // Update palette when it changes
  useEffect(() => {
    const colors = COLOR_PALETTES[colorPalette]
    const paletteArray = new Array(6).fill(null).map((_, i) =>
      colors[i]?.clone() ?? new THREE.Color(0xffffff),
    )
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.palette.value = paletteArray

    material.uniforms.paletteSize.value = colors.length
  }, [colorPalette, material])

  useFrame((state) => {
    const { bass, mid, treble, beatIntensity } = audioData.current

    // Update uniforms
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    material.uniforms.time.value = state.clock.elapsedTime

    material.uniforms.bass.value = bass

    material.uniforms.mid.value = mid

    material.uniforms.treble.value = treble

    material.uniforms.beatIntensity.value = beatIntensity

    material.uniforms.resolution.value.set(size.width, size.height)
  })

  return (
    // eslint-disable-next-line react/no-unknown-property
    <mesh ref={meshRef} position={[0, 0, 0]} material={material}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <planeGeometry args={[10, 10]} />
    </mesh>
  )
}

export default ShaderMode
