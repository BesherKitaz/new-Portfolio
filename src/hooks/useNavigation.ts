import { useEffect, useRef, useState, useCallback } from 'react'
import { graph, nodeById } from '../graph/model'
import { shortestPath } from '../graph/pathfinding'

export const HOME = 'profile:besher'

function fromLocation() {
  const id = new URLSearchParams(location.hash.slice(1)).get('node')
  return id && nodeById.has(id) ? id : HOME
}

export function useNavigation() {
  const [selected, setSelected] = useState(fromLocation)
  const [route, setRoute] = useState<string[]>([])
  const [revision, setRevision] = useState(0)
  const current = useRef(selected)
  const travel = useCallback((id: string, push = true) => {
    if (!nodeById.has(id)) return
    setRoute(shortestPath(graph, current.current, id))
    current.current = id
    setSelected(id)
    setRevision((v) => v + 1)
    if (push && fromLocation() !== id)
      history.pushState(
        { portfolio: true },
        '',
        id === HOME
          ? location.pathname + location.search
          : `#node=${encodeURIComponent(id)}`,
      )
  }, [])
  useEffect(() => {
    const change = () => travel(fromLocation(), false)
    window.addEventListener('popstate', change)
    window.addEventListener('hashchange', change)
    return () => {
      window.removeEventListener('popstate', change)
      window.removeEventListener('hashchange', change)
    }
  }, [travel])
  return { selected, route, revision, travel }
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  return reduced
}
