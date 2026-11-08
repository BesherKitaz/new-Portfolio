import { content } from '../content'
import type {
  Position,
  Project,
  Experience,
  Education,
  Leadership,
  Skill,
} from '../content/schema'

export type Entry =
  | Project
  | Experience
  | Education
  | Leadership
  | Skill
  | { id: string; title: string; summary: string; url: string | null }

export interface GraphNode {
  id: string
  label: string
  type: string
  category: string
  description: string
  position: Position
  color: string
  size: number
  entry?: Entry
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  weight: number
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function hash(value: string) {
  let n = 2166136261
  for (const c of value) n = Math.imul(n ^ c.charCodeAt(0), 16777619)
  return n >>> 0
}

export function entryPosition(id: string, center: Position): Position {
  const h = hash(id)
  const angle = ((h % 10000) / 10000) * Math.PI * 2
  const radius = 1.25 + ((h >>> 12) % 100) / 90
  return [
    center[0] + Math.cos(angle) * radius,
    center[1] + Math.sin(angle) * radius,
    center[2] + ((h >>> 19) % 100) / 38 - 1.3,
  ]
}

export function buildGraph(data = content): Graph {
  const { profile, site } = data
  const nodes: GraphNode[] = [
    {
      id: 'profile:besher',
      label: profile.name,
      type: 'profile',
      category: 'home',
      description: profile.bio,
      position: [0, 0, 0],
      color: '#aebcff',
      size: 0.62,
    },
  ]
  const edges: GraphEdge[] = []
  const addEdge = (source: string, target: string, type: string, weight = 1) => {
    const key = [source, target].sort().join('~')
    if (edges.some((e) => e.id === key))
      throw new Error(`Duplicate relationship: ${source} → ${target}`)
    edges.push({ id: key, source, target, type, weight })
  }
  for (const cat of site.categories) {
    nodes.push({
      id: `category:${cat.id}`,
      label: cat.label,
      type: 'category',
      category: cat.id,
      description: '',
      position: cat.position,
      color: cat.color,
      size: 0.3,
    })
    addEdge('profile:besher', `category:${cat.id}`, 'contains')
  }
  function addEntries(type: string, category: string, entries: Entry[]) {
    if (!entries.length) return
    const parent = nodes.find((n) => n.id === `category:${category}`)
    if (!parent)
      throw new Error(
        `Missing category:${category} for ${type} records. Add it to site.json.`,
      )
    for (const entry of entries) {
      const id = `${type}:${entry.id}`
      const label =
        'name' in entry
          ? entry.name
          : 'institution' in entry
            ? entry.institution
            : entry.title
      nodes.push({
        id,
        label,
        type,
        category,
        description: 'summary' in entry ? entry.summary : entry.description,
        entry,
        position: entryPosition(id, parent.position),
        color: parent.color,
        size: type === 'skill' ? 0.085 : 0.16,
      })
      addEdge(parent.id, id, 'contains')
      if ('technologies' in entry)
        for (const skill of entry.technologies) addEdge(id, `skill:${skill}`, 'uses')
      if ('projectIds' in entry)
        for (const project of entry.projectIds)
          addEdge(id, `project:${project}`, 'developed')
    }
  }
  addEntries('project', 'projects', data.projects)
  addEntries('experience', 'experience', data.experience)
  addEntries('education', 'education', data.education)
  addEntries('skill', 'skills', data.skills)
  addEntries('leadership', 'leadership', data.leadership)
  addEntries('event', 'events', site.events)
  addEntries('publication', 'publications', profile.publications)
  addEntries('writing', 'writing', profile.writing)
  addEntries('testimonial', 'testimonials', profile.testimonials)
  for (const r of data.relationships) addEdge(r.source, r.target, r.type, r.weight)
  const ids = new Set<string>()
  for (const node of nodes) {
    if (ids.has(node.id)) throw new Error(`Duplicate node ID: ${node.id}`)
    ids.add(node.id)
    if (data.layout[node.id]) node.position = data.layout[node.id]
  }
  for (const [id] of Object.entries(data.layout))
    if (!ids.has(id)) throw new Error(`Unknown layout override: ${id}`)
  for (const edge of edges)
    for (const id of [edge.source, edge.target])
      if (!ids.has(id))
        throw new Error(
          `Missing node "${id}" referenced by ${edge.source} → ${edge.target}`,
        )
  return { nodes, edges }
}

export const graph = buildGraph()

export const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))

export function neighbors(id: string, g = graph) {
  return g.edges
    .filter((e) => e.source === id || e.target === id)
    .map((e) => (e.source === id ? e.target : e.source))
}
