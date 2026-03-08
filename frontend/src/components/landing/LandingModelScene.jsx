import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

function Wheel({ position }) {
  return (
    <group position={position}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.05, 14, 40]} />
        <meshStandardMaterial color="#16191f" roughness={0.6} metalness={0.25} />
      </mesh>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 20]} />
        <meshStandardMaterial color="#d8dde3" roughness={0.45} metalness={0.55} />
      </mesh>
    </group>
  )
}

function MilkCrate({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.26, 0.35]} />
        <meshStandardMaterial color="#d97829" roughness={0.74} />
      </mesh>
      <mesh castShadow position={[-0.1, 0.06, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.16, 16]} />
        <meshStandardMaterial color="#f8fcff" roughness={0.25} metalness={0.12} />
      </mesh>
      <mesh castShadow position={[0.02, 0.06, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.16, 16]} />
        <meshStandardMaterial color="#f8fcff" roughness={0.25} metalness={0.12} />
      </mesh>
      <mesh castShadow position={[0.14, 0.06, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.16, 16]} />
        <meshStandardMaterial color="#f8fcff" roughness={0.25} metalness={0.12} />
      </mesh>
    </group>
  )
}

function Scooter() {
  return (
    <group position={[0, -0.05, 0]}>
      <mesh castShadow position={[0, -0.2, 0]}>
        <boxGeometry args={[1.5, 0.08, 0.25]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
      </mesh>

      <mesh castShadow position={[-0.2, 0.05, 0]}>
        <boxGeometry args={[0.74, 0.35, 0.3]} />
        <meshStandardMaterial color="#2f8f5b" roughness={0.56} metalness={0.2} />
      </mesh>

      <mesh castShadow position={[0.28, 0.08, 0]}>
        <boxGeometry args={[0.55, 0.25, 0.24]} />
        <meshStandardMaterial color="#23774a" roughness={0.58} metalness={0.2} />
      </mesh>

      <mesh castShadow position={[0.1, 0.32, 0]}>
        <boxGeometry args={[0.36, 0.07, 0.24]} />
        <meshStandardMaterial color="#1f2937" roughness={0.7} />
      </mesh>

      <mesh castShadow position={[0.53, 0.33, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.54, 12]} />
        <meshStandardMaterial color="#dce3ea" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0.62, 0.57, 0]}>
        <boxGeometry args={[0.28, 0.05, 0.05]} />
        <meshStandardMaterial color="#dce3ea" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh castShadow position={[0.62, 0.42, 0.11]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#f8f1df" emissive="#f8f1df" emissiveIntensity={0.12} />
      </mesh>

      <Wheel position={[-0.53, -0.23, 0]} />
      <Wheel position={[0.66, -0.23, 0]} />

      <MilkCrate position={[-0.58, 0.14, 0]} />
      <MilkCrate position={[-0.58, 0.42, 0]} scale={0.92} />
    </group>
  )
}

function ScooterShowcase({ target }) {
  const groupRef = useRef(null)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = target.current
    const desiredY = t.x * 0.32
    const desiredX = -t.y * 0.1

    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, desiredY, 6.2, delta)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, desiredX, 6.2, delta)
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      Math.sin(state.clock.elapsedTime * 0.9) * 0.035,
      6,
      delta,
    )
  })

  return (
    <group ref={groupRef}>
      <mesh receiveShadow position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.85, 64]} />
        <meshStandardMaterial color="#d6e8da" roughness={0.96} />
      </mesh>

      <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.2}>
        <Scooter />
      </Float>
    </group>
  )
}

export default function LandingModelScene() {
  const target = useRef({ x: 0, y: 0 })
  const [interactive, setInteractive] = useState(true)

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setInteractive(!coarse && !reduced)

    if (coarse || reduced) return undefined

    const onMove = (event) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1
      const ny = (event.clientY / window.innerHeight) * 2 - 1
      target.current = { x: nx, y: ny }
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="landing-model-shell">
      <Canvas dpr={[1, 1.6]} camera={{ position: [0.2, 0.42, 3.6], fov: 42 }}>
        <color attach="background" args={['#f6fbf8']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3.2, 2.8, 1.8]} intensity={1.2} castShadow />
        <directionalLight position={[-2.1, 1.7, -2]} intensity={0.35} />
        <Environment preset="city" />
        <ScooterShowcase target={interactive ? target : { current: { x: 0, y: 0 } }} />
        <ContactShadows position={[0, -0.38, 0]} opacity={0.28} width={4.4} height={4.4} blur={2.8} />
      </Canvas>
      <div className="landing-model-glow" />
    </div>
  )
}
