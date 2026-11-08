import { test } from 'node:test'
import assert from 'node:assert/strict'
import { content } from '../src/content/index'
import { buildGraph, graph } from '../src/graph/model'
import { shortestPath } from '../src/graph/pathfinding'
import { projectSchema } from '../src/content/schema'
test('every content entry generates one typed node, with connected technologies', () => {
  for (const [type, entries] of [
    ['project', content.projects],
    ['experience', content.experience],
    ['skill', content.skills],
    ['education', content.education],
    ['leadership', content.leadership],
  ] as const)
    for (const entry of entries)
      assert.ok(graph.nodes.find((n) => n.id === `${type}:${entry.id}`))
  for (const project of content.projects)
    for (const skill of project.technologies)
      assert.ok(
        graph.edges.find(
          (e) => e.source === `project:${project.id}` && e.target === `skill:${skill}`,
        ),
      )
  assert.equal(new Set(graph.nodes.map((n) => n.id)).size, graph.nodes.length)
})
test('new projects generate nodes and edges without moving existing nodes', () => {
  const next = structuredClone(content)
  next.projects.push({ ...next.projects[0], id: 'new-project' })
  const updated = buildGraph(next)
  assert.ok(
    updated.edges.find(
      (e) => e.source === 'project:new-project' && e.target === 'skill:react',
    ),
  )
  for (const node of graph.nodes)
    assert.deepEqual(updated.nodes.find((n) => n.id === node.id)?.position, node.position)
})
test('invalid references, duplicate IDs, and layout mistakes fail clearly', () => {
  const next = structuredClone(content)
  next.projects[0].technologies.push('missing-skill')
  assert.throws(() => buildGraph(next), /Missing node "skill:missing-skill"/)
  const duplicate = structuredClone(content)
  duplicate.projects.push(duplicate.projects[0])
  assert.throws(() => buildGraph(duplicate), /Duplicate/)
  const layout = structuredClone(content)
  layout.layout['project:missing'] = [0, 0, 0]
  assert.throws(() => buildGraph(layout), /Unknown layout override/)
  const rel = structuredClone(content)
  rel.relationships.push({
    source: 'project:safetyhub',
    target: 'missing:node',
    type: 'related',
  })
  assert.throws(() => buildGraph(rel), /Missing node/)
})
test('shortest paths follow direct cross-connections and weighted routes', () => {
  assert.deepEqual(shortestPath(graph, 'experience:purdue', 'project:safetyhub'), [
    'experience:purdue',
    'project:safetyhub',
  ])
  assert.deepEqual(shortestPath(graph, 'project:safetyhub', 'skill:react'), [
    'project:safetyhub',
    'skill:react',
  ])
  const sample = {
    nodes: ['a', 'b', 'c'].map((id) => ({ ...graph.nodes[0], id })),
    edges: [
      { id: 'ab', source: 'a', target: 'b', type: 'test', weight: 10 },
      { id: 'ac', source: 'a', target: 'c', type: 'test', weight: 1 },
      { id: 'cb', source: 'c', target: 'b', type: 'test', weight: 1 },
    ],
  }
  assert.deepEqual(shortestPath(sample, 'a', 'b'), ['a', 'c', 'b'])
  assert.deepEqual(shortestPath(graph, 'missing', 'skill:react'), [])
  for (const node of graph.nodes)
    assert.ok(shortestPath(graph, 'profile:besher', node.id).length)
})
test('schemas reject invalid URLs and malformed IDs with record field paths', () => {
  const result = projectSchema.safeParse({
    ...content.projects[0],
    githubUrl: 'not a URL',
    id: 'Bad ID',
  })
  assert.equal(result.success, false)
  if (!result.success)
    assert.deepEqual(result.error.issues.map((i) => i.path[0]).sort(), [
      'githubUrl',
      'id',
    ])
})
