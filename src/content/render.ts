import {
  DEFAULT_LOCALE,
  homePath,
  LOCALES,
  messages,
  PROJECTS_SEGMENT,
  projectPath,
  type Locale,
} from '../i18n/index.ts';
import { renderFlowDiagram } from './diagram.ts';
import { en } from './en.ts';
import { escapeHtml } from './html.ts';
import { pl } from './pl.ts';
import {
  CONTACT_EMAIL,
  PROJECT_SLUGS,
  REPOS,
  SITE_ORIGIN,
  type CaseStudy,
  type Offer,
  type ProjectSlug,
  type Results,
  type SiteContent,
  type Step,
  type Transcript,
} from './types.ts';

// Renders every page of the site to static HTML at build time, so the content is
// readable without JavaScript or WebGL. The Vite plugin in src/build/content-plugin.ts
// pours the output into the thin `index.html` shells.

const CONTENT: Record<Locale, SiteContent> = { pl, en };
const OG_LOCALE: Record<Locale, string> = { pl: 'pl_PL', en: 'en_GB' };

function otherLocale(locale: Locale): Locale {
  return LOCALES.find((l) => l !== locale) ?? DEFAULT_LOCALE;
}

export function content(locale: Locale): SiteContent {
  return CONTENT[locale];
}

export type Route =
  { locale: Locale; page: 'home' } | { locale: Locale; page: 'project'; slug: ProjectSlug };

export function isProjectSlug(value: string): value is ProjectSlug {
  return (PROJECT_SLUGS as readonly string[]).includes(value);
}

/** Every page the site has, in both locales. */
export function allRoutes(): Route[] {
  return LOCALES.flatMap((locale): Route[] => [
    { locale, page: 'home' },
    ...PROJECT_SLUGS.map((slug): Route => ({ locale, page: 'project', slug })),
  ]);
}

export function routePath(route: Route): string {
  return route.page === 'home' ? homePath(route.locale) : projectPath(route.locale, route.slug);
}

/** The same page in the other locale. */
export function counterpart(route: Route, locale: Locale): Route {
  return { ...route, locale };
}

/**
 * Route of a page shell from its path relative to the project root (posix or win32
 * separators): `index.html`, `en/index.html`, `projekty/<slug>/index.html`,
 * `en/projects/<slug>/index.html`. Returns undefined for anything else.
 */
export function routeFromFile(relativePath: string): Route | undefined {
  const parts = relativePath.split(/[\\/]/).filter(Boolean);
  if (parts.at(-1) !== 'index.html') return undefined;
  const dirs = parts.slice(0, -1);
  const prefixed = LOCALES.find((l) => l !== DEFAULT_LOCALE && dirs[0] === l);
  const locale: Locale = prefixed ?? DEFAULT_LOCALE;
  const rest = prefixed ? dirs.slice(1) : dirs;
  if (rest.length === 0) return { locale, page: 'home' };
  const [section, slug] = rest;
  if (rest.length === 2 && section === PROJECTS_SEGMENT[locale] && slug && isProjectSlug(slug)) {
    return { locale, page: 'project', slug };
  }
  return undefined;
}

export { escapeHtml };

const e = escapeHtml;
const absolute = (path: string): string => `${SITE_ORIGIN}${path}`;
const list = <T>(items: readonly T[], item: (value: T) => string): string =>
  items.map(item).join('');
const paragraphs = (texts: readonly string[]): string => list(texts, (t) => `<p>${e(t)}</p>`);

export interface RenderedPage {
  lang: Locale;
  head: string;
  body: string;
}

export function renderPage(route: Route): RenderedPage {
  const c = content(route.locale);
  let title = c.meta.title;
  let description = c.meta.description;
  let main: string;
  if (route.page === 'project') {
    const study = c.caseStudies[route.slug];
    title = study.metaTitle;
    description = study.metaDescription;
    main = renderCaseStudy(route.locale, route.slug, study);
  } else {
    main = renderHome(route.locale);
  }
  return {
    lang: route.locale,
    head: renderHead(route, title, description),
    body: [renderHeader(route), `<main id="content">`, main, `</main>`, renderFooter(route)].join(
      '\n',
    ),
  };
}

