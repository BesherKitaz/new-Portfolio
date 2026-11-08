import { useEffect, useRef } from 'react'
import { Compass, Box, Network, Menu, X, ArrowUpRight, Download } from 'lucide-react'
import { content } from '../content'
import { HOME } from '../hooks/useNavigation'

export default function MobileNavigation({
  selected,
  category,
  onSelect,
}: {
  selected: string
  category: string
  onSelect: (id: string) => void
}) {
  const menu = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const media = matchMedia(
      '(max-width:700px), (max-width:1000px) and (max-height:500px) and (pointer:coarse)',
    )
    const changed = () => {
      if (!media.matches) menu.current?.close()
    }
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [])
  const navigate = (id: string) => {
    menu.current?.close()
    onSelect(id)
  }
  return (
    <>
      <nav className="phone-navigation" aria-label="Phone navigation">
        <button
          aria-current={selected === HOME ? 'page' : undefined}
          onClick={() => navigate(HOME)}
        >
          <Compass size={20} />
          <span>Home</span>
        </button>
        <button
          aria-current={category === 'projects' ? 'page' : undefined}
          onClick={() => navigate('category:projects')}
        >
          <Box size={20} />
          <span>Projects</span>
        </button>
        <button
          aria-current={category === 'skills' ? 'page' : undefined}
          onClick={() => navigate('category:skills')}
        >
          <Network size={20} />
          <span>Skills</span>
        </button>
        <button aria-haspopup="dialog" onClick={() => menu.current?.showModal()}>
          <Menu size={20} />
          <span>Explore</span>
        </button>
      </nav>
      <dialog
        ref={menu}
        className="phone-menu"
        aria-labelledby="phone-menu-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) menu.current?.close()
        }}
      >
        <div className="phone-menu-content">
          <header>
            <h2 id="phone-menu-title">Explore the universe</h2>
            <button
              className="icon-button"
              onClick={() => menu.current?.close()}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </header>
          <div className="phone-menu-categories">
            {content.site.categories.map((c) => (
              <button key={c.id} onClick={() => navigate(`category:${c.id}`)}>
                <span style={{ background: c.color }} />
                {c.label}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          <a className="phone-resume" href={content.profile.resumeUrl} download>
            <Download size={18} /> Download résumé
          </a>
          <div className="phone-socials">
            {content.profile.socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                {s.label}
                <ArrowUpRight size={16} />
              </a>
            ))}
          </div>
        </div>
      </dialog>
    </>
  )
}
