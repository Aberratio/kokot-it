import type { SiteContent } from './types.ts';

// English copy. Same shape as `pl.ts`. Package prices are left out on purpose until the price
// list is approved.
export const en: SiteContent = {
  meta: {
    title: 'kokot.it — AI implementation for manufacturing and software teams',
    description:
      'AI agents for manufacturers (documents, quality, planning) and for software teams. Contractor quotes for grant-funded projects such as Dig.IT.',
    siteName: 'kokot.it',
    ogImage: {
      headline: 'AI agents for manufacturing and software teams',
      alt: 'kokot.it — AI agents for manufacturing and software teams; behind the text, a network of agents handing tasks to each other.',
    },
    areaServed: ['Poland', 'European Union'],
  },
  nav: {
    label: 'Main navigation',
    services: 'Services',
    process: 'Process',
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
            'For a company that wants to adopt AI but does not yet know which process to start with or how to describe what it wants to buy.',
          points: [
            'on-site workshop and a review of 3–5 processes: documents, quality, planning, maintenance',
            'review of systems (ERP, MES, spreadsheets, e-mail) and of data availability',
            '2–3 use cases with measures of benefit',
            'target architecture and an AI Act and GDPR risk review',
            'a vendor-neutral description of what is to be bought, which the company can send to several contractors for quotes',
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
    title: 'How a project runs',
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
      'Five projects: three reference applications running on sample data from fictional companies, tiller, an in-house tool with public code, and Relay Defense, a logic game. They show the way of working and the architecture; they are not client deployments. The applications on this site make no API calls: the reference applications replay recorded runs, and the game runs entirely in the browser.',
    cardCta: 'Case study',
  },
  about: {
    title: 'About kokot.it',
    text: [
      'kokot.it is an engineering services brand focused on AI and agentic engineering: from process analysis, through agents and integrations, to the interface people actually use. This site and the reference projects are examples of that work.',
      'kokot.it runs each project directly, from the first conversation to the rollout. The quote sets out the scope and how the work is delivered, in line with the rules of the funding programme involved.',
    ],
    principlesTitle: 'Principles',
    principles: [
      {
        title: 'A person approves',
        text: 'The agent prepares and checks; a person approves the decisions that matter.',
      },
      {
        title: 'A measurable goal',
        text: 'Before the start, the project gets a success measure: handling time, error rate or downtime.',
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
    note: 'The reference applications on this site run on sample data: the companies, documents and production data are fictional.',
  },
  caseStudy: {
    back: 'All projects',
    problem: 'Problem',
    solution: 'Solution',
    tryIt: 'Try it',
    toolFallback:
      'The application loads here as you scroll and needs JavaScript. You can also open it in a separate tab.',
    toolNote:
      'Recorded run: the application replays saved answers on sample data and makes no API calls.',
    toolFrameTitle: 'Reference application',
    toolOpen: 'Open the application in a new tab',
    newTab: 'opens in a new tab',
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
        'Reference solution: a 3D production hall with machine status and an AI agent that answers questions about orders, downtime and quality.',
      card: {
        title: 'Shop-floor digital twin with an AI agent',
        summary:
          'A 3D hall with machine status. The agent answers questions about orders, downtime and quality and shows the answer in the scene.',
        tags: ['manufacturing', 'Three.js', 'AI agent'],
      },
      lead: 'A 3D production hall where an AI agent answers questions about the state of production and shows the answer on the model: it highlights the machine and moves the camera.',
      kind: 'Reference solution, sample data',
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
          'sample data: a fictional company, orders, downtime and quality inspection results',
          'a recorded mode at no cost and a live mode with an API key, run locally',
        ],
      },
      preview: {
        title: 'Questions about the hall',
        text: 'A few recorded scenarios, e.g. a question about downtime on a line and about orders at risk of delay.',
      },
      stack: ['TypeScript', 'Three.js', 'Vite', 'Claude API (tool use)', 'Vitest'],
    },
    'production-docs-agent': {
      metaTitle: 'Production documents agent — kokot.it',
      metaDescription:
        'Reference solution: an AI agent reads purchase orders and quality reports, fills a spreadsheet or ERP records and flags uncertain fields for review.',
      card: {
        title: 'Production documents agent',
        summary:
          'Orders and quality reports from PDFs and e-mails turned into spreadsheet or ERP records, with a person reviewing.',
        tags: ['documents', 'quality', 'ERP'],
      },
      lead: 'The agent reads orders and quality reports in different formats, extracts their data into a fixed schema, and hands the fields it is not sure about to a person.',
      kind: 'Reference solution, sample documents',
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
          'export to CSV and XLSX, standing in for an ERP integration in the reference version',
          'a recorded mode at no cost and a live mode with an API key, run locally',
        ],
      },
      preview: {
        title: 'From document to record',
        text: 'Recorded runs on several fictional orders and quality reports, including documents with missing data.',
      },
      stack: ['TypeScript', 'Vite', 'Claude API (structured output)', 'SheetJS', 'Vitest'],
    },
    'grant-assistant': {
      metaTitle: 'Grant application assistant — kokot.it',
      metaDescription:
        'Reference solution: matching a company to funding calls with explicit rules, plus a draft project description. Not legal advice or a grant guarantee.',
      card: {
        title: 'Grant application assistant',
        summary:
          'Matches a company to funding calls with explicit rules and drafts a project description for the best match.',
        tags: ['grants', 'rules', 'AI agent'],
      },
      lead: 'From a short company profile, the assistant checks the conditions of several funding calls, points out the unmet ones and prepares a working draft of the project description for the best match, a starting point for the company or its adviser.',
      kind: 'Reference solution, call data with an as-of date',
      problem: [
        'A company considering a grant first has to work out which calls it qualifies for at all: company age, financial result, industry, region. These conditions are spread across rulebooks, and the first assessment takes time for the company and its adviser.',
      ],
      solution: {
        text: [
          'Eligibility conditions are written as explicit, tested rules rather than left to the model’s judgement. The language model only prepares a working draft of the project description; the company writes and files the application. The result also lists the documents to prepare.',
          'The assistant helps with a first assessment; it does not replace the application or an adviser, is not legal advice and does not guarantee a grant. Call data carries an as-of date and links to the sources.',
        ],
        points: [
          'rules e.g. for Dig.IT: years in business, positive result, manufacturing profile',
          'a list of matches with reasons and unmet conditions',
          'a draft project description and a list of documents to prepare',
          'the disclaimer visible in the interface',
        ],
      },
      preview: {
        title: 'Matching to funding calls',
        text: 'Recorded runs for several fictional company profiles.',
      },
      stack: ['TypeScript', 'Vite', 'Zod', 'Claude API', 'Vitest'],
    },
    tiller: {
      metaTitle: 'Agentic dev workflow: the tiller case study — kokot.it',
      metaDescription:
        'Case study: tiller, open procedures for AI agents in software delivery. Planning, TDD, two-axis review, a verdict at one SHA and hard boundaries for the agent.',
      card: {
        title: 'Agentic dev workflow: tiller',
        summary:
          'Procedures for AI agents from ticket plan through TDD to review and PR, with a project profile, a decision register and hard boundaries.',
        tags: ['software teams', 'AI agents', 'open source'],
      },
      lead: 'tiller is an open set of procedures (skills) for AI agents in software delivery. The procedures are shared by every project, a project’s facts live in its profile, and its decisions in a register that the later steps read.',
      kind: 'Own tool, public repository (MIT)',
      problem: [
        'An AI agent in a repository writes code quickly. Without a process around it, though, a team gets changes nobody planned, tests written after the fact, and reviews that check style rather than whether the change does what it was meant to do.',
        'The gaps are usually four. No specification for the agent to start from. No review that keeps conformance to conventions apart from conformance to the ticket. No boundaries: what the agent does not do alone, such as merging, sending a message or touching someone else’s PR. No memory of decisions, so every session starts from zero and reviews report deviations agreed earlier as defects.',
        'On top of that, agent instructions that grow inside one project absorb its facts: merge rules, test commands, environment hosts. A second project means copying and hand-editing them, and an agent can apply one project’s rules to another.',
      ],
      solution: {
        text: [
          'tiller keeps the procedure apart from the facts. The procedure is how a ticket is opened, planned, tested, reviewed and merged. The facts are everything that differs between projects: the tracker, the branch convention, test commands, CI gates, who may merge. Every skill that works on a ticket starts by resolving the project’s profile (step −1) and stops if it finds none.',
          'The steps that hold quality stand on that frame. The plan checks the ticket’s premise against the code. TDD starts from a test that fails for the reason the ticket describes. Review runs on two independent axes. The verdict comes from a fresh session that did not write the code.',
        ],
        points: [
          'flow-* skills: from opening a ticket, planning and TDD through review, commit and PR to the verdict, bug diagnosis and manual QA; none of them carries the facts of a particular project',
          'a project profile: a local file of facts (tracker, branches, test commands, gates, merge rules, boundaries), checked by a script before an unattended run',
          'brains: private knowledge repositories for a project, with a register of decisions D-nnn and questions Q-nnn; a decision becomes “agreed” only once a person confirms it',
          'the branch’s decision ledger: a deliberate deviation recorded the moment it is taken, read by the reviews and the verdict',
          'two-axis review: Standards (the repository’s conventions) and Spec (the ticket plus later agreements), reported side by side and never merged into one score',
          'confidence check: a high-confidence or needs-review verdict computed from conditions, including proof that the tests pass at one specific SHA (CI or a local re-run)',
          'unattended runs: a ticket in fourteen phases with checkpoints and caps; a decision that touches a boundary on the inviolables list stops the run and waits for a person',
          'helm: a private overview of every project (stage, deadlines, promises); it advises and never starts work by itself',
          'a leak guard and an access hook: a commit naming a project, a person or a credential is refused, and one project’s session reads neither another project’s profile nor a brain it was not granted',
        ],
      },
      flow: {
        title: 'How a ticket moves',
        diagram: {
          title: 'How a ticket moves through tiller',
          desc: 'A top-to-bottom diagram. The skill resolves the project profile and stops without one. Then the ticket start, the plan, TDD, review on two parallel axes (Standards and Spec), the commit and a draft PR, and a confidence-check verdict in a fresh session. At the end, either the agent merges, when the profile allows it, or the PR waits for a human signature. Alongside runs the branch’s decision ledger: the plan and TDD write it, the reviews and the verdict read it.',
          caption:
            'The interactive path, one skill per step; the last row is the profile’s merge rule. An unattended run takes the same steps through the driver’s fourteen phases.',
          rows: [
            [{ label: 'Project profile', skill: 'step −1', note: 'no profile = stop' }],
            [{ label: 'Start', skill: 'flow-start-ticket', note: 'ticket, branch, short plan' }],
            [
              {
                label: 'Plan',
                skill: 'flow-plan-ticket',
                note: 'premise, seams, decisions',
                ledger: 'write',
              },
            ],
            [{ label: 'TDD', skill: 'flow-tdd', note: 'red → green, repo gates', ledger: 'write' }],
            [
              {
                label: 'Standards',
                skill: 'flow-code-review',
                note: 'repo conventions',
                ledger: 'read',
              },
              {
                label: 'Spec',
                skill: 'flow-code-review',
                note: 'ticket + agreements',
                ledger: 'read',
              },
            ],
            [
              {
                label: 'Commit and PR',
                skill: 'flow-create-pull-request',
                note: 'always a draft PR',
              },
            ],
            [
              {
                label: 'Verdict',
                skill: 'flow-confidence-check',
                note: 'fresh session, tests at the SHA',
                ledger: 'read',
              },
            ],
            [
              { label: 'Agent merges', skill: 'merge authority', note: 'profile permitting' },
              { label: 'Human signature', skill: 'ready-to-sign', note: 'the PR waits open' },
            ],
          ],
          rail: 'branch decision ledger → read by review and verdict',
        },
        steps: [
          {
            title: 'Profile',
            text: 'The skill resolves the project from an environment variable, a .tiller-profile file or the repository path. No profile means stop, not a guess.',
          },
          {
            title: 'Start',
            text: 'The ticket is checked (status, blockers, acceptance criteria), a branch is cut from a fresh main, and a short plan is agreed before code.',
          },
          {
            title: 'Plan',
            text: 'The ticket’s premise is checked against the repository; a seam table names the test level and what is deliberately not tested. Decisions go into the register.',
          },
          {
            title: 'TDD',
            text: 'The test fails first for the reason the ticket describes, then passes. Green means the repository’s gates pass at a specific SHA, not just the assertion.',
          },
          {
            title: 'Review',
            text: 'Two axes in parallel, in separate subagents: Standards and Spec. Every finding carries a file location and gets a ruling.',
          },
          {
            title: 'Commit and PR',
            text: 'A commit in the profile’s format and a PR that always opens as a draft, with the test results and screenshots when the change touches the interface.',
          },
          {
            title: 'Verdict',
            text: 'A confidence check in a fresh session: high-confidence or needs-review. The profile says who merges, the agent or a person.',
          },
        ],
      },
      preview: {
        title: 'A sample run',
        text: 'A session on the fictional bookshelf-api project, from opening the ticket to the verdict.',
      },
      transcript: {
        label: 'Illustrative example',
        intro:
          'A fictional mini-project, bookshelf-api (a REST API in TypeScript), and ticket SHELF-12: filter the list of books by author. The log shows what each skill does according to its description in the repository; names, numbers and results are made up for the example.',
        entries: [
          {
            command: '/flow-start-ticket SHELF-12',
            output: [
              {
                tone: 'muted',
                text: 'profile: bookshelf (a .tiller-profile file in the repository)',
              },
              {
                tone: 'plain',
                text: 'SHELF-12 · Filter books by author · Backlog, unblocked, 2 acceptance criteria',
              },
              {
                tone: 'plain',
                text: 'branch SHELF-12-filter-by-author from origin/main · status: In Progress',
              },
              { tone: 'plain', text: 'a 3-step plan agreed before any code' },
            ],
          },
          {
            command: '/flow-plan-ticket SHELF-12',
            output: [
              {
                tone: 'plain',
                text: 'premise confirmed: GET /books exists (src/routes/books.ts), no author parameter yet',
              },
              {
                tone: 'plain',
                text: 'kind: code · seam: filterBooks(books, query) · unit · cases written up front',
              },
              {
                tone: 'plain',
                text: 'deliberately not tested here: the HTTP layer beyond one request test',
              },
              {
                tone: 'muted',
                text: 'decision (self, overridable): an empty ?author= returns the whole list → ledger',
              },
            ],
          },
          {
            command: '/flow-tdd',
            output: [
              {
                tone: 'red',
                text: '✗ filterBooks › filters by author, ignoring case: expected 2 books, received 5',
              },
              { tone: 'muted', text: 'red for the ticket’s reason, not a harness failure' },
              { tone: 'green', text: '✓ 6 passed · lint ok · typecheck ok' },
              {
                tone: 'plain',
                text: 'pin: without the parameter the list is unchanged (green by design)',
              },
              {
                tone: 'muted',
                text: 'with the implementation reverted, the test fails again for the same reason',
              },
            ],
          },
          {
            command: '/flow-code-review',
            output: [
              {
                tone: 'plain',
                text: 'Standards · 1 finding · src/routes/books.ts:18 · parameter name breaks the README convention',
              },
              {
                tone: 'plain',
                text: 'Spec · 0 findings · AC1 and AC2 covered, the ledger decision honoured',
              },
              { tone: 'green', text: 'finding accepted and fixed · ✓ 6 passed' },
            ],
          },
          {
            command: '/flow-create-commit',
            output: [{ tone: 'plain', text: 'feat(books): filter the list by author' }],
          },
          {
            command: '/flow-create-pull-request',
            output: [
              {
                tone: 'plain',
                text: 'draft PR #7 · body: scope, test results, ticket link',
              },
            ],
          },
          {
            command: '/flow-confidence-check SHELF-12',
            output: [
              { tone: 'muted', text: 'a new session; the ticket is its only input' },
              { tone: 'plain', text: 'CI at the head SHA: green' },
              { tone: 'plain', text: 'AC1 covered · AC2 covered · 0 blocker / high / medium' },
              { tone: 'green', text: 'verdict: high-confidence' },
              {
                tone: 'muted',
                text: 'merging follows the profile’s merge authority: here, a human signature',
              },
            ],
          },
        ],
        note: 'This is not a recording of a real project. The steps and their order follow the skill descriptions in the tiller repository; nothing here calls an API.',
      },
      results: {
        title: 'Results and lessons',
        intro:
          'Numbers from the public repository, with no claims about deployments. Each one can be checked at the path given.',
        facts: [
          { value: '23', label: 'flow-* skills', source: 'skills/flow-*/SKILL.md' },
          {
            value: '1011',
            label: 'tests declared across 89 Node test files',
            source: 'lines starting with test( (indented too) in *.test.mjs',
          },
          {
            value: '168',
            label: 'commits on main since the first one, 12 October 2026',
            source: 'git rev-list --count d536250',
          },
          {
            value: '14',
            label: 'phases of an unattended run, each with a checkpoint',
            source: 'lib/driver/phases.mjs',
          },
          {
            value: '6',
            label: 'mandates within which the owner-proxy role may act for the owner',
            source: 'README.md',
          },
          { value: 'MIT', label: 'licence', source: 'LICENSE' },
        ],
        asOf: 'As of 22 October 2026, the main branch of the tiller repository (commit d536250).',
        lessonsTitle: 'Lessons',
        lessons: [
          {
            title: 'Procedure and facts apart',
            text: 'A skill with no project facts moves to the next repository by writing a profile, not by copying instructions. A ticket skill that resolves no profile stops instead of guessing.',
          },
          {
            title: 'Two review axes, not one score',
            text: 'Code can follow every convention and do the wrong thing, or the reverse. In a merged report one axis hides the other, so Standards and Spec run in separate subagents.',
          },
          {
            title: 'Decisions written down at once',
            text: 'A deviation missing from the ledger is reported by review as a defect or scope creep. Recorded the moment it is taken, it becomes something the review grades rather than rediscovers.',
          },
          {
            title: 'Green is a measurement',
            text: 'A test is green when the gates pass at a specific SHA; without that the verdict cannot be high-confidence. The session that wrote the code does not give it a verdict.',
          },
          {
            title: 'Boundaries as code',
            text: 'Merge rules, gates and the inviolables list live in the profile, and a script checks them. A decision that touches a boundary stops the run and waits for a person. No agent role takes over a signature.',
          },
        ],
      },
      stack: ['Claude Code', 'Codex', 'Bash', 'Node.js', 'GitHub CLI'],
    },
    'relay-defense': {
      metaTitle: 'Relay Defense: a logic tower defense game — kokot.it',
      metaDescription:
        'Own project: a browser tower defense game designed as a logic puzzle, with a deterministic simulation and levels balanced by a search-based solver.',
      card: {
        title: 'Relay Defense: a logic game',
        summary:
          'A tower defense game where a plan beats reflexes. Levels balanced by a look-ahead solver and proven winnable in CI.',
        tags: ['game', 'simulation', 'open source'],
      },
      lead: 'A tower defense game in the browser, designed as a logic puzzle: every wave is visible in advance, the simulation is deterministic and the game waits between waves. Ten levels, each built around one idea.',
      kind: 'Own project, public repository (MIT)',
      problem: [
        'A tower defense game is easy to make hard and hard to make fair. Numbers tuned by feel give levels that are either trivial or won by luck, and every change to one tower shifts the balance of all of them.',
        'Projects with agents and automation have the same problem: behaviour has to be checked with repeatable runs and a measurable criterion, not with an impression.',
      ],
      solution: {
        text: [
          'The game logic is a pure, deterministic simulation kept apart from the drawing: the same moves always give the same result. That makes it possible to replay solutions in tests and to search for them automatically.',
          'A look-ahead solver tries every affordable move, simulates the coming waves and keeps the best one. It wrote the reference solution of each level; the tests replay them and expect a win. A probe with a careless player, who builds random agents near the route, shows that from the third level on luck is not enough.',
        ],
        points: [
          'seven agents and seven kinds of faults, each with one clear answer: armour, cloaking, splitting, repairs, and a boss that shields its escort',
          'open floor where every agent is part of the maze, with a preview of the new route before you build',
          'each level ships at 50–90% of the strength the solver can still beat; from the third level on a careless player wins at most one game in ten',
          'Canvas 2D graphics in the kokot.it colours, full keyboard play, reduced motion, English and Polish',
        ],
      },
      preview: {
        title: 'Ten levels',
        text: 'Start with the first one: each briefing explains the new agent or fault. Progress is saved only in this browser.',
      },
      toolNote: 'The game runs entirely in the browser and sends nothing anywhere.',
      stack: ['TypeScript', 'Canvas 2D', 'Vite', 'Vitest', 'Playwright'],
    },
  },
};