function renderHead(route: Route, title: string, description: string): string {
  const url = absolute(routePath(route));
  const alternates = LOCALES.map(
    (locale) =>
      `<link rel="alternate" hreflang="${locale}" href="${e(absolute(routePath(counterpart(route, locale))))}" />`,
  );
  const xDefault = absolute(routePath(counterpart(route, DEFAULT_LOCALE)));
  return [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(description)}" />`,
    `<link rel="canonical" href="${e(url)}" />`,
    ...alternates,
    `<link rel="alternate" hreflang="x-default" href="${e(xDefault)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${e(content(route.locale).meta.siteName)}" />`,
    `<meta property="og:title" content="${e(title)}" />`,
    `<meta property="og:description" content="${e(description)}" />`,
    `<meta property="og:url" content="${e(url)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[route.locale]}" />`,
  ].join('\n    ');
}

function renderHeader(route: Route): string {
  const c = content(route.locale);
  const t = messages(route.locale);
  const home = homePath(route.locale);
  const other = otherLocale(route.locale);
  const anchor = (key: keyof SiteContent['anchors']): string =>
    `<li><a href="${e(`${home}#${c.anchors[key]}`)}">${e(c.nav[key])}</a></li>`;
  return [
    `<a class="skip-link" href="#content">${e(t.skipToContent)}</a>`,
    `<header class="site-header">`,
    // Logo from the brand system (T-03, public/brand/); the alt text keeps the name readable.
    `<a class="site-logo" href="${e(home)}"><img src="/brand/logo.svg" alt="kokot.it" width="91" height="24" /></a>`,
    `<nav class="site-nav" aria-label="${e(c.nav.label)}"><ul>`,
    anchor('services'),
    anchor('process'),
    anchor('projects'),
    anchor('about'),
    anchor('contact'),
    `</ul></nav>`,
    `<a class="lang-switch" data-lang-switch href="${e(routePath(counterpart(route, other)))}" hreflang="${other}" lang="${other}">${e(t.langSwitch.label)}</a>`,
    `</header>`,
  ].join('\n');
}

function renderFooter(route: Route): string {
  const c = content(route.locale);
  return [
    `<footer class="site-footer">`,
    `<p>${e(c.footer.note)}</p>`,
    `<p><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>`,
    `<p>© 2026 kokot.it</p>`,
    `</footer>`,
  ].join('\n');
}

function renderOffer(offer: Offer): string {
  const code = offer.code ? `<span class="offer__code">${e(offer.code)}</span> ` : '';
  return [
    `<article class="offer">`,
    `<h4 class="offer__title">${code}${e(offer.title)}</h4>`,
    `<p>${e(offer.summary)}</p>`,
    `<ul class="offer__points">${list(offer.points, (p) => `<li>${e(p)}</li>`)}</ul>`,
    `</article>`,
  ].join('');
}

function renderSteps(steps: readonly Step[], className = 'steps'): string {
  return `<ol class="${className}">${list(
    steps,
    (s) =>
      `<li class="steps__item"><h3 class="steps__title">${e(s.title)}</h3><p>${e(s.text)}</p></li>`,
  )}</ol>`;
}

function renderContact(locale: Locale, title: string, text: string, headingId: string): string {
  const c = content(locale);
  return [
    `<h2 id="${e(headingId)}">${e(title)}</h2>`,
    `<p>${e(text)}</p>`,
    `<p class="contact__email">${e(c.contact.emailLabel)} <a class="button" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>`,
  ].join('');
}

