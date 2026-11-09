import { useEffect, useState } from 'react'
import { Hand, MousePointer2 } from 'lucide-react'

interface GestureGuideProps {
  onDismiss: () => void
}

export default function GestureGuide({ onDismiss }: GestureGuideProps) {
  const [touchInput, setTouchInput] = useState(
    () => matchMedia('(any-pointer: coarse)').matches,
  )

  useEffect(() => {
    const media = matchMedia('(any-pointer: coarse)')
    const update = () => setTouchInput(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 8000)
    return () => window.clearTimeout(timeout)
  }, [onDismiss])

  const GestureIcon = touchInput ? Hand : MousePointer2

  return (
    <aside
      className="gesture-guide"
      role="status"
      aria-label="Graph navigation tip"
      aria-live="polite"
    >
      <div className="gesture-guide-demo" aria-hidden="true">
        <span className="gesture-guide-track" />
        <GestureIcon className="gesture-guide-pointer" size={26} />
      </div>
      <div className="gesture-guide-copy">
        <strong>{touchInput ? 'Swipe to explore' : 'Drag to explore'}</strong>
        <p>
          {touchInput
            ? 'Slide one finger across the graph to look around.'
            : 'Hold the left mouse button and drag to look around.'}
        </p>
      </div>
      <button onClick={onDismiss}>Got it</button>
    </aside>
  )
}
