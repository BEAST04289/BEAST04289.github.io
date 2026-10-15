# shaurya upadhyay — portfolio

Personal site: AI agents, RAG systems and the backend that ships them.

**Stack:** plain HTML/CSS + ES modules, [GSAP 3.15](https://gsap.com) (ScrollTrigger, SplitText, ScrambleText, DrawSVG),
[Lenis 1.3](https://github.com/darkroomengineering/lenis) smooth scroll, and a hand-written WebGL2 particle field. No build step.

## Run locally

```bash
python -m http.server 8080
# open http://localhost:8080
```

## Deploy

- **GitHub Pages:** push to a repo named `BEAST04289.github.io`; the site serves from `main` at the root.
- **Vercel:** import the repo, framework preset "Other", no build command, output directory `.`.

If the site moves to another domain, update the absolute URLs in `index.html` (`canonical`, `og:*`, JSON-LD),
`robots.txt` and `sitemap.xml`.

## Editing

All copy lives in `index.html`. Sections: hero → about → numbers → process (scrollytelling) → work (horizontal
gallery) → journey → stack → recognition → terminal → contact. Terminal commands are in `assets/js/terminal.js`.

Accessibility: everything renders without JavaScript, WebGL falls back to a static backdrop, and
`prefers-reduced-motion` turns off smooth scrolling, pinning and the particle field.

Fonts are self-hosted under the SIL Open Font License (see `assets/fonts/ofl-*.txt`).