function renderHome(locale: Locale): string {
  const c = content(locale);
  const a = Object.fromEntries(
    Object.entries(c.anchors).map(([key, id]) => [key, e(id)]),
  ) as SiteContent['anchors'];
  const s = c.services;
  const g = c.process.grants;
  const cards = list(PROJECT_SLUGS, (slug) => {
    const card = c.caseStudies[slug].card;
    return [
      `<li class="card">`,
      `<h3 class="card__title"><a href="${e(projectPath(locale, slug))}">${e(card.title)}</a></h3>`,
      `<p>${e(card.summary)}</p>`,
      `<ul class="tags">${list(card.tags, (t) => `<li>${e(t)}</li>`)}</ul>`,
      `<a class="card__cta" href="${e(projectPath(locale, slug))}" aria-hidden="true" tabindex="-1">${e(c.projects.cardCta)} →</a>`,
      `</li>`,
    ].join('');
  });

  return [
    `<section class="hero" aria-labelledby="hero-title">`,
    // Mount point for the 3D scene (T-08). The hero's text does not depend on it.
    `<div id="scene-root" class="hero__scene" aria-hidden="true"></div>`,
    `<div class="hero__content">`,
    `<p class="eyebrow">${e(c.hero.eyebrow)}</p>`,
    `<h1 id="hero-title">${e(c.hero.title)}</h1>`,
    `<p class="lead">${e(c.hero.lead)}</p>`,
    `<p class="hero__actions"><a class="button" href="#${a.services}">${e(c.hero.primaryCta)}</a> <a class="button button--ghost" href="mailto:${CONTACT_EMAIL}">${e(c.hero.secondaryCta)}</a></p>`,
    `</div>`,
    `</section>`,

    `<section class="section" id="${a.services}" aria-labelledby="${a.services}-title">`,
    `<h2 id="${a.services}-title">${e(s.title)}</h2>`,
    `<p class="lead">${e(s.intro)}</p>`,
    `<div class="audience">`,
    `<h3>${e(s.manufacturing.title)}</h3>`,
    `<p>${e(s.manufacturing.intro)}</p>`,
    `<div class="offers">${list(s.manufacturing.offers, renderOffer)}</div>`,
    `<p class="note">${e(s.manufacturing.pricingNote)}</p>`,
    `</div>`,
    `<div class="audience">`,
    `<h3>${e(s.devTeams.title)}</h3>`,
    `<p>${e(s.devTeams.intro)}</p>`,
    `<div class="offers">${list(s.devTeams.offers, renderOffer)}</div>`,
    `</div>`,
    `</section>`,

    `<section class="section" id="${a.process}" aria-labelledby="${a.process}-title">`,
    `<h2 id="${a.process}-title">${e(c.process.title)}</h2>`,
    `<p class="lead">${e(c.process.intro)}</p>`,
    renderSteps(c.process.steps),
    `<div class="grants">`,
    `<h3>${e(g.title)}</h3>`,
    paragraphs(g.intro),
    `<div class="grants__columns">`,
    `<div><h4>${e(g.does.title)}</h4><ul>${list(g.does.points, (p) => `<li>${e(p)}</li>`)}</ul></div>`,
    `<div><h4>${e(g.doesNot.title)}</h4><ul>${list(g.doesNot.points, (p) => `<li>${e(p)}</li>`)}</ul></div>`,
    `</div>`,
    `<p class="note">${e(g.asOf)} <a href="${e(g.source.href)}" rel="noopener">${e(g.source.label)}</a></p>`,
    `</div>`,
    `</section>`,

    `<section class="section" id="${a.projects}" aria-labelledby="${a.projects}-title">`,
    `<h2 id="${a.projects}-title">${e(c.projects.title)}</h2>`,
    `<p class="lead">${e(c.projects.intro)}</p>`,
    `<ul class="cards">${cards}</ul>`,
    `</section>`,

    `<section class="section" id="${a.about}" aria-labelledby="${a.about}-title">`,
    `<h2 id="${a.about}-title">${e(c.about.title)}</h2>`,
    paragraphs(c.about.text),
    `<h3>${e(c.about.principlesTitle)}</h3>`,
    `<ul class="principles">${list(
      c.about.principles,
      (p) => `<li><strong>${e(p.title)}.</strong> ${e(p.text)}</li>`,
    )}</ul>`,
    `</section>`,

    `<section class="section contact" id="${a.contact}" aria-labelledby="${a.contact}-title">`,
    renderContact(locale, c.contact.title, c.contact.text, `${a.contact}-title`),
    `</section>`,
  ].join('\n');
}

