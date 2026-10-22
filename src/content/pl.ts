import type { SiteContent } from './types.ts';

// Polska treść strony. Ceny pakietów celowo pominięte: cennik czeka na zatwierdzenie (D-021).
export const pl: SiteContent = {
  meta: {
    title: 'kokot.it — wdrożenia AI dla produkcji i zespołów programistycznych',
    description:
      'Agenci AI dla firm produkcyjnych (dokumenty, jakość, planowanie) i dla zespołów programistycznych. Oferta wykonawcy do projektów z dotacją, np. Dig.IT.',
    siteName: 'kokot.it',
  },
  nav: {
    label: 'Nawigacja główna',
    services: 'Usługi',
    process: 'Jak pracujemy',
    projects: 'Projekty',
    about: 'O kokot.it',
    contact: 'Kontakt',
  },
  anchors: {
    services: 'uslugi',
    process: 'jak-pracujemy',
    projects: 'projekty',
    about: 'o-kokot-it',
    contact: 'kontakt',
  },
  hero: {
    eyebrow: 'AI i agentic engineering',
    title: 'Agenci AI, którzy przejmują powtarzalną pracę na dokumentach, danych i kodzie',
    lead: 'kokot.it projektuje i wdraża agentów AI dla firm produkcyjnych i zespołów programistycznych. Agent wykonuje żmudną część pracy, a człowiek zatwierdza to, co ma znaczenie.',
    primaryCta: 'Zobacz usługi',
    secondaryCta: 'Napisz e-mail',
  },
  services: {
    title: 'Usługi',
    intro:
      'Dwie grupy odbiorców, jedno podejście: najpierw proces i dane, potem agent, na końcu mierzalny wynik.',
    manufacturing: {
      title: 'Dla firm produkcyjnych',
      intro:
        'Zamówienia, specyfikacje, raporty jakości, plan produkcji: w wielu zakładach dużo czasu zajmuje przepisywanie danych między dokumentami, arkuszami i ERP. Tu agent AI daje najszybszy efekt. Pakiety pasują do projektów z dotacją na transformację cyfrową, ale można je zamówić także bez niej.',
      offers: [
        {
          code: 'P1',
          title: 'Diagnoza i plan wdrożenia AI',
          summary:
            'Dla firmy, która chce wdrożyć AI, ale nie wie jeszcze, od którego procesu zacząć ani jak opisać zamówienie.',
          points: [
            'warsztat w zakładzie i przegląd 3–5 procesów: dokumenty, jakość, planowanie, utrzymanie ruchu',
            'przegląd systemów (ERP, MES, arkusze, poczta) i dostępności danych',
            '2–3 przypadki użycia z miernikami korzyści',
            'architektura docelowa i ocena ryzyk z AI Act i RODO',
            'opis przedmiotu zamówienia neutralny wobec dostawcy, z którym można zebrać oferty od kilku wykonawców',
          ],
        },
        {
          code: 'P2',
          title: 'Agent AI dla jednego procesu',
          summary:
            'Jeden powtarzalny proces zautomatyzowany od początku do końca, np. zamówienia i specyfikacje → ERP albo raporty niezgodności → rejestr jakości.',
          points: [
            'agent wyciąga dane z dokumentów, sprawdza je regułami i zostawia ślad decyzji',
            'pola niepewne trafiają do weryfikacji przez człowieka, zamiast być zgadywane',
            'integracja z ERP, MES, arkuszami lub pocztą',
            'pilotaż na dokumentach firmy i raport z testów: czas obsługi dokumentu, odsetek błędów',
            'szkolenie użytkowników, dokumentacja, kod źródłowy z przeniesieniem autorskich praw majątkowych',
          ],
        },
        {
          code: 'P3',
          title: 'Program wdrożeniowy AI',
          summary:
            'Kilka procesów na wspólnej platformie agentów i cyfrowy bliźniak hali, wdrażane etapami.',
          points: [
            'agenci dla 2–3 procesów, np. dokumenty, jakość i planowanie',
            'cyfrowy bliźniak hali: model 3D, warstwa danych z MES lub rejestrów produkcji i agent odpowiadający na pytania o zlecenia, przestoje i jakość',
            'integracje z ERP i MES, uprawnienia użytkowników',
            'program szkoleń dla operatorów, liderów i administratora',
            'pomiar wskaźników przed wdrożeniem i po nim',
          ],
        },
      ],
      pricingNote:
        'Cena zależy od zakresu, liczby integracji i jakości danych. Ustalana jest w ofercie, po rozmowie albo po diagnozie (P1).',
    },
    devTeams: {
      title: 'Dla zespołów programistycznych',
      intro:
        'Agenci AI przyspieszają wytwarzanie oprogramowania, dopóki proces trzyma ich w ryzach: plan przed kodem, test przed implementacją, review według ustaleń zespołu, jasne granice uprawnień.',
      offers: [
        {
          code: '',
          title: 'Warsztat i diagnoza procesu',
          summary:
            'Przegląd drogi zmiany w zespole: ticket, plan, kod, review, wydanie. Wynik to plan pilotażu z agentami.',
          points: [
            'gdzie agent realnie skraca pracę, a gdzie zwiększa ryzyko',
            'jakie konwencje zespołu agent musi znać i skąd je czytać',
            'mierniki pilotażu, np. czas od ticketu do PR i liczba poprawek po review',
          ],
        },
        {
          code: '',
          title: 'Wdrożenie workflow z agentami AI',
          summary:
            'Procedury dla agentów dopasowane do repozytoriów zespołu i sprawdzone na prawdziwych ticketach.',
          points: [
            'procedury (skille) od planu ticketu przez TDD po review i PR, oddzielone od faktów projektu',
            'review w dwóch osiach: zgodność ze standardami i ze specyfikacją',
            'uprawnienia i blokady: czego agent nie może zrobić bez człowieka',
            'pilotaż na ticketach zespołu i przekazanie procesu zespołowi',
          ],
        },
      ],
    },
  },
  process: {
    title: 'Jak pracujemy',
    intro:
      'Każdy projekt zaczyna się od procesu i danych, nie od wyboru modelu. Agent jest tak dobry, jak dane, które dostaje, i reguły, które go sprawdzają.',
    steps: [
      {
        title: 'Rozmowa',
        text: 'Kilka zdań e-mailem: jaki proces, jakie systemy i jaki termin. Odpowiedź zawiera pytania doprecyzowujące albo propozycję kolejnego kroku.',
      },
      {
        title: 'Diagnoza',
        text: 'Krótka analiza albo pełny pakiet P1: procesy, dane, ryzyka i przypadki użycia z miernikami.',
      },
      {
        title: 'Oferta',
        text: 'Ryczałt z podziałem na etapy i kamienie milowe. Przy projekcie z dotacją: w kategoriach kosztów konkursu.',
      },
      {
        title: 'Realizacja',
        text: 'Etapami, z pilotażem na danych firmy i odbiorem każdego kamienia milowego.',
      },
      {
        title: 'Przekazanie',
        text: 'Szkolenie, dokumentacja techniczna i użytkowa, kod źródłowy. Firma nie jest uzależniona od wykonawcy.',
      },
    ],
    grants: {
      title: 'Dotacje: przykład Dig.IT',
      intro: [
        'Konkurs Dig.IT 2/2026 Agencji Rozwoju Przemysłu wspiera transformację cyfrową MŚP produkcyjnych, w tym wdrożenia AI. Nabór wniosków trwa od 2 do 30 listopada 2026 i może zostać zamknięty wcześniej. Grant pokrywa do 50% kosztów kwalifikowalnych, a do wniosku firma dołącza co najmniej trzy oferty cenowe od wykonawców.',
        'kokot.it może być jednym z tych wykonawców.',
      ],
      does: {
        title: 'Co robi kokot.it',
        points: [
          'przygotowuje ofertę wykonawcy do wniosku: zakres, harmonogram i cenę w kategoriach konkursu (usługi programistyczne, wdrożenie, szkolenie)',
          'może przeprowadzić diagnozę (P1) przed złożeniem wniosku, finansowaną przez firmę poza projektem',
          'jeśli firma wybierze kokot.it przy realizacji projektu, wdraża rozwiązanie i przekazuje kod wraz z autorskimi prawami majątkowymi',
        ],
      },
      doesNot: {
        title: 'Czego kokot.it nie robi',
        points: [
          'nie pisze wniosków o dotację; wniosek składa firma, sama lub z doradcą',
          'nie obiecuje uzyskania dotacji; o grancie decyduje operator konkursu',
          'nie zaczyna prac objętych projektem przed złożeniem wniosku, bo wcześniejszy start wyklucza koszty z dofinansowania',
        ],
      },
      source: {
        label: 'Warunki konkursu: digit.arp.pl',
        href: 'https://digit.arp.pl/eventy/nabory/digit-konkurs-22026/',
      },
      asOf: 'Stan informacji: 21 października 2026. Przed decyzją warto sprawdzić aktualny regulamin.',
    },
  },
  projects: {
    title: 'Projekty',
    intro:
      'Cztery projekty pokazowe: trzy dema zbudowane na fikcyjnych danych firm i tiller, własne narzędzie z publicznym kodem. Pokazują sposób pracy i architekturę, nie są wdrożeniami u klientów. Dema na stronie odtwarzają nagrane przebiegi i nie wywołują żadnego API.',
    cardCta: 'Case study',
  },
  about: {
    title: 'O kokot.it',
    text: [
      'kokot.it to marka usług inżynierskich w obszarze AI i agentic engineering: od analizy procesu, przez agentów i integracje, po interfejs, z którego korzystają ludzie. Ta strona i projekty pokazowe są przykładem tej pracy.',
      'Projekt prowadzi bezpośrednio kokot.it, od pierwszej rozmowy po wdrożenie. Zakres i sposób realizacji określa oferta, zgodnie z zasadami danego programu finansowania.',
    ],
    principlesTitle: 'Zasady',
    principles: [
      {
        title: 'Człowiek zatwierdza',
        text: 'Agent przygotowuje i sprawdza, a decyzje, które mają znaczenie, zatwierdza człowiek.',
      },
      {
        title: 'Mierzalny cel',
        text: 'Przed startem ustalamy, co mierzymy: czas obsługi, odsetek błędów, przestoje.',
      },
      {
        title: 'Dane pod kontrolą',
        text: 'Modele od dostawców z regionem danych w UE albo modele lokalne, zależnie od wymagań firmy.',
      },
      {
        title: 'Bez uzależnienia',
        text: 'Kod, dokumentacja i wiedza zostają w firmie.',
      },
    ],
  },
  contact: {
    title: 'Kontakt',
    text: 'Wystarczy kilka zdań: jaki proces chcą Państwo usprawnić, z jakich systemów korzysta firma (ERP, MES, arkusze) i jaki jest termin, np. nabór dotacji.',
    emailLabel: 'Napisz na',
  },
  footer: {
    note: 'Firmy, dokumenty i dane produkcyjne w demach na tej stronie są fikcyjne.',
  },
  caseStudy: {
    back: 'Wszystkie projekty',
    problem: 'Problem',
    solution: 'Rozwiązanie',
    demo: 'Demo',
    demoFallback: 'Jeśli demo się tu nie wyświetla, opis działania znajduje się powyżej.',
    demoNote: 'Demo nagrane: odtwarza zapisany przebieg, bez wywołań API.',
    demoFrameTitle: 'Nagrane demo projektu',
    stack: 'Stack',
    repo: 'Repozytorium',
    repoPending: 'repo zostanie upublicznione po przeglądzie',
    repoPublic: 'kod jest publiczny',
    ctaTitle: 'Podobny problem w Państwa firmie?',
    ctaText: 'Proszę opisać proces w kilku zdaniach.',
  },
  caseStudies: {
    'factory-twin': {
      metaTitle: 'Cyfrowy bliźniak hali z agentem AI — kokot.it',
      metaDescription:
        'Projekt pokazowy: hala produkcyjna w 3D ze statusem maszyn i agent AI, który odpowiada na pytania o zlecenia, przestoje i jakość.',
      card: {
        title: 'Cyfrowy bliźniak hali z agentem AI',
        summary:
          'Hala w 3D ze statusem maszyn. Agent odpowiada na pytania o zlecenia, przestoje i jakość i pokazuje odpowiedź w scenie.',
        tags: ['produkcja', 'Three.js', 'agent AI'],
      },
      lead: 'Hala produkcyjna w 3D, w której agent AI odpowiada na pytania o stan produkcji i pokazuje odpowiedź na modelu: podświetla maszynę, przesuwa kamerę.',
      kind: 'Projekt pokazowy, fikcyjna firma i dane',
      problem: [
        'Informacja o stanie produkcji jest rozproszona: zlecenia w ERP, przestoje w rejestrze utrzymania ruchu, wyniki kontroli jakości w osobnych arkuszach. Odpowiedź na pytanie „dlaczego linia 2 stoi i które zlecenia są zagrożone” wymaga zajrzenia w kilka miejsc.',
        'Raporty i dashboardy pokazują liczby, ale rzadko pokazują, gdzie na hali leży problem.',
      ],
      solution: {
        text: [
          'Model 3D hali z liniami i maszynami, które pokazują swój status. Obok rozmowa z agentem AI, który do odpowiedzi używa narzędzi: zapytań o zlecenia, przestoje i wyniki kontroli jakości. Każda odpowiedź ma też akcję w scenie, więc widać, której maszyny dotyczy.',
        ],
        points: [
          'agent korzysta wyłącznie z danych udostępnionych przez narzędzia, a nie z wiedzy ogólnej',
          'odpowiedź tekstowa i akcja w scenie: podświetlenie maszyny, ruch kamery',
          'dane demo: fikcyjna firma, zlecenia, przestoje i wyniki kontroli jakości',
          'tryb nagrany bez kosztów i tryb na żywo z kluczem API uruchamiany lokalnie',
        ],
      },
      demo: {
        title: 'Demo: pytania o stan hali',
        text: 'Kilka nagranych scenariuszy, np. pytanie o przestoje na linii i o zlecenia zagrożone opóźnieniem.',
      },
      stack: ['TypeScript', 'Three.js', 'Vite', 'Claude API (tool use)', 'Vitest'],
    },
    'production-docs-agent': {
      metaTitle: 'Agent do dokumentów produkcyjnych — kokot.it',
      metaDescription:
        'Projekt pokazowy: agent AI czyta zamówienia i raporty jakości, uzupełnia arkusz lub rekordy ERP i oznacza pola niepewne do weryfikacji.',
      card: {
        title: 'Agent do dokumentów produkcyjnych',
        summary:
          'Zamówienia i raporty jakości z PDF i e-maili zamienione w rekordy arkusza lub ERP, z weryfikacją przez człowieka.',
        tags: ['dokumenty', 'jakość', 'ERP'],
      },
      lead: 'Agent czyta zamówienia i raporty jakości w różnych formatach, wyciąga z nich dane do ustalonego schematu, a pola, których nie jest pewien, oddaje człowiekowi.',
      kind: 'Projekt pokazowy, fikcyjne dokumenty',
      problem: [
        'Zamówienia przychodzą jako PDF, skan albo treść e-maila, każde w innym układzie. Raporty jakości mają własne formularze. Ktoś przepisuje je ręcznie do arkusza albo ERP, co zajmuje czas i rodzi pomyłki, które wychodzą dopiero na produkcji albo w reklamacji.',
        'Pełna automatyzacja bez kontroli jest ryzykowna: brakujące pole albo niejednoznaczna ilość nie mogą zostać „zgadnięte”.',
      ],
      solution: {
        text: [
          'Agent zamienia dokument na dane w ustalonym schemacie, sprawdza je regułami i oznacza pola niepewne. Interfejs pokazuje dokument po lewej i wyciągnięte dane po prawej, z wyróżnionymi polami do sprawdzenia. Zatwierdzone dane trafiają do eksportu.',
        ],
        points: [
          'ekstrakcja do schematu (structured output) i walidacja reguł',
          'trudne przypadki, np. brak pola albo niejednoznaczność, są oznaczane, nie zgadywane',
          'eksport do CSV i XLSX jako zastępstwo integracji z ERP w demo',
          'tryb nagrany bez kosztów i tryb na żywo z kluczem API uruchamiany lokalnie',
        ],
      },
      demo: {
        title: 'Demo: od dokumentu do rekordu',
        text: 'Nagrane przebiegi na kilku fikcyjnych zamówieniach i raportach jakości, w tym na dokumentach z brakującymi danymi.',
      },
      stack: ['TypeScript', 'Vite', 'Claude API (structured output)', 'SheetJS', 'Vitest'],
    },
    'grant-assistant': {
      metaTitle: 'Asystent wniosku dotacyjnego — kokot.it',
      metaDescription:
        'Projekt pokazowy: dopasowanie firmy do naborów na podstawie jawnych reguł kwalifikowalności i szkic opisu projektu. Nie jest poradą prawną ani gwarancją dotacji.',
      card: {
        title: 'Asystent wniosku dotacyjnego',
        summary:
          'Dopasowanie firmy do naborów według jawnych reguł i szkic opisu projektu dla najlepszego dopasowania.',
        tags: ['dotacje', 'reguły', 'agent AI'],
      },
      lead: 'Na podstawie krótkiego opisu firmy asystent sprawdza warunki kilku naborów, wskazuje te niespełnione i szkicuje opis projektu dla najlepszego dopasowania.',
      kind: 'Projekt pokazowy, dane naborów z datą stanu',
      problem: [
        'Firma, która myśli o dotacji, musi najpierw ustalić, do których naborów w ogóle się kwalifikuje: wiek firmy, wynik finansowy, branża, region. Te warunki są rozrzucone po regulaminach, a wstępna ocena zajmuje czas jej i doradcy.',
      ],
      solution: {
        text: [
          'Warunki kwalifikowalności są zapisane jako jawne, testowane reguły, a nie zostawione ocenie modelu. Model językowy szkicuje tylko opis projektu dla najlepszego dopasowania. Wynik pokazuje też listę dokumentów do przygotowania.',
          'Asystent pomaga we wstępnej ocenie; nie zastępuje wniosku ani doradcy, nie jest poradą prawną i nie gwarantuje dotacji. Dane naborów mają datę stanu i linki do źródeł.',
        ],
        points: [
          'reguły np. dla Dig.IT: lata działalności, dodatni wynik, profil produkcyjny',
          'lista dopasowań z uzasadnieniem i niespełnionymi warunkami',
          'szkic opisu projektu i lista dokumentów do przygotowania',
          'zastrzeżenie widoczne w interfejsie',
        ],
      },
      demo: {
        title: 'Demo: dopasowanie do naborów',
        text: 'Nagrane przebiegi dla kilku fikcyjnych profili firm.',
      },
      stack: ['TypeScript', 'Vite', 'Zod', 'Claude API', 'Vitest'],
    },
    tiller: {
      metaTitle: 'Agentic dev workflow: case study tillera — kokot.it',
      metaDescription:
        'Case study: tiller, zestaw procedur dla agentów AI w wytwarzaniu oprogramowania, od planu ticketu przez TDD po review.',
      card: {
        title: 'Agentic dev workflow: tiller',
        summary:
          'Procedury dla agentów AI od planu ticketu przez TDD po review, oddzielone od faktów konkretnego projektu.',
        tags: ['zespoły dev', 'agenci AI', 'open source'],
      },
      lead: 'tiller to zestaw procedur dla agentów AI w wytwarzaniu oprogramowania. Procedury są wspólne dla wszystkich projektów, a fakty konkretnego projektu żyją w jego profilu.',
      kind: 'Narzędzie własne, repozytorium publiczne',
      problem: [
        'Instrukcje dla agentów AI, które rosną w jednym projekcie, wchłaniają jego fakty: zasady scalania, komendy testów, adresy środowisk. Przeniesienie ich do drugiego projektu oznacza kopiowanie i ręczne poprawki, a agent bez jasnych zasad potrafi zastosować reguły jednego projektu w innym.',
      ],
      solution: {
        text: [
          'Procedura, czyli jak ticket jest otwierany, planowany, testowany, przeglądany i scalany, jest oddzielona od faktów projektu. Każda procedura zaczyna od rozpoznania profilu projektu i zatrzymuje się, jeśli go nie znajdzie.',
        ],
        points: [
          'procedury flow-* bez faktów żadnego projektu',
          'profil projektu: zasady scalania, komendy testów, bramki jakości',
          'review w dwóch osiach: standardy i specyfikacja, bez łączenia ich w jedną ocenę',
          'blokady dostępu i strażnik wycieku, który odrzuca treść z nazwami projektów lub danymi dostępowymi',
        ],
      },
      flow: {
        title: 'Przebieg ticketu',
        steps: [
          { title: 'Start', text: 'Ticket, gałąź i krótkie uzgodnienie zamiaru przed kodem.' },
          { title: 'Plan', text: 'Sprawdzenie założeń ticketu w repozytorium i plan zmian.' },
          { title: 'TDD', text: 'Test, który najpierw nie przechodzi, potem implementacja.' },
          {
            title: 'Review',
            text: 'Przegląd według standardów i według specyfikacji, osobno.',
          },
          {
            title: 'Werdykt',
            text: 'Ocena gotowości gałęzi i pull request; scalanie według zasad profilu.',
          },
        ],
      },
      demo: {
        title: 'Zapis przebiegu',
        text: 'Nagrany przebieg na syntetycznym, publicznym przykładzie.',
      },
      stack: ['Claude Code', 'Codex', 'Bash', 'Node.js', 'GitHub CLI'],
    },
  },
};
