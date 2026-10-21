import type { SiteContent } from './types.ts';

// English copy. Same shape as `pl.ts`. Package prices are left out on purpose: the price
// list is awaiting the owner's approval (D-021).
export const en: SiteContent = {
  meta: {
    title: 'kokot.it — AI implementation for manufacturing and software teams',
    description:
      'AI agents for manufacturers (documents, quality, planning) and for software teams. Contractor quotes for grant-funded projects such as Dig.IT.',
    siteName: 'kokot.it',
  },
  nav: {
    label: 'Main navigation',
    services: 'Services',
    process: 'How we work',
    projects: 'Projects',
    about: 'About',
    contact: 'Contact',
  },
  anchors: {
    services: 'services',
    process: 'process',
    projects: 'projects',
    about: 'about',
    contact: 'contact',
  },
  hero: {
    eyebrow: 'AI and agentic engineering',
    title: 'AI agents that take over repetitive work on documents, data and code',
    lead: 'kokot.it designs and implements AI agents for manufacturers and software teams. The agent does the tedious part of the work; a person approves what matters.',
    primaryCta: 'See services',
    secondaryCta: 'Send an e-mail',
  },
  services: {
    title: 'Services',
    intro:
      'Two audiences, one approach: process and data first, then the agent, and a measurable result at the end.',
    manufacturing: {
      title: 'For manufacturers',
      intro:
        'Orders, specifications, quality reports, the production plan: in many plants a lot of time goes into retyping data between documents, spreadsheets and the ERP. This is where an AI agent pays off fastest. The packages fit grant-funded digital transformation projects, and can also be ordered without a grant.',
      offers: [
        {
          code: 'P1',
          title: 'AI assessment and implementation plan',
          summary:
            'For a company that wants to adopt AI but does not yet know which process to start with or how to describe the order.',
          points: [
            'on-site workshop and a review of 3–5 processes: documents, quality, planning, maintenance',
            'review of systems (ERP, MES, spreadsheets, e-mail) and of data availability',
            '2–3 use cases with measures of benefit',
            'target architecture and an AI Act and GDPR risk review',
            'a vendor-neutral description of the order, which the company can send to several contractors for quotes',
          ],
        },
        {
          code: 'P2',
          title: 'AI agent for one process',
          summary:
            'One repetitive process automated end to end, e.g. orders and specifications → ERP, or non-conformance reports → quality register.',
          points: [
            'the agent extracts data from documents, checks it against rules and keeps a decision trail',
            'uncertain fields go to a person for review instead of being guessed',
            'integration with the ERP, MES, spreadsheets or e-mail',
            'a pilot on the company’s own documents and a test report: handling time per document, error rate',
            'user training, documentation, and source code with transfer of economic copyright',
          ],
        },
        {
          code: 'P3',
          title: 'AI implementation programme',
          summary:
            'Several processes on a shared agent platform plus a digital twin of the shop floor, delivered in stages.',
          points: [
            'agents for 2–3 processes, e.g. documents, quality and planning',
            'a shop-floor digital twin: 3D model, a data layer from the MES or production logs, and an agent that answers questions about orders, downtime and quality',
            'ERP and MES integrations, user permissions',
            'a training programme for operators, team leads and the administrator',
            'measuring indicators before and after the rollout',
          ],
        },
      ],
      pricingNote:
        'The price depends on scope, the number of integrations and data quality. It is set in the quote, after a conversation or after the assessment (P1).',
    },
    devTeams: {
      title: 'For software teams',
      intro:
        'AI agents speed up software delivery as long as the process keeps them in check: a plan before code, a test before implementation, review against the team’s own agreements, clear permission boundaries.',
      offers: [
        {
          code: '',
          title: 'Workshop and process review',
          summary:
            'A walk through how a change moves in the team: ticket, plan, code, review, release. The result is a plan for a pilot with agents.',
          points: [
            'where an agent genuinely shortens the work and where it adds risk',
            'which team conventions the agent has to know and where it reads them from',
            'pilot measures, e.g. time from ticket to PR and the number of fixes after review',
          ],
        },
        {
          code: '',
          title: 'Rolling out an agentic workflow',
          summary:
            'Procedures for agents fitted to the team’s repositories and tested on real tickets.',
          points: [
            'procedures (skills) from ticket plan through TDD to review and PR, kept apart from project facts',
            'two-axis review: conformance to standards and to the specification',
            'permissions and guards: what the agent may not do without a person',
            'a pilot on the team’s tickets and a handover of the process to the team',
          ],
        },
      ],
    },
  },
  process: {
    title: 'How we work',
    intro:
      'Every project starts with the process and the data, not with picking a model. An agent is only as good as the data it gets and the rules that check it.',
    steps: [
      {
        title: 'Conversation',
        text: 'A few sentences by e-mail: which process, which systems, what deadline. The reply has clarifying questions or a proposed next step.',
      },
      {
        title: 'Assessment',
        text: 'A short analysis or the full P1 package: processes, data, risks and use cases with measures.',
      },
      {
        title: 'Quote',
        text: 'A fixed price split into stages and milestones. For a grant-funded project: in the programme’s cost categories.',
      },
      {
        title: 'Delivery',
        text: 'In stages, with a pilot on the company’s data and an acceptance step for every milestone.',
      },
      {
        title: 'Handover',
        text: 'Training, technical and user documentation, source code. The company does not depend on the contractor.',
      },
    ],
    grants: {
      title: 'Grants: the Dig.IT example',
      intro: [
        'Dig.IT 2/2026, run by the Polish Industrial Development Agency (ARP), funds the digital transformation of manufacturing SMEs, including AI. Applications are open from 2 to 30 November 2026 and the call may close early. The grant covers up to 50% of eligible costs, and the applicant attaches at least three price quotes from contractors.',
        'kokot.it can be one of those contractors.',
      ],
      does: {
        title: 'What kokot.it does',
        points: [
          'prepares the contractor’s quote for the application: scope, schedule and price in the programme’s categories (software development, implementation, training)',
          'can run the assessment (P1) before the application, paid by the company outside the project',
          'if the company chooses kokot.it when the project starts, delivers the solution and hands over the code with the economic copyright',
        ],
      },
      doesNot: {
        title: 'What kokot.it does not do',
        points: [
          'does not write grant applications; the company files the application, on its own or with an adviser',
          'does not promise that the grant will be awarded; the programme operator decides',
          'does not start work covered by the project before the application is filed, because an early start makes the costs ineligible',
        ],
      },
      source: {
        label: 'Programme terms: digit.arp.pl (in Polish)',
        href: 'https://digit.arp.pl/eventy/nabory/digit-konkurs-22026/',
      },
      asOf: 'Information as of 21 October 2026. Check the current rules before deciding.',
    },
  },
  projects: {
    title: 'Projects',
    intro:
      'Four showcase projects: three demos built on fictional company data, and tiller, an in-house tool with public code. They show the way of working and the architecture; they are not client deployments. The demos on this site replay recorded runs and make no API calls.',
    cardCta: 'Case study',
  },
  about: {
    title: 'About kokot.it',
    text: [
      'kokot.it is an engineering services brand focused on AI and agentic engineering: from process analysis, through agents and integrations, to the interface people actually use. This site and the showcase projects are examples of that work.',
      'Every project has one lead who is responsible for it from the first conversation to the rollout. Each quote states who delivers the work and how, in line with the rules of the funding programme involved.',
    ],
    principlesTitle: 'Principles',
    principles: [
      {
        title: 'A person approves',
        text: 'The agent prepares and checks; a person approves the decisions that matter.',
      },
      {
        title: 'A measurable goal',
        text: 'Before the start we agree what to measure: handling time, error rate, downtime.',
      },
      {
        title: 'Data under control',
        text: 'Models from providers with EU data residency, or local models, depending on the company’s requirements.',
      },
      {
        title: 'No lock-in',
        text: 'Code, documentation and know-how stay with the company.',
      },
    ],
  },
  contact: {
    title: 'Contact',
    text: 'A few sentences are enough: which process you want to improve, which systems the company uses (ERP, MES, spreadsheets) and what the deadline is, e.g. a grant call.',
    emailLabel: 'Write to',
  },
  footer: {
    note: 'The companies, documents and production data in the demos on this site are fictional.',
  },
  caseStudy: {
    back: 'All projects',
    problem: 'Problem',
    solution: 'Solution',
    demo: 'Demo',
    demoFallback: 'If the demo does not show here, the description above explains how it works.',
    demoNote: 'Recorded demo: it replays a saved run and makes no API calls.',
    demoFrameTitle: 'Recorded project demo',
    stack: 'Stack',
    repo: 'Repository',
    repoPending: 'the repository will be made public after review',
    repoPublic: 'the code is public',
    ctaTitle: 'A similar problem in your company?',
    ctaText: 'Describe the process in a few sentences.',
  },
  caseStudies: {
    'factory-twin': {
      metaTitle: 'Shop-floor digital twin with an AI agent — kokot.it',
      metaDescription:
        'Showcase project: a 3D production hall with machine status and an AI agent that answers questions about orders, downtime and quality.',
      card: {
        title: 'Shop-floor digital twin with an AI agent',
        summary:
          'A 3D hall with machine status. The agent answers questions about orders, downtime and quality and shows the answer in the scene.',
        tags: ['manufacturing', 'Three.js', 'AI agent'],
      },
      lead: 'A 3D production hall where an AI agent answers questions about the state of production and shows the answer on the model: it highlights the machine and moves the camera.',
      kind: 'Showcase project, fictional company and data',
      problem: [
        'Information about the state of production is scattered: orders in the ERP, downtime in the maintenance log, quality inspection results in separate spreadsheets. Answering “why is line 2 stopped and which orders are at risk” means looking in several places.',
        'Reports and dashboards show numbers, but rarely show where on the floor the problem is.',
      ],
      solution: {
        text: [
          'A 3D model of the hall with lines and machines that display their status. Next to it, a conversation with an AI agent that uses tools to answer: queries about orders, downtime and quality inspection results. Every answer also has an action in the scene, so you can see which machine it is about.',
        ],
        points: [
          'the agent uses only the data exposed through its tools, not general knowledge',
          'a text answer plus an action in the scene: machine highlight, camera move',
          'demo data: a fictional company, orders, downtime and quality inspection results',
          'a recorded mode at no cost and a live mode with an API key, run locally',
        ],
      },
      demo: {
        title: 'Demo: questions about the hall',
        text: 'A few recorded scenarios, e.g. a question about downtime on a line and about orders at risk of delay.',
      },
      stack: ['TypeScript', 'Three.js', 'Vite', 'Claude API (tool use)', 'Vitest'],
    },
    'production-docs-agent': {
      metaTitle: 'Production documents agent — kokot.it',
      metaDescription:
        'Showcase project: an AI agent reads purchase orders and quality reports, fills a spreadsheet or ERP records and flags uncertain fields for review.',
      card: {
        title: 'Production documents agent',
        summary:
          'Orders and quality reports from PDFs and e-mails turned into spreadsheet or ERP records, with a person reviewing.',
        tags: ['documents', 'quality', 'ERP'],
      },
      lead: 'The agent reads orders and quality reports in different formats, extracts their data into a fixed schema, and hands the fields it is not sure about to a person.',
      kind: 'Showcase project, fictional documents',
      problem: [
        'Orders arrive as PDFs, scans or e-mail bodies, each with its own layout. Quality reports have their own forms. Someone retypes them into a spreadsheet or the ERP, which takes time and causes mistakes that surface only on the shop floor or in a complaint.',
        'Full automation without control is risky: a missing field or an ambiguous quantity must not be “guessed”.',
      ],
      solution: {
        text: [
          'The agent turns a document into data in a fixed schema, checks it against rules and flags uncertain fields. The interface shows the document on the left and the extracted data on the right, with the fields to check highlighted. Approved data goes to the export.',
        ],
        points: [
          'extraction into a schema (structured output) and rule validation',
          'hard cases, such as a missing field or an ambiguity, are flagged, not guessed',
          'export to CSV and XLSX, standing in for an ERP integration in the demo',
          'a recorded mode at no cost and a live mode with an API key, run locally',
        ],
      },
      demo: {
        title: 'Demo: from document to record',
        text: 'Recorded runs on several fictional orders and quality reports, including documents with missing data.',
      },
      stack: ['TypeScript', 'Vite', 'Claude API (structured output)', 'SheetJS', 'Vitest'],
    },
    'grant-assistant': {
      metaTitle: 'Grant application assistant — kokot.it',
      metaDescription:
        'Showcase project: matching a company to funding calls with explicit eligibility rules, plus a draft project description. Not legal advice or a grant guarantee.',
      card: {
        title: 'Grant application assistant',
        summary:
          'Matches a company to funding calls with explicit rules and drafts a project description for the best match.',
        tags: ['grants', 'rules', 'AI agent'],
      },
      lead: 'From a short company profile, the assistant checks the conditions of several funding calls, points out the unmet ones and drafts a project description for the best match.',
      kind: 'Showcase project, call data with an as-of date',
      problem: [
        'A company considering a grant first has to work out which calls it qualifies for at all: company age, financial result, industry, region. These conditions are spread across rulebooks, and the first assessment takes time for the company and its adviser.',
      ],
      solution: {
        text: [
          'Eligibility conditions are written as explicit, tested rules rather than left to the model’s judgement. The language model only drafts the project description for the best match. The result also lists the documents to prepare.',
          'The assistant helps with a first assessment; it does not replace the application or an adviser, is not legal advice and does not guarantee a grant. Call data carries an as-of date and links to the sources.',
        ],
        points: [
          'rules e.g. for Dig.IT: years in business, positive result, manufacturing profile',
          'a list of matches with reasons and unmet conditions',
          'a draft project description and a list of documents to prepare',
          'the disclaimer visible in the interface',
        ],
      },
      demo: {
        title: 'Demo: matching to funding calls',
        text: 'Recorded runs for several fictional company profiles.',
      },
      stack: ['TypeScript', 'Vite', 'Zod', 'Claude API', 'Vitest'],
    },
    tiller: {
      metaTitle: 'Agentic dev workflow: the tiller case study — kokot.it',
      metaDescription:
        'Case study: tiller, a set of procedures for AI agents in software delivery, from ticket plan through TDD to review.',
      card: {
        title: 'Agentic dev workflow: tiller',
        summary:
          'Procedures for AI agents from ticket plan through TDD to review, kept apart from the facts of any one project.',
        tags: ['software teams', 'AI agents', 'open source'],
      },
      lead: 'tiller is a set of procedures for AI agents in software delivery. The procedures are shared by every project; the facts of a given project live in its profile.',
      kind: 'Own tool, public repository',
      problem: [
        'Instructions for AI agents that grow inside one project absorb its facts: merge rules, test commands, environment hosts. Moving them to a second project means copying and hand-editing, and an agent without clear rules can apply one project’s rules to another.',
      ],
      solution: {
        text: [
          'The procedure, meaning how a ticket is opened, planned, tested, reviewed and merged, is kept apart from the project’s facts. Every procedure starts by resolving the project’s profile and stops if it finds none.',
        ],
        points: [
          'flow-* procedures with no project facts in them',
          'a project profile: merge rules, test commands, quality gates',
          'two-axis review: standards and specification, never merged into one score',
          'access guards and a leak guard that rejects content naming projects or credentials',
        ],
      },
      flow: {
        title: 'How a ticket moves',
        steps: [
          { title: 'Start', text: 'Ticket, branch and a short agreement on intent before code.' },
          {
            title: 'Plan',
            text: 'Checking the ticket’s premise against the repository and planning the change.',
          },
          { title: 'TDD', text: 'A test that fails first, then the implementation.' },
          {
            title: 'Review',
            text: 'Review against standards and against the specification, separately.',
          },
          {
            title: 'Verdict',
            text: 'A readiness verdict on the branch and a pull request; merging follows the profile’s rules.',
          },
        ],
      },
      demo: {
        title: 'Recorded run',
        text: 'A recorded run on a synthetic, public example.',
      },
      stack: ['Claude Code', 'Codex', 'Bash', 'Node.js', 'GitHub CLI'],
    },
  },
};
