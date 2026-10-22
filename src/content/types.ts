// Shape of the site's copy. `pl.ts` defines it, `en.ts` must match it key for key
// (enforced by the type and by a deep-shape test).

export interface Link {
  label: string;
  href: string;
}

export interface Offer {
  /** Short code shown next to the title, e.g. "P1". Empty when the offer has none. */
  code: string;
  title: string;
  summary: string;
  points: string[];
}

export interface Step {
  title: string;
  text: string;
}

export interface ProjectCard {
  title: string;
  summary: string;
  tags: string[];
}

export interface CaseStudy {
  /** `<title>` and meta description of the subpage. */
  metaTitle: string;
  metaDescription: string;
  card: ProjectCard;
  lead: string;
  /** Short honest label, e.g. "showcase project, fictional data". */
  kind: string;
  problem: string[];
  solution: { text: string[]; points: string[] };
  /** Optional ordered walkthrough (used by the tiller case study). */
  flow?: { title: string; steps: Step[] };
  demo: { title: string; text: string };
  stack: string[];
}

export interface SiteContent {
  meta: { title: string; description: string; siteName: string };
  nav: {
    label: string;
    services: string;
    process: string;
    projects: string;
    about: string;
    contact: string;
  };
  /** Anchor ids of the home page sections in this locale. */
  anchors: { services: string; process: string; projects: string; about: string; contact: string };
  hero: { eyebrow: string; title: string; lead: string; primaryCta: string; secondaryCta: string };
  services: {
    title: string;
    intro: string;
    manufacturing: { title: string; intro: string; offers: Offer[]; pricingNote: string };
    devTeams: { title: string; intro: string; offers: Offer[] };
  };
  process: {
    title: string;
    intro: string;
    steps: Step[];
    grants: {
      title: string;
      intro: string[];
      does: { title: string; points: string[] };
      doesNot: { title: string; points: string[] };
      source: Link;
      asOf: string;
    };
  };
  projects: { title: string; intro: string; cardCta: string };
  about: {
    title: string;
    text: string[];
    principlesTitle: string;
    principles: Step[];
  };
  contact: { title: string; text: string; emailLabel: string };
  footer: { note: string };
  caseStudy: {
    back: string;
    problem: string;
    solution: string;
    demo: string;
    demoFallback: string;
    /** Always shown under the demo: it is recorded and makes no API calls (D-023). */
    demoNote: string;
    demoFrameTitle: string;
    stack: string;
    repo: string;
    repoPending: string;
    repoPublic: string;
    ctaTitle: string;
    ctaText: string;
  };
  caseStudies: Record<ProjectSlug, CaseStudy>;
}

export const PROJECT_SLUGS = [
  'factory-twin',
  'production-docs-agent',
  'grant-assistant',
  'tiller',
] as const;
export type ProjectSlug = (typeof PROJECT_SLUGS)[number];

export interface Repo {
  /** `owner/name` on GitHub. */
  name: string;
  /** False until the owner reviews and publishes it (D-024): rendered as a marked placeholder. */
  public: boolean;
}

/** Repositories behind each case study. Language independent. */
export const REPOS: Record<ProjectSlug, Repo> = {
  'factory-twin': { name: 'Aberratio/factory-twin', public: false },
  'production-docs-agent': { name: 'Aberratio/production-docs-agent', public: false },
  'grant-assistant': { name: 'Aberratio/grant-assistant', public: false },
  tiller: { name: 'Aberratio/tiller', public: true },
};

/** The only contact channel on the site (D-028). Taken from the owner's CV `basics.email`. */
export const CONTACT_EMAIL = 'joanna@kokot.it';

export const SITE_ORIGIN = 'https://kokot.it';
