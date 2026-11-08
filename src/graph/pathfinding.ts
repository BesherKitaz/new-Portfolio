import type { Graph } from './model'
// Dijkstra also yields shortest hop paths when all weights are one.

export function shortestPath(graph: Graph, start: string, target: string): string[] {
  const remaining = new Set(graph.nodes.map((n) => n.id))
  if (!remaining.has(start) || !remaining.has(target)) return []
  const distance = new Map([[start, 0]])
  const previous = new Map<string, string>()
  while (remaining.size) {
    const current = [...remaining].reduce((a, b) =>
      (distance.get(a) ?? Infinity) < (distance.get(b) ?? Infinity) ? a : b,
    )
    if (!Number.isFinite(distance.get(current))) break
    remaining.delete(current)
    if (current === target) {
      const path = [target]
      while (previous.has(path[0])) path.unshift(previous.get(path[0])!)
      return path
    }
    for (const edge of graph.edges) {
      const next =
        edge.source === current
          ? edge.target
          : edge.target === current
            ? edge.source
            : null
      if (!next || !remaining.has(next)) continue
      const nextDistance = distance.get(current)! + edge.weight
      if (nextDistance < (distance.get(next) ?? Infinity)) {
        distance.set(next, nextDistance)
        previous.set(next, current)
      }
    }
  }
  return []
}
