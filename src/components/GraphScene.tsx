import { Suspense, useEffect, useMemo, useRef, useState, Component } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import { AdditiveBlending, Color, Vector3 } from 'three'
import type { Group, Mesh } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import gsap from 'gsap'
import { content } from '../content'
import { graph, hash, neighbors, nodeById } from '../graph/model'
import type { GraphNode } from '../graph/model'
import { HOME } from '../hooks/useNavigation'
import SceneInteraction, { DRAG_THRESHOLD_PX } from './SceneInteraction'

// Raise this angle to look farther down at the overview from above.
const OVERVIEW_ELEVATION_DEGREES = 18
const OVERVIEW_ELEVATION = (OVERVIEW_ELEVATION_DEGREES * Math.PI) / 180
const OVERVIEW_DISTANCE_MULTIPLIER = 0.72
const CATEGORY_CAMERA_DISTANCE = 7.2
const ENTRY_CAMERA_DISTANCE = 5.2
const INITIAL_OVERVIEW_DISTANCE = 20 * OVERVIEW_DISTANCE_MULTIPLIER

function getOverviewDistance(width: number, height: number) {
  return (
    Math.max(20, 19 / (2 * Math.tan(Math.PI / 8) * (width / height))) *
    OVERVIEW_DISTANCE_MULTIPLIER
  )
}

interface Props {
  selected: string
  route: string[]
  revision: number
  onSelect: (id: string) => void
  reduced: boolean
  highlight: boolean
  onDrag: () => void
  onReady: () => void
  onZoomChange: (hidden: boolean) => void
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        The 3D view is unavailable. Explore every node using the navigation or list view.
      </div>
    ) : (
      this.props.children
    )
  }
}

function Stars({ reduced, compact }: { reduced: boolean; compact: boolean }) {
  const group = useRef<Group>(null)
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from(
          { length: compact ? 600 : 1500 },
          (_, i) => ((hash(`star-${i}`) % 10000) / 10000 - 0.5) * 85,
        ),
      ),
    [compact],
  )
  useFrame((_, delta) => {
    if (group.current && !reduced) group.current.rotation.z += delta * 0.0015
  })
  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          color="#b5c6f1"
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}

