import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Box,
  BriefcaseBusiness,
  ChevronRight,
  CircleDot,
  Compass,
  GraduationCap,
  Home,
  List,
  Mail,
  Network,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { content } from './content'
import { graph, nodeById } from './graph/model'
import { HOME, useNavigation, useReducedMotion } from './hooks/useNavigation'
import ContentPanel, { NodeList } from './components/ContentPanel'
import Minimap from './components/Minimap'
import MobileNavigation from './components/MobileNavigation'
import GestureGuide from './components/GestureGuide'
import { useGestureGuide } from './hooks/useGestureGuide'
import './App.css'

const GraphScene = lazy(() => import('./components/GraphScene'))
const icons: Record<string, typeof Home> = {
  projects: Box,
  experience: BriefcaseBusiness,
  skills: Network,
  about: CircleDot,
  contact: Mail,
  education: GraduationCap,
  leadership: Users,
}

export default function App() {
  const { selected, route, revision, travel } = useNavigation()
  const reduced = useReducedMotion()
  const main = useRef<HTMLElement>(null)

  const [list, setList] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(false)
  const [draggedRevision, setDraggedRevision] = useState<number | null>(null)
  const [zoomState, setZoomState] = useState({ revision: -1, hidden: false })
  const gestureGuide = useGestureGuide()

  const handleZoomChange = useCallback(
    (hidden: boolean) => {
      setZoomState({ revision, hidden })
      if (!hidden) setDraggedRevision(null)
    },
    [revision],
  )

  const handleGraphDrag = useCallback(() => {
    setDraggedRevision(revision)
    gestureGuide.dismiss()
  }, [revision, gestureGuide.dismiss])

  const node = nodeById.get(selected)!
  const home = selected === HOME
  const zoomHidesIntro = zoomState.revision === revision && zoomState.hidden
  const introHidden = !home || (!list && (draggedRevision === revision || zoomHidesIntro))

  const select = (id: string) => {
    travel(id)
    setQuery('')
    setHighlight(false)
    gestureGuide.dismiss()
    if (id === HOME) main.current?.scrollTo({ top: 0 })
  }

  const parent = content.site.categories.find((c) => c.id === node.category)
  const results = graph.nodes.filter((n) =>
    `${n.label} ${n.description} ${n.entry ? JSON.stringify(n.entry) : ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  return (
    <div className="portfolio-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            select(HOME)
          }}
          aria-label={`${content.profile.name} home`}
        >
          <span className="brand-symbol">
            b<span>k</span>
            <i />
          </span>
          <span>
            {content.profile.name.toUpperCase()}
            <small>{content.profile.role.split(' | ')[0].toUpperCase()}</small>
          </span>
        </a>
        <div className="sidebar-section">
          <span className="section-label">NAVIGATION</span>
          <nav aria-label="Portfolio">
            <button
              className={home ? 'nav-item selected' : 'nav-item'}
              onClick={() => select(HOME)}
            >
              <Home size={17} />
              <span>Overview</span>
              <span className="nav-shortcut">01</span>
            </button>
            <span className="section-label constellations">
              {content.site.categoryLabel}
            </span>
            {content.site.categories.map((c, i) => {
              const Icon = icons[c.id] ?? CircleDot

              return (
                <button
                  key={c.id}
                  className={`nav-item ${node.category === c.id ? 'selected' : ''}`}
                  onClick={() => select(`category:${c.id}`)}
                >
                  <Icon size={17} />
                  <span>{c.label}</span>
                  <span className="nav-shortcut">{String(i + 2).padStart(2, '0')}</span>
                </button>
              )
            })}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <a className="resume-button" href={content.profile.resumeUrl} download>
            <ArrowDownToLine size={16} /> Download résumé <ArrowUpRight size={14} />
          </a>
          <div className="sidebar-socials">
            {content.profile.socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                {s.label}
                <ArrowUpRight size={12} />
              </a>
            ))}
          </div>
          <p className="sidebar-foot">
            <span className="live-dot" /> ALWAYS EXPLORING
          </p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <button onClick={() => select(HOME)}>
              <Compass size={16} />
              <span>Universe</span>
            </button>
            <ChevronRight size={13} />
            {parent && !home && (
              <>
                <button onClick={() => select(`category:${parent.id}`)}>
                  {parent.label}
                </button>
                {node.type !== 'category' && <ChevronRight size={13} />}
              </>
            )}
            {(home || node.type !== 'category') && (
              <span>{home ? 'Overview' : node.label}</span>
            )}
          </nav>
          <div className="topbar-right">
            <button
              className="view-toggle"
              onClick={() => {
                setList(!list)
                gestureGuide.dismiss()
              }}
              aria-pressed={list}
            >
              {list ? <Network size={14} /> : <List size={14} />}
              <span>{list ? 'Graph view' : 'List view'}</span>
            </button>
          </div>
        </header>
        <div className="search-toolbar" role="search" aria-label="Portfolio search">
          <div className="search-wrap">
            <Search size={15} />
            <input
              aria-label="Find a node"
              placeholder="Find a node…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setQuery('')
              }}
            />
            <kbd>⌕</kbd>
            {query && (
              <div className="search-results">
                <span className="section-label">{results.length} RESULTS</span>
                <NodeList nodes={results} onSelect={select} />
                {results.length === 0 && <p>No matching nodes.</p>}
              </div>
            )}
          </div>
        </div>
        <main
          ref={main}
          id="main-content"
          className={`main-content ${!home ? 'has-panel' : ''} ${list ? 'list-mode' : ''}`}
        >
          {!list && (
            <div className="galaxy-scene" aria-label="Interactive 3D portfolio graph">
              <Suspense
                fallback={<div className="scene-fallback">Preparing your universe…</div>}
              >
                <GraphScene
                  selected={selected}
                  route={route}
                  revision={revision}
                  onSelect={select}
                  reduced={reduced}
                  highlight={highlight}
                  onDrag={handleGraphDrag}
                  onReady={gestureGuide.markGraphReady}
                  onZoomChange={handleZoomChange}
                />
              </Suspense>
            </div>
          )}
          <div className="scene-vignette" />
          {!list && gestureGuide.visible && (
            <GestureGuide onDismiss={gestureGuide.dismiss} />
          )}
          <div className={`intro identity-intro ${introHidden ? 'intro-dismissed' : ''}`}>
            <h1>{content.profile.name}</h1>
            <p className="intro-subtitle">{content.profile.role}</p>
            <p className="intro-motto">{content.profile.motto}</p>
          </div>
          {list && (
            <section className="all-content" aria-label="Accessible portfolio content">
              <p className="eyebrow">EVERY NODE. ONE PLACE.</p>
              <h2>A closer look.</h2>
              <p>Explore the same connected portfolio in a simple list.</p>
              {content.site.categories.map((c) => (
                <section key={c.id}>
                  <h3 style={{ color: c.color }}>{c.label}</h3>
                  {c.id === 'about' && <p>{content.profile.bio}</p>}
                  {c.id === 'contact' && (
                    <a href={`mailto:${content.profile.email}`}>
                      {content.profile.email}
                    </a>
                  )}
                  <NodeList
                    nodes={graph.nodes.filter(
                      (n) => n.category === c.id && n.type !== 'category',
                    )}
                    onSelect={select}
                  />
                </section>
              ))}
            </section>
          )}
          {!list && (
            <>
              <div className="scene-instructions">
                <span className="mouse-icon" />
                <p>
                  <span className="desktop-gesture">Click a node to explore</span>
                  <span className="phone-gesture">Tap a node to explore</span>
                  <span className="desktop-gesture">Drag to rotate · Scroll to zoom</span>
                  <span className="phone-gesture">Swipe to rotate · Pinch to zoom</span>
                </p>
              </div>
              <Minimap selected={selected} route={route} onSelect={select} />
            </>
          )}
          {!home && (
            <>
              <button
                className="back-button"
                onClick={() => {
                  if (history.state?.portfolio) history.back()
                  else select(HOME)
                }}
              >
                <ArrowLeft size={15} /> Back
              </button>
              <ContentPanel
                node={node}
                onSelect={select}
                onClose={() => select(HOME)}
                onHighlight={() => setHighlight((h) => !h)}
              />
            </>
          )}
        </main>
        <footer className="statusbar">
          <span>
            <Sparkles size={12} /> <a href="/portfolio.html">{content.site.footer}</a>
          </span>
          <span className="route-status">
            {route.length > 1
              ? `${route.length - 1} connection${route.length > 2 ? 's' : ''} traversed`
              : 'YOUR JOURNEY STARTS HERE'}
            <span className="status-separator">/</span>
            <span className="live-dot" /> {home ? 'OVERVIEW' : node.label.toUpperCase()}
          </span>
        </footer>
      </div>
      <MobileNavigation selected={selected} category={node.category} onSelect={select} />
    </div>
  )
}