/** URL of a recorded demo published under `public/demos/<slug>/` (D-023). */
export function demoSrc(slug: ProjectSlug): string {
  return `/demos/${slug}/index.html?embed=1`;
}

function renderRepo(locale: Locale, slug: ProjectSlug): string {
  const cs = content(locale).caseStudy;
  const repo = REPOS[slug];
  const label = `github.com/${repo.name}`;
  if (repo.public) {
    return `<p><a href="https://${e(label)}" rel="noopener">${e(label)}</a> (${e(cs.repoPublic)})</p>`;
  }
  // Deliberate, marked placeholder: the repository is private until the owner publishes it (D-024).
  return `<p class="repo repo--pending" data-placeholder="repo-link"><span class="repo__name">${e(label)}</span> (${e(cs.repoPending)})</p>`;
}

function renderFlow(flow: NonNullable<CaseStudy['flow']>): string {
  const steps = flow.diagram
    ? [
        `<div class="flow">`,
        `<figure class="flow__figure">`,
        renderFlowDiagram(flow.diagram),
        `<figcaption class="note">${e(flow.diagram.caption)}</figcaption>`,
        `</figure>`,
        renderSteps(flow.steps, 'steps steps--list'),
        `</div>`,
      ].join('')
    : renderSteps(flow.steps);
  return [
    `<section class="section" aria-labelledby="flow-title">`,
    `<h2 id="flow-title">${e(flow.title)}</h2>`,
    steps,
    `</section>`,
  ].join('');
}

/**
 * An illustrative session log, rendered as text in the page. It replaces the lazy demo slot:
 * it needs no published demo file, no iframe and no JavaScript, and it says what it is.
 */
function renderTranscript(demo: CaseStudy['demo'], t: Transcript): string {
  const entries = list(t.entries, (entry) =>
    [
      `<li class="transcript__entry">`,
      `<p class="transcript__command"><span class="transcript__prompt" aria-hidden="true">›</span> <code>${e(entry.command)}</code></p>`,
      `<ul class="transcript__output">${list(
        entry.output,
        (line) =>
          `<li class="transcript__line transcript__line--${line.tone}">${e(line.text)}</li>`,
      )}</ul>`,
      `</li>`,
    ].join(''),
  );
  return [
    `<figure class="transcript">`,
    `<p class="eyebrow transcript__label">${e(t.label)}</p>`,
    `<p class="transcript__intro">${e(t.intro)}</p>`,
    `<ol class="transcript__log">${entries}</ol>`,
    `<figcaption><strong>${e(demo.title)}.</strong> ${e(demo.text)} <span class="demo__note">${e(t.note)}</span></figcaption>`,
    `</figure>`,
  ].join('');
}

function renderResults(r: Results): string {
  return [
    `<section class="section" aria-labelledby="results-title">`,
    `<h2 id="results-title">${e(r.title)}</h2>`,
    `<p class="lead">${e(r.intro)}</p>`,
    `<ul class="facts">${list(
      r.facts,
      (f) =>
        `<li class="fact"><span class="fact__value">${e(f.value)}</span> <span class="fact__label">${e(f.label)}</span> <code class="fact__source">${e(f.source)}</code></li>`,
    )}</ul>`,
    `<p class="note">${e(r.asOf)}</p>`,
    `<h3>${e(r.lessonsTitle)}</h3>`,
    `<ul class="principles lessons">${list(
      r.lessons,
      (l) => `<li><strong>${e(l.title)}.</strong> ${e(l.text)}</li>`,
    )}</ul>`,
    `</section>`,
  ].join('');
}

