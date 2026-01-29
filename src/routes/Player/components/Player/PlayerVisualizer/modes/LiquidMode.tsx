import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useSmoothedAudio } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface LiquidModeProps {
  colorPalette: ColorPalette
}

const BASE_RADIUS = 2.0
const SPHERE_DETAIL = 64 // Higher detail for smooth gyroid displacement

// Gyroid noise + analytical normals shader
// Gyroid: f(x,y,z) = sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x)
// This creates organic, interconnected surface patterns
const gyroidVertexShader = `
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float treble;
  uniform float energySmooth;
  uniform float spectralCentroid;
  uniform float beatIntensity;
  uniform float phaseOffset; // Audio-driven phase shift
  uniform float[64] frequencyData;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;
  varying float vFreqIntensity;

  // Gyroid function: returns scalar field value
  float gyroid(vec3 p) {
    return dot(sin(p), cos(p.yzx));
  }

  // Analytical gradient of gyroid (for proper normals)
  // d/dx [sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x)]
  //     = cos(x)cos(y) - sin(z)sin(x)
  // d/dy = -sin(x)sin(y) + cos(y)cos(z)
  // d/dz = -sin(y)sin(z) + cos(z)cos(x)
  vec3 gyroidGradient(vec3 p) {
    vec3 s = sin(p);
    vec3 c = cos(p);
    return vec3(
      c.x * c.y - s.z * s.x,
      -s.x * s.y + c.y * c.z,
      -s.y * s.z + c.z * c.x
    );
  }

  // FBM (Fractal Brownian Motion) of gyroid for organic detail
  float gyroidFBM(vec3 p, float phase, int octaves) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxValue = 0.0;

    for (int i = 0; i < 4; i++) {
      if (i >= octaves) break;
      value += amplitude * gyroid(p * frequency + phase);
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value / maxValue;
  }

  // FBM gradient (sum of scaled gradients)
  vec3 gyroidFBMGradient(vec3 p, float phase, int octaves) {
    vec3 grad = vec3(0.0);
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxValue = 0.0;

    for (int i = 0; i < 4; i++) {
      if (i >= octaves) break;
      grad += amplitude * gyroidGradient(p * frequency + phase) * frequency;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return grad / maxValue;
  }

  void main() {
    vec3 pos = position;
    vec3 norm = normalize(normal);

    // Map vertex to spherical coordinates for frequency lookup
    float vertAngle = acos(norm.y) / 3.14159;
    float horizAngle = atan(norm.z, norm.x) / 6.28318 + 0.5;

    // Get frequency intensity for this vertex
    int freqIndex = int(vertAngle * 63.0);
    float freqIntensity = frequencyData[freqIndex];
    vFreqIntensity = freqIntensity;

    // === GYROID DISPLACEMENT ===

    // Scale for gyroid sampling (controls pattern density)
    float scale = 3.0 + spectralCentroid * 1.5;

    // Phase offset from audio (smooth, not jerky)
    float phase = phaseOffset * 0.5;

    // Sample gyroid at vertex position on sphere
    vec3 samplePos = norm * scale;

    // Number of octaves based on energy (more detail for high energy)
    int octaves = 2 + int(energySmooth * 2.0);

    // Get FBM gyroid value
    float gyroidValue = gyroidFBM(samplePos, phase, octaves);

    // === DISPLACEMENT CALCULATION ===

    // Base breathing with bass (subtle)
    float breathing = 1.0 + bass * 0.1 + beatIntensity * 0.15;

    // Gyroid displacement strength based on energy
    // Low energy: subtle organic ripples
    // High energy: pronounced slime/ferrofluid effect
    float gyroidStrength = 0.15 + energySmooth * 0.4 + spectralCentroid * 0.2;

    // Frequency-driven local variation
    float freqModulation = freqIntensity * 0.3 * (0.5 + energySmooth);

    // Total displacement
    float displacement = gyroidValue * gyroidStrength + freqModulation;

    // Beat pulse (additive, quick decay)
    displacement += beatIntensity * 0.2;

    vDisplacement = displacement;

    // Apply displacement along normal
    pos = pos * breathing + norm * displacement;

    // === ANALYTICAL NORMAL CALCULATION ===
    // Get gyroid gradient for proper normal perturbation
    vec3 gyroidGrad = gyroidFBMGradient(samplePos, phase, octaves);

    // Project gradient onto tangent plane (perpendicular to original normal)
    vec3 tangentGrad = gyroidGrad - norm * dot(gyroidGrad, norm);

    // Perturbed normal (blend based on displacement strength)
    vec3 perturbedNormal = normalize(norm - tangentGrad * gyroidStrength * 0.8);

    // Transform to view space
    vNormal = normalize(normalMatrix * perturbedNormal);
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    vWorldPosition = pos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// Fragment shader - wet/glossy ferrofluid look
const gyroidFragmentShader = `
  uniform float time;
  uniform float energySmooth;
  uniform float spectralCentroid;
  uniform float bass;
  uniform float beatIntensity;
  uniform vec3 baseColor;
  uniform vec3 highlightColor;
  uniform vec3 rimColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;
  varying float vFreqIntensity;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);

    // === STRONG FRESNEL FOR WET LOOK ===
    // Higher exponent (4.0) = tighter rim, more liquid appearance
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 4.0);

    // === LIGHTING ===
    vec3 lightDir1 = normalize(vec3(1.0, 1.0, 0.5));
    vec3 lightDir2 = normalize(vec3(-0.5, 0.8, -0.5));
    vec3 lightDir3 = normalize(vec3(0.0, -1.0, 0.3)); // Rim light from below

    // Diffuse (soft, wrapping for subsurface-like effect)
    float wrap = 0.3;
    float diff1 = max((dot(normal, lightDir1) + wrap) / (1.0 + wrap), 0.0);
    float diff2 = max((dot(normal, lightDir2) + wrap) / (1.0 + wrap), 0.0) * 0.4;
    float diff3 = max(dot(normal, lightDir3), 0.0) * 0.2;
    float diffuse = diff1 + diff2 + diff3;

    // === HIGH SPECULAR (128+ shininess) ===
    vec3 halfDir1 = normalize(lightDir1 + viewDir);
    vec3 halfDir2 = normalize(lightDir2 + viewDir);

    float spec1 = pow(max(dot(normal, halfDir1), 0.0), 128.0);
    float spec2 = pow(max(dot(normal, halfDir2), 0.0), 64.0) * 0.5;
    float specular = spec1 + spec2;

    // Boost specular on beats
    specular *= 1.0 + beatIntensity * 0.5;

    // === COLOR CALCULATION ===
    // Base color shifts with spectral centroid (cool -> warm)
    vec3 coolTint = baseColor * vec3(0.7, 0.85, 1.1);
    vec3 warmTint = baseColor * vec3(1.1, 0.9, 0.7);
    vec3 surfaceColor = mix(coolTint, warmTint, spectralCentroid);

    // Displacement affects color intensity (peaks brighter)
    float dispBrightness = 0.8 + vDisplacement * 0.4;
    surfaceColor *= dispBrightness;

    // Frequency intensity adds local color variation
    surfaceColor = mix(surfaceColor, highlightColor, vFreqIntensity * 0.3);

    // === IRIDESCENCE (subtle, organic) ===
    // View-angle dependent color shift
    float iriAngle = dot(viewDir, normal);
    float iridescence = sin(iriAngle * 6.28 + time * 0.5) * 0.08;
    surfaceColor.r += iridescence * (1.0 - energySmooth * 0.5);
    surfaceColor.b -= iridescence * (1.0 - energySmooth * 0.5);

    // === COMBINE LIGHTING ===
    vec3 ambient = surfaceColor * 0.15;
    vec3 diffuseColor = surfaceColor * diffuse * 0.5;
    vec3 specularColor = highlightColor * specular * (0.6 + energySmooth * 0.4);
    vec3 fresnelColor = rimColor * fresnel * (0.5 + energySmooth * 0.3);

    vec3 finalColor = ambient + diffuseColor + specularColor + fresnelColor;

    // === EMISSION FOR BLOOM ===
    // Peaks and high-frequency areas emit more
    float emission = vDisplacement * 0.2 + vFreqIntensity * 0.15 + bass * 0.1;
    emission += fresnel * 0.1; // Rim emission
    finalColor += surfaceColor * emission;

    // Energy boost
    finalColor *= 1.0 + energySmooth * 0.25;

    // Beat flash (subtle white addition)
    finalColor += vec3(1.0) * beatIntensity * 0.1;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function LiquidMode ({ colorPalette }: LiquidModeProps) {
  const sphereRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const { getSmoothedAudio } = useSmoothedAudio({ lerpFactor: 0.25 }) // Responsive but smooth

  // Accumulated phase offset (smooth accumulation from audio)
  const phaseOffsetRef = useRef<number>(0)

  // Create sphere geometry with higher detail
  const sphereGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(BASE_RADIUS, SPHERE_DETAIL)
  }, [])

  // Create gyroid material
  const gyroidMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
        treble: { value: 0 },
        energySmooth: { value: 0 },
        spectralCentroid: { value: 0.5 },
        beatIntensity: { value: 0 },
        phaseOffset: { value: 0 },
        frequencyData: { value: new Float32Array(64) },
        baseColor: { value: new THREE.Color(0.2, 0.4, 0.8) },
        highlightColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
        rimColor: { value: new THREE.Color(0.5, 0.7, 1.0) },
      },
      vertexShader: gyroidVertexShader,
      fragmentShader: gyroidFragmentShader,
      side: THREE.DoubleSide,
    })
  }, [])

  // Animation loop
  useFrame((state) => {
    const sphere = sphereRef.current
    const group = groupRef.current
    if (!sphere || !group) return

    const audio = getSmoothedAudio()
    const time = state.clock.elapsedTime
    const deltaTime = Math.min(state.clock.getDelta(), 0.05)

    // Accumulate phase offset from audio (smooth animation, not instant)
    // Higher energy = faster phase evolution
    const phaseSpeed = 0.5 + audio.energySmooth * 1.5 + audio.spectralCentroid * 0.5
    phaseOffsetRef.current += deltaTime * phaseSpeed

    // Update shader uniforms
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    gyroidMaterial.uniforms.time.value = time
    gyroidMaterial.uniforms.bass.value = audio.bass
    gyroidMaterial.uniforms.mid.value = audio.mid
    gyroidMaterial.uniforms.treble.value = audio.treble
    gyroidMaterial.uniforms.energySmooth.value = audio.energySmooth
    gyroidMaterial.uniforms.spectralCentroid.value = audio.spectralCentroid
    gyroidMaterial.uniforms.beatIntensity.value = audio.beatIntensity
    gyroidMaterial.uniforms.phaseOffset.value = phaseOffsetRef.current
    gyroidMaterial.uniforms.frequencyData.value = audio.frequencyData

    // Update colors from palette
    const baseColor = getColorFromPalette(colorPalette, 0.3)
    const highlightColor = getColorFromPalette(colorPalette, 0.7)
    const rimColor = getColorFromPalette(colorPalette, 0.9)
    gyroidMaterial.uniforms.baseColor.value = baseColor
    gyroidMaterial.uniforms.highlightColor.value = highlightColor
    gyroidMaterial.uniforms.rimColor.value = rimColor

    // Sphere rotation - slow, organic
    const rotationSpeed = 0.001 + audio.energySmooth * 0.008 + audio.spectralCentroid * 0.005
    sphere.rotation.y += rotationSpeed
    sphere.rotation.x += rotationSpeed * 0.3

    // Subtle tilt on beat
    if (audio.beatIntensity > 0.3) {
      sphere.rotation.z += (Math.random() - 0.5) * audio.beatIntensity * 0.03
    }

    // Group tumble - very gentle
    group.rotation.x = Math.sin(time * 0.15) * 0.08
    group.rotation.z = Math.cos(time * 0.12) * 0.08
  })

  return (
    <group ref={groupRef}>
      {/* eslint-disable react/no-unknown-property */}

      {/* Main gyroid sphere */}
      <mesh ref={sphereRef} geometry={sphereGeometry} material={gyroidMaterial} />

      {/* Ambient lighting */}
      <ambientLight intensity={0.25} />

      {/* Key light - warm white */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        color='#fffaf0'
      />

      {/* Fill light - cool blue */}
      <directionalLight
        position={[-3, 2, -5]}
        intensity={0.5}
        color='#aaccff'
      />

      {/* Rim light - dramatic warm */}
      <pointLight
        position={[0, -4, -3]}
        intensity={0.6}
        color='#ffaa66'
      />

      {/* Top accent light */}
      <pointLight
        position={[0, 5, 0]}
        intensity={0.3}
        color='#ffffff'
      />
      {/* eslint-enable react/no-unknown-property */}
    </group>
  )
}

export default LiquidMode
