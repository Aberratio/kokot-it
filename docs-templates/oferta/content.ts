import type { Lang } from '../shared/html.ts';

// Copy of the presentation offer (T-05 form a). Prices are not here: they come from
// pricing.json. The price quote for the Dig.IT application is a separate template
// (docs-templates/oferta-cenowa/), Polish only (D-035).

export interface PackageCopy {
  title: string;
  forWhom: string;
  points: string[];
  note: string;
}

export interface OfferCopy {
  docTitle: string;
  eyebrow: string;
  title: string;
  lead: string;
  draftBadge: string;
  problem: { title: string; points: string[] };
  approach: { title: string; points: string[] };
  packages: {
    title: string;
    netLabel: string;
    durationLabel: string;
    externalLabel: string;
    items: Record<'P1' | 'P2' | 'P3', PackageCopy>;
    priceNote: (rate: string) => string;
  };
  timeline: { title: string; steps: { when: string; what: string; text: string }[] };
  deliverables: { title: string; points: string[] };
  eligibility: { title: string; points: string[]; disclaimer: string };
  showcase: { title: string; points: string[]; note: string };
  terms: { title: string; points: string[] };
  contact: { title: string; text: string; site: string };
}

const pl: OfferCopy = {
  docTitle: 'kokot.it — oferta wdrożenia AI dla MŚP produkcyjnych',
  eyebrow: 'Oferta · wdrożenia AI dla MŚP produkcyjnych',
  title: 'Agenci AI dla firm produkcyjnych w projekcie Dig.IT 2/2026',
  lead: 'kokot.it projektuje i wdraża agentów AI, którzy przejmują powtarzalną pracę na dokumentach i danych produkcyjnych. Agent wykonuje żmudną część, człowiek zatwierdza to, co ma znaczenie. Pakiety są ułożone w kategoriach kosztów konkursu Dig.IT 2/2026, więc ofertę cenową można dołączyć do wniosku.',
  draftBadge: 'Cennik wstępny — do zatwierdzenia',
  problem: {
    title: 'Gdzie firma traci czas',
    points: [
      'Zamówienia, specyfikacje i WZ przychodzą e-mailem i w PDF-ach, a ktoś przepisuje je ręcznie do ERP.',
      'Raporty jakości, niezgodności i protokoły pomiarów leżą w arkuszach — trudno z nich wyczytać trend albo przyczynę.',
      'Plan produkcji żyje w Excelu i w głowie planisty; każda zmiana zlecenia albo awaria maszyny to ręczne przeliczanie.',
      'Wiedza o stanie hali jest rozproszona między MES, rejestry i rozmowy na zmianie.',
    ],
  },
  approach: {
    title: 'Co robi kokot.it',
    points: [
      'Agent AI czyta dokumenty, wyciąga dane, sprawdza je regułami firmy i przenosi do ERP, MES lub arkusza.',
      'Pola niepewne trafiają do weryfikacji przez człowieka, zamiast być zgadywane; każda decyzja agenta zostawia ślad.',
      'Integracja z systemami, które firma już ma. Modele od dostawców z regionem danych w UE albo modele lokalne.',
      'Przed startem ustalamy mierniki — czas obsługi dokumentu, odsetek błędów, przestoje — a po pilotażu raportujemy wynik.',
    ],
  },
  packages: {
    title: 'Pakiety',
    netLabel: 'netto',
    durationLabel: 'czas',
    externalLabel: 'koszty zewnętrzne w okresie projektu, szac.',
    items: {
      P1: {
        title: 'Diagnoza i plan wdrożenia AI',
        forWhom:
          'Dla firmy, która nie wie jeszcze, od którego procesu zacząć i jak opisać zamówienie.',
        points: [
          'warsztat w zakładzie, przegląd 3–5 procesów, systemów i dostępności danych',
          '2–3 przypadki użycia z miernikami, architektura, ryzyka AI Act i RODO',
          'opis przedmiotu zamówienia neutralny wobec dostawcy — do zebrania ofert od kilku wykonawców',
        ],
        note: 'Przed wnioskiem: płaci firma, poza projektem (koszt niekwalifikowalny). Po złożeniu wniosku: jako etap 0 pakietu P2 lub P3.',
      },
      P2: {
        title: 'Agent AI dla jednego procesu',
        forWhom:
          'Jeden powtarzalny proces od początku do końca, np. zamówienia do ERP albo niezgodności do rejestru jakości.',
        points: [
          'agent na zamówienie: ekstrakcja, walidacja regułami, ślad decyzji, panel użytkownika',
          'integracja z ERP, MES, arkuszami lub pocztą',
          'pilotaż na danych firmy, raport z testów, szkolenie, dokumentacja',
        ],
        note: 'Typowo część większego projektu, obok licencji ERP/MES lub czujników.',
      },
      P3: {
        title: 'Program wdrożeniowy AI',
        forWhom:
          'Kilka procesów na wspólnej platformie agentów i cyfrowy bliźniak hali, wdrażane etapami.',
        points: [
          'agenci dla 2–3 procesów, np. dokumenty, jakość i planowanie',
          'cyfrowy bliźniak hali: model 3D, dane z MES lub rejestrów, agent odpowiadający na pytania o zlecenia, przestoje i jakość',
          'integracje i uprawnienia, program szkoleń, pomiar KPI przed i po',
        ],
        note: 'Czujniki i sprzęt firma kupuje u innych dostawców; kokot.it je integruje.',
      },
    },
    priceNote: (rate) =>
      `Ceny netto, do których dolicza się 23% VAT. Stawka ${rate} netto za osobodzień; cena w ofercie to ryczałt w obrębie widełek, ustalany po rozmowie albo po diagnozie (P1). Koszty zewnętrzne (API modeli, hosting) rozliczane według faktur dostawców, tylko w okresie projektu.`,
  },
  timeline: {
    title: 'Harmonogram z Dig.IT',
    steps: [
      {
        when: 'do 30.11.2026',
        what: 'Oferta do wniosku',
        text: 'Oferta cenowa w kategoriach Dig.IT, opcjonalnie diagnoza P1. Nabór 2–30.11.2026, może zamknąć się wcześniej.',
      },
      {
        when: 'po złożeniu wniosku',
        what: 'Start możliwy',
        text: 'Prace z zakresu projektu nie ruszają przed złożeniem wniosku — wcześniejszy start wyklucza koszty.',
      },
      {
        when: 'od ok. 02.2027',
        what: 'Umowa grantowa',
        text: 'Termin szacunkowy. Firma ponownie zbiera oferty (rozeznanie rynku) i wybiera wykonawcę.',
      },
      {
        when: '3–14 miesięcy',
        what: 'Realizacja etapami',
        text: 'Analiza, budowa, integracja, pilotaż, szkolenie, wsparcie. Płatność po odbiorze etapów.',
      },
      {
        when: 'do 31.12.2028',
        what: 'Rozliczenie',
        text: 'Koniec projektu; grant wypłacany jako refundacja po rozliczeniu.',
      },
    ],
  },
  deliverables: {
    title: 'Co dostaje firma',
    points: [
      'działającego agenta (albo platformę agentów) na infrastrukturze firmy lub w chmurze w regionie UE',
      'kod źródłowy z przeniesieniem autorskich praw majątkowych, bez opłat licencyjnych za kod na zamówienie',
      'dokumentację techniczną i użytkową oraz przeszkolony zespół',
      'raport z testów i mierników — materiał do wskaźników projektu',
      'notatkę zgodności z AI Act: klasyfikacja ryzyka, nadzór człowieka, logi',
      'ofertę cenową z podziałem na usługi programistyczne, wdrożenie i szkolenie',
    ],
  },
  eligibility: {
    title: 'Dlaczego to koszt kwalifikowalny w Dig.IT',
    points: [
      'Oprogramowanie tworzone na zamówienie z przeniesieniem całości autorskich praw majątkowych jest „Technologią cyfrową” w rozumieniu regulaminu; jej zakup i wdrożenie to komponent obligatoryjny projektu.',
      'Sztuczna inteligencja i uczenie maszynowe to dziedzina wymieniona w regulaminie wprost — także analiza danych z cyfrowych bliźniaków.',
      'Szkolenie dotyczy wyłącznie korzystania z wdrażanej technologii (komponent fakultatywny); wsparcie powdrożeniowe trwa tylko w okresie projektu, bez abonamentu.',
      'Wykonawca jest niepowiązany z firmą, a część programistyczną realizuje samodzielnie.',
    ],
    disclaimer:
      'O kwalifikowalności kosztów i przyznaniu grantu decyduje ARP na podstawie wniosku. kokot.it nie pisze wniosków i nie obiecuje dofinansowania. Grant: do 50% kosztów kwalifikowalnych, refundowany po projekcie. Stan informacji: 21.10.2026, regulamin konkursu Dig.IT 2/2026.',
  },
  showcase: {
    title: 'Projekty pokazowe',
    points: [
      'Cyfrowy bliźniak hali produkcyjnej w 3D z agentem AI, który odpowiada na pytania o zlecenia, przestoje i jakość.',
      'Agent do dokumentów produkcyjnych: zamówienia i raporty jakości trafiają do arkusza lub ERP, pola niepewne do weryfikacji.',
      'Asystent wniosku dotacyjnego oraz tiller: otwarty zestaw narzędzi do pracy z agentami AI przy wytwarzaniu oprogramowania.',
    ],
    note: 'Projekty pokazowe działają na fikcyjnych danych; opisy na kokot.it. Doświadczenie wykonawcy: CV w załączniku.',
  },
  terms: {
    title: 'Zasady współpracy',
    points: [
      'Oferta cenowa do wniosku jest niewiążąca; umowa i prace dopiero po złożeniu wniosku.',
      'Cena ryczałtowa w podziale na etapy; płatność przelewem po odbiorze każdego etapu.',
      'Bez wyłączności i bez uzależnienia: otwarte interfejsy, kod i dokumentacja zostają w firmie.',
      'Utrzymanie po projekcie (hosting, API, rozwój) to osobna, opcjonalna umowa poza grantem.',
    ],
  },
  contact: {
    title: 'Kontakt',
    text: 'Napisz kilka zdań: jaki proces, jakie systemy, jaki termin. W odpowiedzi dostaniesz pytania doprecyzowujące albo propozycję kolejnego kroku.',
    site: 'kokot.it',
  },
};