function CelestialNode({
  node,
  active,
  dim,
  onSelect,
  onHover,
  reduced,
  showLabel,
}: {
  node: GraphNode
  active: boolean
  dim: boolean
  onSelect: Props['onSelect']
  onHover: (id: string | null) => void
  reduced: boolean
  showLabel: boolean
}) {
  const mesh = useRef<Mesh>(null)
  const [hover, setHover] = useState(false)
  const root = node.type === 'profile'
  const category = node.type === 'category'
  const scale = node.size * (root ? 1.07 : 1)
  useFrame(({ clock }, delta) => {
    if (!mesh.current) return
    const target = hover || active ? 1.2 : 1
    mesh.current.scale.setScalar(
      mesh.current.scale.x + (target - mesh.current.scale.x) * Math.min(1, delta * 7),
    )
    if (!reduced) mesh.current.rotation.y = clock.elapsedTime * 0.08
  })
  const color = new Color(node.color)
  return (
    <group position={node.position}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          if (e.delta > DRAG_THRESHOLD_PX) return
          e.stopPropagation()
          onSelect(node.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          onHover(node.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[scale, 32, 24]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={root ? 1.5 : active ? 1.7 : 0.7}
          roughness={0.35}
          metalness={0.45}
          transparent
          opacity={dim ? 0.28 : 1}
        />
        <mesh scale={1.35}>
          <sphereGeometry args={[scale, 24, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={dim ? 0.025 : 0.1}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh scale={1.9}>
          <sphereGeometry args={[scale, 20, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={dim ? 0.012 : 0.028}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </mesh>
      {(root || category || active) && (
        <mesh rotation={[Math.PI / 2.6, 0.2, 0.3]}>
          <torusGeometry args={[scale * 1.65, root ? 0.012 : 0.007, 8, 80]} />
          <meshBasicMaterial color={node.color} transparent opacity={dim ? 0.12 : 0.55} />
        </mesh>
      )}
      {showLabel && (
        <Html
          center
          position={[0, -scale - (root ? 0.38 : 0.24), 0]}
          zIndexRange={[4, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <button
            tabIndex={-1}
            className={`node-label ${root ? 'root-label' : ''} ${category ? 'category-label' : ''} ${active ? 'active' : ''}`}
            style={{ opacity: dim ? 0.35 : 1, pointerEvents: 'auto' }}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(node.id)
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerEnter={(event) => {
              event.stopPropagation()
              onHover(node.id)
            }}
            onPointerLeave={(event) => {
              event.stopPropagation()
              onHover(null)
            }}
          >
            {node.label}
          </button>
        </Html>
      )}
    </group>
  )
}

function CameraJourney({
  selected,
  route,
  revision,
  reduced,
  controls,
}: Omit<Props, 'onSelect' | 'highlight' | 'onDrag' | 'onReady' | 'onZoomChange'> & {
  controls: React.RefObject<OrbitControlsImpl | null>
}) {
  const { camera, size } = useThree()
  useEffect(() => {
    const control = controls.current
    if (!control) return
    control.enabled = false
    const duration = reduced ? 0 : content.site.motionDuration
    const ids = route.length ? route : [selected]
    const timeline = gsap.timeline({
      onComplete: () => {
        control.enabled = true
      },
    })
    const homeDistance = getOverviewDistance(size.width, size.height)
    for (const [i, id] of ids.entries()) {
      if (i === 0 && ids.length > 1) continue
      const node = nodeById.get(id)!
      const p = id === HOME ? [0, 0, 0] : node.position
      const distance =
        id === HOME
          ? homeDistance
          : node.type === 'category'
            ? CATEGORY_CAMERA_DISTANCE
            : ENTRY_CAMERA_DISTANCE
      const t = duration / Math.max(1, ids.length - 1)
      const isHome = id === HOME

      timeline.to(camera.position, {
        x: p[0],
        y: p[1] + (isHome ? distance * Math.sin(OVERVIEW_ELEVATION) : 0.5),
        z: p[2] + (isHome ? distance * Math.cos(OVERVIEW_ELEVATION) : distance),
        duration: t,
        ease: 'power2.inOut',
      })
      timeline.to(
        control.target,
        {
          x: p[0],
          y: p[1],
          z: p[2],
          duration: t,
          ease: 'power2.inOut',
          onUpdate: () => control.update(),
        },
        '<',
      )
    }
    return () => {
      timeline.kill()
      control.enabled = true
    }
  }, [selected, revision, reduced, camera, controls, size.width, size.height, route]) // route changes with revision
  return null
}

function Universe(props: Props & { compact: boolean }) {
  const { size } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const focus = hovered ?? (props.selected !== HOME ? props.selected : null)
  const vicinity = useMemo(
    () => new Set(focus ? [focus, ...neighbors(focus)] : []),
    [focus],
  )
  // Reveal entries as visitors explore, keeping the overview focused on categories.
  const visibleNodes = graph.nodes.filter(
    (node) =>
      node.type === 'profile' ||
      node.type === 'category' ||
      vicinity.has(node.id) ||
      (props.selected !== HOME &&
        node.category === nodeById.get(props.selected)?.category) ||
      props.route.includes(node.id),
  )
  const visibleIds = new Set(visibleNodes.map((n) => n.id))
  const pathEdges = new Set(
    props.route.slice(1).map((id, i) => [props.route[i], id].sort().join('~')),
  )
  return (
    <>
      <ambientLight intensity={0.65} />
      <pointLight position={[0, 4, 7]} intensity={24} color="#879eff" />
      <Stars reduced={props.reduced} compact={props.compact} />
      <group rotation={[0, 0, -0.06]}>
        {[5.4, 8.6, 11.4].map((radius, i) => (
          <mesh key={radius} rotation={[Math.PI / 2.3 + i * 0.08, 0.12, 0]}>
            <torusGeometry args={[radius, 0.004, 4, 160]} />
            <meshBasicMaterial color="#7e90d0" transparent opacity={0.13} />
          </mesh>
        ))}
      </group>
      {graph.edges
        .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
        .map((edge) => {
          const a = nodeById.get(edge.source)!
          const b = nodeById.get(edge.target)!
          const related = focus && (edge.source === focus || edge.target === focus)
          const path = pathEdges.has(edge.id)
          const main = a.type === 'profile'
          return (
            <Line
              key={edge.id}
              points={[a.position, b.position]}
              color={path ? '#dbe5ff' : related ? a.color : '#7386c2'}
              opacity={path ? 0.95 : related ? 0.65 : focus ? 0.055 : main ? 0.36 : 0.12}
              transparent
              lineWidth={path ? 1.8 : related ? 1.1 : 0.6}
              dashed={!main && !related && !path}
              dashSize={0.055}
              gapSize={0.08}
            />
          )
        })}
      {!props.reduced && props.route.length > 1 && (
        <TravelPulse route={props.route} revision={props.revision} />
      )}
      {visibleNodes.map((node) => (
        <CelestialNode
          key={node.id}
          node={node}
          active={
            node.id === props.selected || (props.highlight && vicinity.has(node.id))
          }
          dim={!!focus && !vicinity.has(node.id)}
          onSelect={props.onSelect}
          onHover={setHovered}
          reduced={props.reduced}
          showLabel={
            node.type === 'profile' ||
            node.type === 'category' ||
            node.id === hovered ||
            node.id === props.selected ||
            (props.selected !== HOME &&
              node.category === nodeById.get(props.selected)?.category &&
              node.type !== 'skill')
          }
        />
      ))}
      <OrbitControls
        ref={controls}
        enablePan
        enableDamping
        dampingFactor={0.09}
        minDistance={3}
        maxDistance={60}
        rotateSpeed={0.45}
        zoomSpeed={0.7}
      />
      <SceneInteraction
        controls={controls}
        onDrag={props.onDrag}
        onReady={props.onReady}
        onZoomChange={props.onZoomChange}
        overviewDistance={getOverviewDistance(size.width, size.height)}
        isOverview={props.selected === HOME}
      />
      <CameraJourney {...props} controls={controls} />
    </>
  )
}

function TravelPulse({ route, revision }: { route: string[]; revision: number }) {
  const ref = useRef<Mesh>(null)
  const start = useRef(0)
  useEffect(() => {
    start.current = performance.now()
  }, [revision])
  useFrame(() => {
    if (!ref.current) return
    const progress = Math.min(
      1,
      (performance.now() - start.current) / (content.site.motionDuration * 1000),
    )
    const segment = Math.min(route.length - 2, Math.floor(progress * (route.length - 1)))
    const a = nodeById.get(route[segment])!.position
    const b = nodeById.get(route[segment + 1])!.position
    ref.current.position.lerpVectors(
      new Vector3(...a),
      new Vector3(...b),
      progress * (route.length - 1) - segment,
    )
    ref.current.visible = progress < 1
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  )
}

export default function GraphScene(props: Props) {
  const [compact, setCompact] = useState(
    () =>
      matchMedia(
        '(max-width:700px), (max-width:1000px) and (max-height:500px) and (pointer:coarse)',
      ).matches,
  )
  useEffect(() => {
    const media = matchMedia(
      '(max-width:700px), (max-width:1000px) and (max-height:500px) and (pointer:coarse)',
    )
    const change = () => setCompact(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  return (
    <SceneBoundary>
      <Suspense fallback={<div className="scene-fallback">Preparing your universe…</div>}>
        <Canvas
          onPointerMissed={(event) => {
            if (
              event.type === 'click' &&
              event.button === 0 &&
              event.target instanceof HTMLCanvasElement
            ) {
              props.onSelect(HOME)
            }
          }}
          camera={{
            position: [
              0,
              INITIAL_OVERVIEW_DISTANCE * Math.sin(OVERVIEW_ELEVATION),
              INITIAL_OVERVIEW_DISTANCE * Math.cos(OVERVIEW_ELEVATION),
            ],
            fov: 45,
          }}
          dpr={compact ? [1, 1.25] : [1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
          fallback={
            <div className="scene-fallback">
              Use list view to explore this portfolio without WebGL.
            </div>
          }
        >
          <Universe {...props} compact={compact} />
        </Canvas>
      </Suspense>
    </SceneBoundary>
  )
}
