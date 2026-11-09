import { useCallback, useEffect, useRef, useState } from 'react'

export const GESTURE_GUIDE_STORAGE_KEY = 'portfolio:gesture-guide-seen:v1'

export function useGestureGuide() {
  const [graphReady, setGraphReady] = useState(false)
  const [visible, setVisible] = useState(false)
  const checkedThisVisit = useRef(false)

  const markGraphReady = useCallback(() => setGraphReady(true), [])
  const dismiss = useCallback(() => setVisible(false), [])

  useEffect(() => {
    if (!graphReady || checkedThisVisit.current) return
    checkedThisVisit.current = true

    try {
      if (localStorage.getItem(GESTURE_GUIDE_STORAGE_KEY)) return

      localStorage.setItem(
        GESTURE_GUIDE_STORAGE_KEY,
        JSON.stringify({ firstVisitedAt: new Date().toISOString() }),
      )
    } catch {
      // Storage can be unavailable; the in-memory guard still prevents repeats here.
    }

    setVisible(true)
  }, [graphReady])

  return { visible, markGraphReady, dismiss }
}
