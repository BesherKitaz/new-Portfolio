# Besher Kitaz — Graph Portfolio

A graph-first portfolio built with React, TypeScript, Vite, React Three Fiber, Drei, Three.js, GSAP, Tailwind CSS, Lucide, and Zod. Verified résumé content generates an interconnected 3D universe with deterministic positions, weighted shortest-path navigation, HTML detail panels, deep links, and an accessible list view.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for content editing, privacy, screenshots, relationships, categories, résumé updates, and architecture. Production builds prerender the portfolio into the initial HTML and `/portfolio.html` for access without JavaScript or WebGL.

Browser checks: install Chromium with `npx playwright install chromium`, start the production preview on port 4173, and run `npm run test:browser`.

Code formatting: run `npm run format` to apply the shared Prettier style, or `npm run format:check` to check it. JSX uses readable line breaks and indentation; short tags stay compact.
