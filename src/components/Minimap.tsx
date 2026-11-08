import { graph } from '../graph/model'

export default function Minimap({
  selected,
  route,
  onSelect,
}: {
  selected: string
  route: string[]
  onSelect: (id: string) => void
}) {
  const nodes = graph.nodes.filter(
    (n) => n.type === 'category' || n.type === 'profile' || n.id === selected,
  )
  const pos = (id: string) => {
    const n = graph.nodes.find((n) => n.id === id)!
    return [100 + n.position[0] * 10, 48 - n.position[1] * 9]
  }
  const visible = new Set(nodes.map((n) => n.id))
  return (
    <div className="minimap">
      <div>
        <span className="mono">UNIVERSE MAP</span>
        <span className="live-dot" />
      </div>
      <svg viewBox="0 0 200 100" aria-label="Interactive graph minimap">
        {graph.edges
          .filter((e) => visible.has(e.source) && visible.has(e.target))
          .map((e) => {
            const a = pos(e.source)
            const b = pos(e.target)
            const active = route.includes(e.source) && route.includes(e.target)
            return (
              <line
                key={e.id}
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={active ? '#bbc8ff' : '#34415d'}
                strokeWidth={active ? 1.4 : 0.7}
              />
            )
          })}
        {nodes.map((n) => {
          const p = pos(n.id)
          return (
            <g
              key={n.id}
              role="button"
              tabIndex={0}
              aria-label={`Navigate to ${n.label}`}
              onClick={() => onSelect(n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(n.id)
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {n.id === selected && (
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r={7}
                  fill="none"
                  stroke={n.color}
                  opacity=".6"
                />
              )}
              <circle
                cx={p[0]}
                cy={p[1]}
                r={n.type === 'profile' ? 3.5 : 2.4}
                fill={n.color}
              />
              <circle cx={p[0]} cy={p[1]} r={8} fill="transparent" />
            </g>
          )
        })}
      </svg>
      <p>
        <span className="live-dot" /> You are here{' '}
        <span>{selected === 'profile:besher' ? 'Overview' : 'Exploring'}</span>
      </p>
    </div>
  )
}
