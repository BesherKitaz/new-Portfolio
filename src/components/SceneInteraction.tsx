import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export const DRAG_THRESHOLD_PX = 6

// Separate thresholds prevent flickering when hovering around the cutoff.
const HIDE_HEADER_DISTANCE_RATIO = 0.82
const SHOW_HEADER_DISTANCE_RATIO = 0.9

interface SceneInteractionProps {
  controls: RefObject<OrbitControlsImpl | null>
  onDrag: () => void
  onReady: () => void
  onZoomChange: (hidden: boolean) => void
  overviewDistance: number
  isOverview: boolean
}

export default function SceneInteraction({
  controls,
  onDrag,
  onReady,
  onZoomChange,
  overviewDistance,
  isOverview,
}: SceneInteractionProps) {
  const { gl } = useThree()
  const reportedReady = useRef(false)

  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (reportedReady.current) return
        reportedReady.current = true
        onReady()
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [onReady])

  useEffect(() => {
    const control = controls.current
    if (!control || !isOverview) return
    let hidden = false

    const checkZoom = () => {
      if (!control.enabled) return
      const ratio = control.getDistance() / overviewDistance
      const nextHidden = hidden
        ? ratio < SHOW_HEADER_DISTANCE_RATIO
        : ratio < HIDE_HEADER_DISTANCE_RATIO

      if (nextHidden === hidden) return
      hidden = nextHidden
      onZoomChange(hidden)
    }

    control.addEventListener('change', checkZoom)
    return () => control.removeEventListener('change', checkZoom)
  }, [controls, isOverview, overviewDistance, onZoomChange])

  useEffect(() => {
    const canvas = gl.domElement
    const pointers = new Map<number, { x: number; y: number }>()
    let reportedDrag = false

    const pointerDown = (event: PointerEvent) => {
      if (!controls.current?.enabled) return
      if (pointers.size === 0) reportedDrag = false
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }

    const pointerMove = (event: PointerEvent) => {
      const start = pointers.get(event.pointerId)
      if (!start || reportedDrag || !controls.current?.enabled) return

      const movement = Math.hypot(event.clientX - start.x, event.clientY - start.y)
      if (movement < DRAG_THRESHOLD_PX) return

      reportedDrag = true
      onDrag()
    }

    const pointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
    }

    canvas.addEventListener('pointerdown', pointerDown, true)
    window.addEventListener('pointermove', pointerMove, true)
    window.addEventListener('pointerup', pointerUp, true)
    window.addEventListener('pointercancel', pointerUp, true)
    canvas.addEventListener('lostpointercapture', pointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', pointerDown, true)
      window.removeEventListener('pointermove', pointerMove, true)
      window.removeEventListener('pointerup', pointerUp, true)
      window.removeEventListener('pointercancel', pointerUp, true)
      canvas.removeEventListener('lostpointercapture', pointerUp)
    }
  }, [gl, controls, onDrag])

  return null
}
