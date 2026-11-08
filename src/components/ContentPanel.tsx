import { ArrowUpRight, X, Download, Network, ArrowRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { content } from '../content'
import { graph, neighbors, nodeById } from '../graph/model'
import type { GraphNode } from '../graph/model'

export function NodeList({
  nodes,
  onSelect,
}: {
  nodes: GraphNode[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="node-list">
      {nodes.map((node) => (
        <a
          key={node.id}
          href={`#node=${encodeURIComponent(node.id)}`}
          onClick={(e) => {
            e.preventDefault()
            onSelect(node.id)
          }}
        >
          <span className="list-node" style={{ background: node.color }} />
          <span>
            <strong>{node.label}</strong>
            {node.description && <small>{node.description}</small>}
          </span>
          <ArrowUpRight size={16} />
        </a>
      ))}
    </div>
  )
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return items.length > 0 ? (
    <section className="panel-section">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  ) : null
}

export default function ContentPanel({
  node,
  onSelect,
  onClose,
  onHighlight,
}: {
  node: GraphNode
  onSelect: (id: string) => void
  onClose: () => void
  onHighlight: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.closest('article')?.scrollTo({ top: 0 })
    heading.current?.focus({ preventScroll: true })
  }, [node.id])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])
  const entry = node.entry
  const connected = neighbors(node.id)
    .map((id) => nodeById.get(id)!)
    .filter((n) => n.type !== 'profile' && n.type !== 'category')
  const skills = connected.filter((n) => n.type === 'skill')
  return (
    <article className="content-panel" aria-labelledby="panel-title">
      <div className="panel-top">
        <span className="mono">
          {node.type === 'category' ? 'CONSTELLATION' : node.type.toUpperCase()} /{' '}
          {node.id.split(':')[1]}
        </span>
        <button className="icon-button" onClick={onClose} aria-label="Close details">
          <X size={18} />
        </button>
      </div>
      <span
        className="panel-orb"
        style={{ background: node.color, boxShadow: `0 0 36px ${node.color}66` }}
      />
      <h2 id="panel-title" ref={heading} tabIndex={-1}>
        {node.label}
      </h2>
      {entry && 'organization' in entry && entry.organization && (
        <p className="organization">{entry.organization}</p>
      )}
      {entry && 'start' in entry && (
        <p className="mono dates">
          {formatDate(entry.start)} — {entry.end ? formatDate(entry.end) : 'Present'}
        </p>
      )}
      {node.description && <p className="panel-description">{node.description}</p>}
      {entry && 'degree' in entry && <p>{entry.degree}</p>}
      {node.type === 'category' && (
        <>
          {node.category === 'about' && (
            <>
              <p className="panel-description">{content.profile.bio}</p>
              {content.profile.photo && (
                <img
                  className="profile-photo"
                  src={content.profile.photo}
                  alt={content.profile.name}
                />
              )}
              <NodeList
                nodes={graph.nodes.filter((n) =>
                  ['education', 'leadership'].includes(n.type),
                )}
                onSelect={onSelect}
              />
              <TextList
                title="Research interests"
                items={content.profile.researchInterests}
              />
            </>
          )}
          {node.category === 'contact' && (
            <>
              <p className="panel-description">Start a conversation.</p>
              <a className="contact-email" href={`mailto:${content.profile.email}`}>
                {content.profile.email}
                <ArrowUpRight size={16} />
              </a>
              <div className="external-links">
                {content.profile.socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
            </>
          )}
          <NodeList
            nodes={graph.nodes.filter(
              (n) => n.category === node.category && n.type !== 'category',
            )}
            onSelect={onSelect}
          />
        </>
      )}
      {entry && 'caseStudy' in entry && (
        <>
          {entry.screenshots.map((s) => (
            <figure key={s.src}>
              <img src={s.src} alt={s.alt} />
              <figcaption>{s.alt}</figcaption>
            </figure>
          ))}
          {entry.description && <p>{entry.description}</p>}
          <TextList title="Highlights" items={entry.highlights} />
          {entry.caseStudy.problem && (
            <section className="panel-section">
              <h3>The problem</h3>
              <p>{entry.caseStudy.problem}</p>
            </section>
          )}
          {entry.caseStudy.solution && (
            <section className="panel-section">
              <h3>The solution</h3>
              <p>{entry.caseStudy.solution}</p>
            </section>
          )}
          <TextList title="Engineering decisions" items={entry.caseStudy.decisions} />
          <TextList title="My contributions" items={entry.caseStudy.contributions} />
          <TextList title="Outcomes" items={entry.caseStudy.impact} />
          <div className="external-links">
            {entry.githubUrl && (
              <a href={entry.githubUrl} target="_blank" rel="noreferrer">
                Source code
                <ArrowUpRight size={15} />
              </a>
            )}
            {entry.liveUrl && (
              <a href={entry.liveUrl} target="_blank" rel="noreferrer">
                Live demo
                <ArrowUpRight size={15} />
              </a>
            )}
          </div>
        </>
      )}
      {entry && 'highlights' in entry && !('caseStudy' in entry) && (
        <TextList title="Highlights" items={entry.highlights} />
      )}
      {entry && 'achievements' in entry && (
        <>
          <TextList title="Achievements" items={entry.achievements} />
          <TextList title="Coursework" items={entry.coursework} />
        </>
      )}
      {entry && 'group' in entry && <p className="mono">{entry.group}</p>}
      {entry && 'url' in entry && entry.url && (
        <a className="text-link" href={entry.url} target="_blank" rel="noreferrer">
          Explore on the web <ArrowUpRight size={14} />
        </a>
      )}
      {skills.length > 0 && (
        <section className="panel-section">
          <h3>Technology connections</h3>
          <div className="skill-chips">
            {skills.map((s) => (
              <button key={s.id} onClick={() => onSelect(s.id)}>
                {s.label}
                <ArrowUpRight size={11} />
              </button>
            ))}
          </div>
          <button className="text-link" onClick={onHighlight}>
            <Network size={15} /> Explore Connected Technologies
          </button>
        </section>
      )}
      {connected.some((n) => n.type !== 'skill') && node.type !== 'category' && (
        <section className="panel-section">
          <h3>{node.type === 'skill' ? 'Used in & connected to' : 'Connected nodes'}</h3>
          <NodeList
            nodes={connected.filter((n) => n.type !== 'skill')}
            onSelect={onSelect}
          />
        </section>
      )}
      <div className="panel-bottom">
        <a href={content.profile.resumeUrl} download>
          <Download size={14} /> Download résumé
        </a>
          <button onClick={() => onSelect('category:contact')}>
          {!(node.type === 'category' && node.category === 'contact') && (<>
            {("Get in touch")}
            <ArrowRight size={14} />
          </>)}
        </button>
      </div>
    </article>
  )
}

function formatDate(value: string) {
  return new Date(`${value}-01T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}