const en: OfferCopy = {
  docTitle: 'kokot.it — AI implementation offer for manufacturing SMEs',
  eyebrow: 'Offer · AI implementation for manufacturing SMEs',
  title: 'AI agents for manufacturers in a Dig.IT 2/2026 project',
  lead: 'kokot.it designs and delivers AI agents that take repetitive work on production documents and data off people’s desks. The agent does the tedious part; a person approves what matters. The packages follow the cost categories of the Dig.IT 2/2026 grant competition (ARP, Poland), so the price quote can go straight into the application.',
  draftBadge: 'Preliminary pricing — pending approval',
  problem: {
    title: 'Where the time goes',
    points: [
      'Orders, specifications and delivery notes arrive by e-mail and as PDFs, and someone retypes them into the ERP.',
      'Quality reports, non-conformities and measurement records sit in spreadsheets, where trends and root causes are hard to see.',
      'The production plan lives in Excel and in the planner’s head; every order change or machine stop means manual re-planning.',
      'Knowledge about the shop floor is scattered across the MES, logs and shift conversations.',
    ],
  },
  approach: {
    title: 'What kokot.it does',
    points: [
      'An AI agent reads documents, extracts the data, checks it against the company’s rules and moves it into the ERP, MES or a spreadsheet.',
      'Uncertain fields go to a person for review instead of being guessed; every agent decision leaves a trail.',
      'Integration with the systems the company already has. Models from providers with EU data residency, or local models.',
      'Before the start we agree on metrics — document handling time, error rate, downtime — and report the result after the pilot.',
    ],
  },
  packages: {
    title: 'Packages',
    netLabel: 'net',
    durationLabel: 'time',
    externalLabel: 'external costs during the project, est.',
    items: {
      P1: {
        title: 'AI diagnosis and implementation plan',
        forWhom:
          'For a company that does not yet know which process to start with or how to describe the order.',
        points: [
          'on-site workshop, review of 3–5 processes, systems and data availability',
          '2–3 use cases with metrics, target architecture, AI Act and GDPR risks',
          'a vendor-neutral description of the order, ready to collect quotes from several suppliers',
        ],
        note: 'Before the application: paid by the company outside the project (not eligible). After submission: stage 0 of P2 or P3.',
      },
      P2: {
        title: 'AI agent for one process',
        forWhom:
          'One repetitive process end to end, e.g. orders into the ERP or non-conformities into the quality register.',
        points: [
          'custom agent: extraction, rule-based validation, decision trail, user panel',
          'integration with the ERP, MES, spreadsheets or e-mail',
          'pilot on company data, test report, training, documentation',
        ],
        note: 'Usually one part of a larger project, next to ERP/MES licences or sensors.',
      },
      P3: {
        title: 'AI implementation programme',
        forWhom:
          'Several processes on a shared agent platform plus a shop-floor digital twin, delivered in stages.',
        points: [
          'agents for 2–3 processes, e.g. documents, quality and planning',
          'shop-floor digital twin: 3D model, MES or log data, an agent answering questions about orders, downtime and quality',
          'integrations and permissions, training programme, KPI measurement before and after',
        ],
        note: 'The company buys sensors and hardware from other suppliers; kokot.it integrates them.',
      },
    },
    priceNote: (rate) =>
      `Net prices; Polish VAT (23%) is added. Day rate ${rate} net; the price in a quote is a fixed fee within the range, set after a conversation or the diagnosis (P1). External costs (model APIs, hosting) are passed through at cost, only during the project.`,
  },
  timeline: {
    title: 'Timeline with Dig.IT',
    steps: [
      {
        when: 'by 30 Nov 2026',
        what: 'Quote for the application',
        text: 'Price quote in Dig.IT categories, optionally the P1 diagnosis. Call: 2–30 Nov 2026, may close early.',
      },
      {
        when: 'after submission',
        what: 'Start allowed',
        text: 'No project work starts before the application is submitted — an earlier start makes the costs ineligible.',
      },
      {
        when: 'from ca. Feb 2027',
        what: 'Grant agreement',
        text: 'Estimated date. The company collects quotes again (market survey) and picks the supplier.',
      },
      {
        when: '3–14 months',
        what: 'Delivery in stages',
        text: 'Analysis, build, integration, pilot, training, support. Payment after each stage is accepted.',
      },
      {
        when: 'by 31 Dec 2028',
        what: 'Settlement',
        text: 'Project ends; the grant is paid as a refund after settlement.',
      },
    ],
  },
  deliverables: {
    title: 'What the company gets',
    points: [
      'a working agent (or agent platform) on the company’s infrastructure or in an EU cloud region',
      'source code with a transfer of the economic copyrights, no licence fees for the custom code',
      'technical and user documentation and a trained team',
      'a test and metrics report — input for the project indicators',
      'an AI Act compliance note: risk classification, human oversight, logs',
      'a price quote split into software development, implementation and training',
    ],
  },
  eligibility: {
    title: 'Why it is an eligible cost in Dig.IT',
    points: [
      'Custom software with a full transfer of the economic copyrights is a “digital technology” under the competition rules; buying and implementing it is the mandatory component of the project.',
      'Artificial intelligence and machine learning is a field named in the rules, including analysis of digital-twin data.',
      'Training covers only the use of the implemented technology (optional component); post-launch support lasts only for the project period, with no subscription.',
      'The supplier is not linked to the company and delivers the software development part personally.',
    ],
    disclaimer:
      'Eligibility and the grant are decided by ARP based on the application. kokot.it does not write applications and does not promise funding. Grant: up to 50% of eligible costs, refunded after the project. As of 21 Oct 2026, Dig.IT 2/2026 competition rules.',
  },
  showcase: {
    title: 'Showcase projects',
    points: [
      'A 3D shop-floor digital twin with an AI agent that answers questions about orders, downtime and quality.',
      'A production documents agent: orders and quality reports go into a spreadsheet or the ERP, uncertain fields go to review.',
      'A grant application assistant, and tiller: an open toolkit for working with AI agents in software delivery.',
    ],
    note: 'Showcase projects run on fictional company data; write-ups on kokot.it. The supplier’s experience: CV attached.',
  },
  terms: {
    title: 'How we work together',
    points: [
      'The price quote for the application is not binding; the contract and the work start only after submission.',
      'Fixed fee split into stages; payment by bank transfer after each stage is accepted.',
      'No exclusivity and no lock-in: open interfaces, the code and the documentation stay with the company.',
      'Maintenance after the project (hosting, APIs, further development) is a separate, optional contract outside the grant.',
    ],
  },
  contact: {
    title: 'Contact',
    text: 'Write a few sentences: which process, which systems, what timeline. The reply brings clarifying questions or a proposed next step.',
    site: 'kokot.it',
  },
};

export const offerCopy: Record<Lang, OfferCopy> = { pl, en };