function renderCaseStudy(locale: Locale, slug: ProjectSlug, study: CaseStudy): string {
  const c = content(locale);
  const cs = c.caseStudy;
  const projectsAnchor = `${homePath(locale)}#${c.anchors.projects}`;
  return [
    `<article class="case-study">`,
    `<p class="back"><a href="${e(projectsAnchor)}">← ${e(cs.back)}</a></p>`,
    `<header class="case-study__header">`,
    `<p class="eyebrow">${e(study.kind)}</p>`,
    `<h1>${e(study.card.title)}</h1>`,
    `<p class="lead">${e(study.lead)}</p>`,
    `<ul class="tags">${list(study.card.tags, (t) => `<li>${e(t)}</li>`)}</ul>`,
    `</header>`,

    `<section class="section" aria-labelledby="problem-title">`,
    `<h2 id="problem-title">${e(cs.problem)}</h2>`,
    paragraphs(study.problem),
    `</section>`,

    `<section class="section" aria-labelledby="solution-title">`,
    `<h2 id="solution-title">${e(cs.solution)}</h2>`,
    paragraphs(study.solution.text),
    `<ul>${list(study.solution.points, (p) => `<li>${e(p)}</li>`)}</ul>`,
    `</section>`,

    study.flow ? renderFlow(study.flow) : '',

    `<section class="section" aria-labelledby="demo-title">`,
    `<h2 id="demo-title">${e(cs.demo)}</h2>`,
    study.transcript
      ? renderTranscript(study.demo, study.transcript)
      : [
          `<figure class="demo" data-demo-src="${e(demoSrc(slug))}" data-demo-title="${e(`${cs.demoFrameTitle}: ${study.card.title}`)}">`,
          `<div class="demo__frame" data-demo-slot><p class="demo__fallback">${e(cs.demoFallback)}</p></div>`,
          `<figcaption><strong>${e(study.demo.title)}.</strong> ${e(study.demo.text)} <span class="demo__note">${e(cs.demoNote)}</span></figcaption>`,
          `</figure>`,
        ].join(''),
    `</section>`,

    study.results ? renderResults(study.results) : '',

    `<section class="section" aria-labelledby="stack-title">`,
    `<h2 id="stack-title">${e(cs.stack)}</h2>`,
    `<ul class="tags">${list(study.stack, (t) => `<li>${e(t)}</li>`)}</ul>`,
    `</section>`,

    `<section class="section" aria-labelledby="repo-title">`,
    `<h2 id="repo-title">${e(cs.repo)}</h2>`,
    renderRepo(locale, slug),
    `</section>`,

    `<section class="section contact" aria-labelledby="cta-title">`,
    renderContact(locale, cs.ctaTitle, cs.ctaText, 'cta-title'),
    `</section>`,
    `</article>`,
  ].join('\n');
}

const HEAD_MARKER = '<!-- kokot:head -->';
const BODY_MARKER = '<!-- kokot:body -->';

/** Pours a rendered page into an `index.html` shell. Throws if the shell lacks a marker. */
export function fillShell(shell: string, route: Route): string {
  if (!shell.includes(HEAD_MARKER) || !shell.includes(BODY_MARKER)) {
    throw new Error(
      `Page shell for ${routePath(route)} is missing ${HEAD_MARKER} or ${BODY_MARKER}`,
    );
  }
  const page = renderPage(route);
  return shell
    .replace(/<html(\s[^>]*)?>/, (_tag, attrs: string | undefined) => {
      // Set lang from the route; keep any other attribute the shell carries.
      const rest = (attrs ?? '').replace(/\s+lang\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
      return `<html lang="${page.lang}"${rest}>`;
    })
    .replace(HEAD_MARKER, () => page.head)
    .replace(BODY_MARKER, () => page.body);
}
