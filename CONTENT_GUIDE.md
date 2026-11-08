# Maintaining the portfolio

Run `npm install`, then `npm run dev` to work locally. Run `npm test` and `npm run build` before deployment. `npm run preview` serves the production build, including the static text portfolio. Browser checks use `npx playwright install chromium` once, then `npm run preview -- --host 127.0.0.1 --port 4173` in one terminal and `npm run test:browser` in another.

## Where content lives

All professional information lives in `src/content/*.json`. `schema.ts` defines and validates each record; `index.ts` reports file names and field paths on errors. The graph builder also checks duplicate IDs, missing skills/projects, relationships, and layout overrides. Build-time prerendering runs the same validation. No résumé parsing occurs in the browser. Unknown facts and URLs remain null or empty.

- `profile.json`: name, role, bio, professional email, photo, résumé path, social links, research interests, publications, testimonials, and writing.
- `projects.json`: projects, technologies, case studies, screenshots, and verified outcomes.
- `experience.json`: professional work, internships, research, and teaching.
- `education.json`: degrees, coursework, and academic achievements.
- `skills.json`: technologies, tools, and practices.
- `leadership.json`: mentoring and leadership work.
- `relationships.json`: additional verified connections.
- `site.json`: site metadata, category labels, colors, positions, motion duration, and optional events.
- `layout.json`: optional node position overrides.

The original supplied résumé is retained locally in `.private/original-resume.pdf`, excluded from Git and hosting. Its phone number and header location were redacted from the downloadable version in `public/assets/resume/besher-kitaz-resume.pdf`. This deliberately keeps private information out of public assets. Do not move the unredacted original into `public/` without reviewing and authorizing its contents.

## Add or edit a project

Copy an existing record in `projects.json` and give it a unique lowercase ID. For example, the existing flashcard project contains:

```json
{
  "id": "ai-flashcards",
  "title": "AI Flash Cards",
  "summary": "Study with spaced repetition and generative AI.",
  "description": "A full-stack flashcard web app that uses the Google Gemini API to automatically generate study cards.",
  "featured": false,
  "technologies": ["react", "flask", "mysql", "gemini"],
  "highlights": ["Implemented a spaced-repetition algorithm."],
  "screenshots": [],
  "thumbnail": null,
  "githubUrl": "https://github.com/BesherKitaz/AIFlashCards",
  "liveUrl": null,
  "status": "completed",
  "caseStudy": {
    "problem": "",
    "solution": "A full-stack flashcard application with spaced repetition and automated card generation.",
    "decisions": [],
    "contributions": ["Built the application using React, Flask, and MySQL."],
    "impact": []
  }
}
```

Edit `summary` for the list, `description` for an introduction, and `caseStudy` for the longer problem, solution, decisions, contributions, and outcomes. Leave unknown information empty. Preserve qualifications on estimates and potential users. Set `featured: true` to show a project in selected work; up to two are displayed in the compact overview, and every featured project remains in Projects. The node `project:ai-flashcards`, its panel, list entry, and skill edges are generated automatically.

### Screenshots and photos

Put images in `public/assets/projects/<project-id>/`. Set `screenshots` to records such as `{"src":"/assets/projects/ai-flashcards/study-session.webp","alt":"Flashcard study session showing the answer and review controls"}` once the real image exists. Set `thumbnail` to an image path if available. Use optimized WebP/AVIF images and descriptive alt text. Set `profile.photo` to a professional photograph in `public/assets/`; the About panel displays it. Do not fabricate screenshots or photographs.

### Connect projects and skills

`technologies` references skill IDs, not display names. Adding `"react"` creates the edge to `skill:react`. To add a technology, add `{"id":"your-stable-id","name":"Verified technology name","group":"Tools","description":""}` to `skills.json`, then reference that ID in relevant projects, experiences, or leadership records. A skill node displays all its connected projects and experiences. Do not list a technology against a project unless its use is verified.

## Experience, education, and leadership

Copy an appropriate record. Dates use `YYYY-MM`; use `end: null` only for a verified ongoing role. Experience `kind` supports `professional`, `internship`, `research`, and `teaching`. `projectIds: ["safetyhub"]` links Purdue to SafetyHub automatically. Leadership records have optional organizations and URLs. Education supports achievements and coursework. Changes update the graph, panel, lists, and static portfolio after rebuilding.

