# Reference applications and repository conventions — decisions

How the case studies embed the three reference applications, and the repository-wide wording
and language rules that came with them.

- 2026-10-22 — The applications are built from their public repositories at commits pinned in
  `tools.lock.json` and the static builds are committed under `public/tools/<slug>/` — the site's
  build and the Vercel deploy stay offline and deterministic, and a reviewer sees exactly what
  ships; the cost is about 1.8 MB of generated files, marked `linguist-generated` and `-diff`
- 2026-10-22 — The iframe is added by `src/embed.ts` when the figure nears the viewport (and also
  carries `loading="lazy"`), not written into the static HTML — the page stays light for
  Lighthouse and readers without JavaScript keep a text fallback and a link that opens the
  application in a new tab
- 2026-10-22 — `sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"`: without
  `allow-same-origin` the applications cannot load their own assets; the content is ours and
  pinned, so the combination is accepted
- 2026-10-22 — Height reports (`{ type: '<slug>:height', height }`) count only when
  `event.origin` is the site's own origin and `event.source` is one of the embedded frames;
  heights between 240 and 20 000 px are applied (Grant Assistant reports about 6 700 px on a
  phone)
- 2026-10-22 — Factory Twin posts no height: its frame keeps a 16:10 proportion (at least 34 rem)
  on wide screens and 90 % of the viewport height on phones; the section also links the
  application in a new tab for a full-screen view
- 2026-10-22 — The build guard skips the applications' own pages (`tools/<slug>/` for locked
  slugs only): their sample data legitimately shows amounts and long numbers, and each
  application repository runs its own wording check; an unknown directory under `tools/` is
  still held to the full rules
- 2026-10-22 — The section that embeds an application is called "Wypróbuj" / "Try it", and the
  note under it says "Zapisany przebieg" / "Recorded run" — "na żywo" / "live" is the name of
  the applications' own mode with a real API key, so it is not used for the recorded embed
- 2026-10-22 — The document template directories are English (`docs-templates/offer/`,
  `docs-templates/price-quote/`), but the generated PDF names stay Polish (`oferta-pl.pdf`,
  `oferta-cenowa-szablon-pl.pdf`): they are the documents sent to Polish companies
- 2026-10-22 — The language rule allows Polish only in the Polish copy and UI strings, the
  Polish document templates and their data, the brand preview's specimen and test fixtures;
  elsewhere Polish may appear in string literals (tests assert Polish output) and, in comments
  and Markdown, only inside backticks or double quotes
- 2026-10-22 — The wording rule exempts only the guard modules and their own tests, which have
  to spell out what they look for
- 2026-10-22 — The external costs of a price quote still have no Dig.IT cost category: which
  category a cloud or API subscription belongs to is a funding-rules question for the owner, not
  a code change
