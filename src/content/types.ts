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
  /** Short honest label, e.g. "reference solution, sample data". */
  kind: string;
  problem: string[];
  solution: { text: string[]; points: string[] };
  /** Optional ordered walkthrough (used by the tiller case study). */
  flow?: { title: string; steps: Step[]; diagram?: FlowDiagram };
  /** Caption of the embedded application or of the sample run: what the reader sees. */
  preview: { title: string; text: string };
  /**
   * A static, illustrative session log shown in place of an embedded application. It is text in
   * the page, so it needs no JavaScript and no published application.
   */
  transcript?: Transcript;
  /** Facts with their source in the public repository, and lessons drawn from them. */
  results?: Results;
  stack: string[];
}

/** One box of the flow diagram: a stage, the skill that runs it and a short note. */
export interface DiagramNode {
  label: string;
  skill: string;
  note: string;
  /** Whether the step writes the branch's decision ledger or reads it (drawn on the side rail). */
  ledger?: 'write' | 'read';
}

/**
 * Inline SVG flow diagram. Rows are drawn top to bottom; a row of two nodes runs side by side.
 * Every label is SVG text, so it stays selectable, translatable and readable by assistive tech.
 */
export interface FlowDiagram {
  /** SVG `<title>`: the accessible name. */
  title: string;
  /** SVG `<desc>`: the whole flow in one paragraph, for readers who cannot see the drawing. */
  desc: string;
  caption: string;
  rows: DiagramNode[][];
  /** Label of the side rail: the branch's decision ledger, written by plan and TDD, read by reviews. */
  rail: string;
}

export interface TranscriptLine {
  /** `red` / `green` mark a failing / passing test run; `muted` an aside. */
  tone: 'plain' | 'red' | 'green' | 'muted';
  text: string;
}

export interface TranscriptEntry {
  /** What the person types, e.g. `/flow-tdd`. */
  command: string;
  output: TranscriptLine[];
}

export interface Transcript {
  /** Says plainly that the log is an illustration, not a recording of a real project. */
  label: string;
  intro: string;
  entries: TranscriptEntry[];
  note: string;
}

export interface Fact {
  value: string;
  label: string;
  /** Where the number can be checked in the public repository. */
  source: string;
}

export interface Results {
  title: string;
  intro: string;
  facts: Fact[];
  asOf: string;
  lessonsTitle: string;
  lessons: Step[];
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
    /** Heading of the section that embeds the reference application. */
    tryIt: string;
    /** Shown in place of the application until it loads (or without JavaScript). */
    toolFallback: string;
    /** Always shown under the application: it replays recorded runs and makes no API calls. */
    toolNote: string;
    toolFrameTitle: string;
    /** Link that opens the application on its own page, in a new tab. */
    toolOpen: string;
    /** Accessible hint appended to links that open a new tab. */
    newTab: string;
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
  /** False while the repository is private: rendered as a marked placeholder instead of a link. */
  public: boolean;
}

/** Repositories behind each case study. Language independent. */
export const REPOS: Record<ProjectSlug, Repo> = {
  'factory-twin': { name: 'Aberratio/factory-twin', public: true },
  'production-docs-agent': { name: 'Aberratio/production-docs-agent', public: true },
  'grant-assistant': { name: 'Aberratio/grant-assistant', public: true },
  tiller: { name: 'Aberratio/tiller', public: true },
};

/** The only contact channel on the site. */
export const CONTACT_EMAIL = 'joanna@kokot.it';

export const SITE_ORIGIN = 'https://kokot.it';

/**
 * Case studies that embed their reference application from `public/tools/<slug>/`
 * (built by scripts/sync-tools.ts from tools.lock.json). The others show a sample run as text.
 */
export const TOOL_SLUGS = ['factory-twin', 'production-docs-agent', 'grant-assistant'] as const;
export type ToolSlug = (typeof TOOL_SLUGS)[number];

export function isToolSlug(slug: ProjectSlug): slug is ToolSlug {
  return (TOOL_SLUGS as readonly string[]).includes(slug);
}