## Additional relationships

Use `relationships.json` only for connections not already derived from technologies or project IDs. Example shape:

```json
[
  {"source":"skill:react","target":"skill:typescript","type":"used-together","weight":1}
]
```

Add this only if you want to explicitly describe that relationship. This example is not prepopulated. Edges are undirected for navigation. Omit weight for one hop; positive weights enable Dijkstra routes with meaningful costs. A missing node, duplicate pair (including reversed pairs), or duplicate ID fails validation.

## Colors, position, and motion

Edit a category's hex `color` in `site.json`; entries inherit it. Edit category `position: [x,y,z]` to move a cluster. Entry positions are hashes of stable IDs, so adding records never reshuffles existing entries. `layout.json` can override any node, for example `{"project:safetyhub":[-6,3,1]}`. Do not rename IDs casually: they determine positions, relationships, and incoming links. `motionDuration` controls total camera travel time; operating-system reduced motion skips the animation.

## Résumé and social links

Replace `public/assets/resume/besher-kitaz-resume.pdf` with a reviewed, privacy-safe PDF. If the filename changes, update `profile.resumeUrl`. Résumé view/download actions and the static page use that path. Manually update the JSON to reflect new résumé facts. Change `profile.socials` to update professional links throughout the site. Never put personal phone numbers, addresses, or immigration details in public files without explicit authorization.

## Direct links and accessible content

Use `/#node=project%3Asafetyhub` for SafetyHub, `/#node=skill%3Areact` for React, or any other stable node ID. Browser Back/Forward, breadcrumbs, sidebar, search, and minimap share the same navigation state. List view provides HTML navigation without manipulating the scene. Production builds include all essential content in the initial HTML and generate `/portfolio.html` for a standalone, JavaScript-free version. The footer links to it. Rebuild after content changes.

## Optional writing, publications, events, and testimonials

These arrays are intentionally empty. To add content, add a corresponding category in `site.json` first (`writing`, `publications`, `events`, or `testimonials`), then use `{"id":"stable-id","title":"Verified title","summary":"Verified description","url":null}`. Writing, publications, and testimonials live in `profile.json`; events live in `site.json`. Existing renderer and graph construction handle those types. Research interests are strings in `profile.researchInterests` and appear under About. Never invent testimonials, publications, or event participation.

## Add a graph category

For an existing supported collection, add its category configuration with a unique ID, label, hex color, and 3D position. Sidebar, list sections, category node, color inheritance, and minimap update automatically. For a completely new data collection, define its schema and load it in `content/index.ts`, then add an `addEntries(type, category, entries)` call in `graph/model.ts`. Extend the `Entry` union if the record shape differs. Add a content panel renderer only when it needs fields beyond title, summary, and URL. This is an intentional schema change; adding records to existing categories never requires React or Three.js edits.

## Architecture

`content/` owns data and validation. `graph/model.ts` owns construction, reference checks, and stable layout. `graph/pathfinding.ts` owns weighted shortest paths. `hooks/useNavigation.ts` owns deep links and browser history. `components/GraphScene.tsx` owns rendering, orbit controls, and GSAP camera travel. `components/ContentPanel.tsx` owns readable content. `App.css` owns the interface, responsive rules, and reduced-motion styling. `scripts/prerender.tsx` creates static HTML from the same validated content. No database, authentication system, CMS, or backend is needed.

## Phone layout

Phones have a persistent Home / Projects / Skills / Explore navigation bar. Explore includes every category, résumé download, and professional social links. The overview and list use normal vertical scrolling; details open in a larger independently scrolling panel with a sticky close control. Search uses 16px inputs to avoid automatic iOS zoom, and the layout respects safe-area insets and dynamic viewport height. Touch instructions describe swipe and pinch gestures. The phone graph reduces background stars and hides unrelated entry nodes until exploration, while preserving the same data and relationships. Landscape touch devices up to 1000px wide use the phone layout when the viewport is short. Browser tests cover 320, 390, and 430px portrait widths, 844px landscape, and resizing an open menu to desktop.
