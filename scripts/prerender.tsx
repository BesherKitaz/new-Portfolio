import React from 'react'
import { readFileSync, writeFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { content } from '../src/content/index'
import { graph, neighbors, nodeById } from '../src/graph/model'
const { profile, site } = content
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
const portfolio = renderToStaticMarkup(
  <main>
    <header>
      <p>{profile.role.toUpperCase()}</p>
      <h1>{profile.name}</h1>
      <p>{profile.bio}</p>
      <nav>
        <a href="/">Explore the 3D universe</a> ·{' '}
        <a href={profile.resumeUrl}>View résumé</a> ·{' '}
        <a href={profile.resumeUrl} download>
          Download résumé
        </a>{' '}
        · <a href={`mailto:${profile.email}`}>Contact</a>
        {profile.socials.map((s) => (
          <span key={s.label}>
            {' '}
            · <a href={s.url}>{s.label}</a>
          </span>
        ))}
      </nav>
    </header>
    {site.categories.map((c) => (
      <section key={c.id}>
        <h2>{c.label}</h2>
        {c.id === 'about' && <p>{profile.bio}</p>}
        {c.id === 'contact' && <a href={`mailto:${profile.email}`}>{profile.email}</a>}
        {graph.nodes
          .filter((n) => n.category === c.id && n.entry)
          .map((n) => {
            const e = n.entry!
            return (
              <article key={n.id} id={n.id}>
                <h3>
                  <a href={`/#node=${encodeURIComponent(n.id)}`}>{n.label}</a>
                </h3>
                {'organization' in e && <p>{e.organization}</p>}
                {'start' in e && (
                  <p>
                    {e.start} — {e.end ?? 'Present'}
                  </p>
                )}
                <p>{n.description}</p>
                {'description' in e && e.description !== n.description && (
                  <p>{e.description}</p>
                )}
                {'caseStudy' in e && (
                  <>
                    <p>{e.caseStudy.problem}</p>
                    <p>{e.caseStudy.solution}</p>
                    {[
                      ['Engineering decisions', e.caseStudy.decisions],
                      ['Contributions', e.caseStudy.contributions],
                      ['Outcomes', e.caseStudy.impact],
                    ].map(
                      ([label, items]) =>
                        Array.isArray(items) &&
                        items.length > 0 && (
                          <div key={String(label)}>
                            <h4>{label}</h4>
                            <ul>
                              {items.map((i) => (
                                <li key={i}>{i}</li>
                              ))}
                            </ul>
                          </div>
                        ),
                    )}
                    {e.githubUrl && <a href={e.githubUrl}>Source code</a>}
                    {e.liveUrl && <a href={e.liveUrl}>Live demo</a>}
                  </>
                )}
                {'highlights' in e && (
                  <ul>
                    {e.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                )}
                {'achievements' in e && (
                  <>
                    <ul>
                      {e.achievements.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                    <h4>Coursework</h4>
                    <ul>
                      {e.coursework.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </>
                )}
                {'url' in e && e.url && (
                  <p>
                    <a href={e.url}>External link</a>
                  </p>
                )}
                <p>
                  Connected to:{' '}
                  {neighbors(n.id)
                    .map((id) => nodeById.get(id)!)
                    .filter((x) => x.type !== 'category')
                    .map((x, i) => (
                      <span key={x.id}>
                        {i > 0 ? ', ' : ''}
                        <a href={`/#node=${encodeURIComponent(x.id)}`}>{x.label}</a>
                      </span>
                    ))}
                </p>
              </article>
            )
          })}
      </section>
    ))}
  </main>,
)
const style = /* HTML */ `<style>
  body {
    margin: 0;
    background: #090d17;
    color: #d4dced;
    font:
      16px/1.75 system-ui,
      sans-serif;
  }
  main {
    max-width: 850px;
    margin: auto;
    padding: 50px 24px;
  }
  header {
    border-bottom: 1px solid #344158;
    padding-bottom: 36px;
  }
  h1 {
    font-size: 42px;
    letter-spacing: -1px;
  }
  h2 {
    margin-top: 55px;
    color: #b7aaf1;
  }
  h3 {
    font-size: 22px;
  }
  a {
    color: #a8c3ff;
    text-underline-offset: 4px;
  }
  article {
    padding: 20px 0;
    border-bottom: 1px solid #273348;
  }
  nav {
    line-height: 2.2;
  }
  p {
    color: #a8b5cf;
  }
  a:focus-visible {
    outline: 2px solid #b7aaf1;
    outline-offset: 4px;
  }
</style>`

const head = /* HTML */ `
  <meta name="description" content="${escape(site.description)}" />
  <meta property="og:title" content="${escape(site.title)}" />
  <meta property="og:description" content="${escape(site.description)}" />
  <meta name="theme-color" content="#080b14" />
`

const index = readFileSync('dist/index.html', 'utf8')
  .replace('<title>new-portfolio</title>', `<title>${escape(site.title)}</title>`)
  .replace('</head>', head + '</head>')
  .replace('<div id="root"></div>', `<div id="root">${style}${portfolio}</div>`)
writeFileSync('dist/index.html', index)
writeFileSync(
  'dist/portfolio.html',
  /* HTML */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${escape(profile.name)} — Text portfolio</title>
        ${head}${style}
      </head>
      <body>
        ${portfolio}
      </body>
    </html>
  `,
)
console.log(
  `Validated and prerendered ${graph.nodes.length} nodes and ${graph.edges.length} relationships.`,
)
