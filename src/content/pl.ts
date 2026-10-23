import type { SiteContent } from './types.ts';

// Polish site copy. Package prices are left out on purpose until the price list is approved.
export const pl: SiteContent = {
  meta: {
    title: 'kokot.it — wdrożenia AI dla produkcji i zespołów programistycznych',
    description:
      'Agenci AI dla firm produkcyjnych (dokumenty, jakość, planowanie) i dla zespołów programistycznych. Oferta wykonawcy do projektów z dotacją, np. Dig.IT.',
    siteName: 'kokot.it',
    ogImage: {
      headline: 'Agenci AI dla produkcji i zespołów programistycznych',
      alt: 'kokot.it — agenci AI dla produkcji i zespołów programistycznych; w tle sieć agentów przekazujących sobie zadania.',
    },
    areaServed: ['Polska', 'Unia Europejska'],
  },
  nav: {
    label: 'Nawigacja główna',
    services: 'Usługi',
    process: 'Współpraca',
    projects: 'Projekty',
    about: 'O kokot.it',
    contact: 'Kontakt',
  },
  anchors: {
    services: 'uslugi',
    process: 'wspolpraca',
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
    title: 'Jak wygląda współpraca',
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
      'Pięć projektów: trzy aplikacje referencyjne działające na przykładowych danych fikcyjnych firm, tiller, własne narzędzie z publicznym kodem, oraz Heartwood, gra logiczna. Pokazują sposób pracy i architekturę; nie są wdrożeniami u klientów. Aplikacje na stronie nie wywołują żadnego API: aplikacje referencyjne odtwarzają zapisane przebiegi, a gra działa w całości w przeglądarce.',
    cardCta: 'Case study',
  },
  about: {
    title: 'O kokot.it',
    text: [
      'kokot.it to marka usług inżynierskich w obszarze AI i agentic engineering: od analizy procesu, przez agentów i integracje, po interfejs, z którego korzystają ludzie. Ta strona i projekty referencyjne są przykładem tej pracy.',
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
        text: 'Przed startem projekt dostaje miernik sukcesu: czas obsługi, odsetek błędów albo przestoje.',
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
    note: 'Aplikacje referencyjne na tej stronie działają na danych przykładowych: firmy, dokumenty i dane produkcyjne są fikcyjne.',
  },
  caseStudy: {
    back: 'Wszystkie projekty',
    problem: 'Problem',
    solution: 'Rozwiązanie',
    tryIt: 'Wypróbuj',
    toolFallback:
      'Aplikacja wczytuje się w tym miejscu po przewinięciu strony i wymaga JavaScriptu. Można ją też otworzyć w osobnej karcie.',
    toolNote:
      'Zapisany przebieg: aplikacja odtwarza nagrane odpowiedzi na danych przykładowych i nie wywołuje API.',
    toolFrameTitle: 'Aplikacja',
    toolOpen: 'Otwórz aplikację w nowej karcie',
    newTab: 'otwiera się w nowej karcie',
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
        'Rozwiązanie referencyjne: hala produkcyjna w 3D ze statusem maszyn i agent AI, który odpowiada na pytania o zlecenia, przestoje i jakość.',
      card: {
        title: 'Cyfrowy bliźniak hali z agentem AI',
        summary:
          'Hala w 3D ze statusem maszyn. Agent odpowiada na pytania o zlecenia, przestoje i jakość i pokazuje odpowiedź w scenie.',
        tags: ['produkcja', 'Three.js', 'agent AI'],
      },
      lead: 'Hala produkcyjna w 3D, w której agent AI odpowiada na pytania o stan produkcji i pokazuje odpowiedź na modelu: podświetla maszynę, przesuwa kamerę.',
      kind: 'Rozwiązanie referencyjne, dane przykładowe',
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
          'dane przykładowe: fikcyjna firma, zlecenia, przestoje i wyniki kontroli jakości',
          'tryb nagrany bez kosztów i tryb na żywo z kluczem API uruchamiany lokalnie',
        ],
      },
      preview: {
        title: 'Pytania o stan hali',
        text: 'Kilka nagranych scenariuszy, np. pytanie o przestoje na linii i o zlecenia zagrożone opóźnieniem.',
      },
      stack: ['TypeScript', 'Three.js', 'Vite', 'Claude API (tool use)', 'Vitest'],
    },
    'production-docs-agent': {
      metaTitle: 'Agent do dokumentów produkcyjnych — kokot.it',
      metaDescription:
        'Rozwiązanie referencyjne: agent AI czyta zamówienia i raporty jakości, uzupełnia arkusz lub rekordy ERP i oznacza pola niepewne do weryfikacji.',
      card: {
        title: 'Agent do dokumentów produkcyjnych',
        summary:
          'Zamówienia i raporty jakości z PDF i e-maili zamienione w rekordy arkusza lub ERP, z weryfikacją przez człowieka.',
        tags: ['dokumenty', 'jakość', 'ERP'],
      },
      lead: 'Agent czyta zamówienia i raporty jakości w różnych formatach, wyciąga z nich dane do ustalonego schematu, a pola, których nie jest pewien, oddaje człowiekowi.',
      kind: 'Rozwiązanie referencyjne, dokumenty przykładowe',
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
          'eksport do CSV i XLSX, który w wersji referencyjnej zastępuje integrację z ERP',
          'tryb nagrany bez kosztów i tryb na żywo z kluczem API uruchamiany lokalnie',
        ],
      },
      preview: {
        title: 'Od dokumentu do rekordu',
        text: 'Nagrane przebiegi na kilku fikcyjnych zamówieniach i raportach jakości, w tym na dokumentach z brakującymi danymi.',
      },
      stack: ['TypeScript', 'Vite', 'Claude API (structured output)', 'SheetJS', 'Vitest'],
    },
    'grant-assistant': {
      metaTitle: 'Asystent wniosku dotacyjnego — kokot.it',
      metaDescription:
        'Rozwiązanie referencyjne: dopasowanie firmy do naborów według jawnych reguł i szkic opisu projektu. Nie jest poradą prawną ani gwarancją dotacji.',
      card: {
        title: 'Asystent wniosku dotacyjnego',
        summary:
          'Dopasowanie firmy do naborów według jawnych reguł i szkic opisu projektu dla najlepszego dopasowania.',
        tags: ['dotacje', 'reguły', 'agent AI'],
      },
      lead: 'Na podstawie krótkiego opisu firmy asystent sprawdza warunki kilku naborów, wskazuje te niespełnione i przygotowuje roboczy szkic opisu projektu dla najlepszego dopasowania, od którego firma albo jej doradca mogą zacząć pracę nad wnioskiem.',
      kind: 'Rozwiązanie referencyjne, dane naborów z datą stanu',
      problem: [
        'Firma, która myśli o dotacji, musi najpierw ustalić, do których naborów w ogóle się kwalifikuje: wiek firmy, wynik finansowy, branża, region. Te warunki są rozrzucone po regulaminach, a wstępna ocena zajmuje czas jej i doradcy.',
      ],
      solution: {
        text: [
          'Warunki kwalifikowalności są zapisane jako jawne, testowane reguły, a nie zostawione ocenie modelu. Model językowy przygotowuje tylko roboczy szkic opisu projektu; wniosek pisze i składa firma. Wynik pokazuje też listę dokumentów do przygotowania.',
          'Asystent pomaga we wstępnej ocenie; nie zastępuje wniosku ani doradcy, nie jest poradą prawną i nie gwarantuje dotacji. Dane naborów mają datę stanu i linki do źródeł.',
        ],
        points: [
          'reguły np. dla Dig.IT: lata działalności, dodatni wynik, profil produkcyjny',
          'lista dopasowań z uzasadnieniem i niespełnionymi warunkami',
          'szkic opisu projektu i lista dokumentów do przygotowania',
          'zastrzeżenie widoczne w interfejsie',
        ],
      },
      preview: {
        title: 'Dopasowanie do naborów',
        text: 'Nagrane przebiegi dla kilku fikcyjnych profili firm.',
      },
      stack: ['TypeScript', 'Vite', 'Zod', 'Claude API', 'Vitest'],
    },
    tiller: {
      metaTitle: 'Agentic dev workflow: case study tillera — kokot.it',
      metaDescription:
        'Case study tillera: otwarte procedury dla agentów AI w wytwarzaniu oprogramowania. Plan, TDD, review w dwóch osiach, werdykt na konkretnym SHA i twarde granice.',
      card: {
        title: 'Agentic dev workflow: tiller',
        summary:
          'Procedury dla agentów AI od planu ticketu przez TDD po review i PR, z profilem projektu, rejestrem decyzji i twardymi granicami.',
        tags: ['zespoły dev', 'agenci AI', 'open source'],
      },
      lead: 'tiller to otwarty zestaw procedur (skilli) dla agentów AI w wytwarzaniu oprogramowania. Procedury są wspólne dla wszystkich projektów, fakty projektu żyją w jego profilu, a decyzje w rejestrze, który czytają kolejne kroki.',
      kind: 'Narzędzie własne, repozytorium publiczne (MIT)',
      problem: [
        'Agent AI w repozytorium szybko pisze kod. Bez procesu wokół niego zespół dostaje jednak zmiany, których nikt nie zaplanował, testy dopisane po fakcie i review, które sprawdza styl, a nie to, czy zmiana robi to, co miała.',
        'Braki są zwykle cztery. Brak specyfikacji, od której agent zaczyna. Brak review, które oddziela zgodność z konwencjami od zgodności z ticketem. Brak granic: czego agent nie robi sam, np. nie scala, nie wysyła wiadomości, nie dotyka cudzego PR-a. Brak pamięci decyzji, więc każda sesja zaczyna od zera, a review zgłasza uzgodnione wcześniej odstępstwa jako błędy.',
        'Do tego instrukcje dla agentów, które rosną w jednym projekcie, wchłaniają jego fakty: zasady scalania, komendy testów, adresy środowisk. W drugim projekcie trzeba je kopiować i poprawiać, a agent może zastosować reguły jednego projektu w innym.',
      ],
      solution: {
        text: [
          'tiller oddziela procedurę od faktów. Procedura to sposób, w jaki ticket jest otwierany, planowany, testowany, przeglądany i scalany. Fakty to wszystko, czym różnią się projekty: tracker, konwencja gałęzi, komendy testów, bramki CI, kto może scalić. Każdy skill, który pracuje na tickecie, zaczyna od rozpoznania profilu projektu (krok −1) i zatrzymuje się, jeśli go nie znajdzie.',
          'Na tym szkielecie stoją kroki, które pilnują jakości. Plan sprawdza założenia ticketu w kodzie. TDD zaczyna od testu, który pada z powodu opisanego w tickecie. Review idzie w dwóch niezależnych osiach. Werdykt wydaje świeża sesja, która nie pisała kodu.',
        ],
        points: [
          'skille flow-*: od otwarcia ticketu, planu i TDD przez review, commit i PR po werdykt, diagnozę błędów i ręczne QA; żaden nie zawiera faktów konkretnego projektu',
          'profil projektu: lokalny plik z faktami (tracker, gałęzie, komendy testów, bramki, zasady scalania, granice), sprawdzany skryptem przed przebiegiem bez nadzoru',
          'brainy: prywatne repozytoria wiedzy o projekcie z rejestrem decyzji D-nnn i pytań Q-nnn; decyzja staje się „agreed” dopiero po potwierdzeniu przez człowieka',
          'rejestr decyzji gałęzi: świadome odstępstwo zapisane w chwili decyzji, czytane przez review i werdykt',
          'review dwuosiowe: Standards (konwencje repozytorium) i Spec (ticket plus późniejsze ustalenia), raportowane obok siebie, bez łączenia w jedną ocenę',
          'confidence check: werdykt high-confidence albo needs-review wyliczany z warunków, w tym z dowodu, że testy przechodzą na konkretnym SHA (CI albo ponowne uruchomienie lokalnie)',
          'przebieg bez nadzoru: ticket w czternastu fazach z punktami kontrolnymi i limitami; decyzja, która dotyka granicy z listy inviolables, zatrzymuje przebieg i czeka na człowieka',
          'helm: prywatny przegląd wszystkich projektów (etap, terminy, obietnice); doradza, nigdy sam nie zaczyna pracy',
          'strażnik wycieku i hook dostępu: commit z nazwą projektu, osoby albo kluczem jest odrzucany, a sesja jednego projektu nie czyta profilu innego projektu ani braina, do którego nie dostała dostępu',
        ],
      },
      flow: {
        title: 'Przebieg ticketu',
        diagram: {
          title: 'Przebieg ticketu w tillerze',
          desc: 'Schemat od góry do dołu. Skill rozpoznaje profil projektu i bez niego się zatrzymuje. Potem start ticketu, plan, TDD, review w dwóch równoległych osiach (Standards i Spec), commit i szkic PR, werdykt confidence check w świeżej sesji. Na końcu scalenie przez agenta, jeśli profil na to pozwala, albo PR czekający na podpis człowieka. Z boku rejestr decyzji gałęzi: zapisują go plan i TDD, czytają review i werdykt.',
          caption:
            'Przebieg interaktywny, jeden skill na krok; ostatni wiersz to zasada scalania z profilu. Przebieg bez nadzoru przechodzi te same kroki w czternastu fazach sterownika.',
          rows: [
            [{ label: 'Profil projektu', skill: 'krok −1', note: 'brak profilu = stop' }],
            [{ label: 'Start', skill: 'flow-start-ticket', note: 'ticket, gałąź, krótki plan' }],
            [
              {
                label: 'Plan',
                skill: 'flow-plan-ticket',
                note: 'założenia, seamy, decyzje',
                ledger: 'write',
              },
            ],
            [
              {
                label: 'TDD',
                skill: 'flow-tdd',
                note: 'czerwony → zielony, bramki repo',
                ledger: 'write',
              },
            ],
            [
              {
                label: 'Standards',
                skill: 'flow-code-review',
                note: 'konwencje repo',
                ledger: 'read',
              },
              {
                label: 'Spec',
                skill: 'flow-code-review',
                note: 'ticket i ustalenia',
                ledger: 'read',
              },
            ],
            [
              {
                label: 'Commit i PR',
                skill: 'flow-create-pull-request',
                note: 'PR zawsze jako szkic',
              },
            ],
            [
              {
                label: 'Werdykt',
                skill: 'flow-confidence-check',
                note: 'świeża sesja, testy na SHA',
                ledger: 'read',
              },
            ],
            [
              { label: 'Scala agent', skill: 'merge authority', note: 'gdy profil pozwala' },
              { label: 'Podpis człowieka', skill: 'ready-to-sign', note: 'PR czeka otwarty' },
            ],
          ],
          rail: 'rejestr decyzji gałęzi → czytają go review i werdykt',
        },
        steps: [
          {
            title: 'Profil',
            text: 'Skill rozpoznaje projekt po zmiennej środowiskowej, pliku .tiller-profile albo ścieżce repozytorium. Brak profilu oznacza stop, nie zgadywanie.',
          },
          {
            title: 'Start',
            text: 'Ticket sprawdzony (status, blokady, kryteria akceptacji), gałąź z aktualnego main, krótki plan uzgodniony przed kodem.',
          },
          {
            title: 'Plan',
            text: 'Założenia ticketu sprawdzone w repozytorium, tabela seamów z poziomem testów i tym, co celowo zostaje bez testów. Decyzje trafiają do rejestru.',
          },
          {
            title: 'TDD',
            text: 'Test najpierw pada z powodu opisanego w tickecie, potem przechodzi. Zielony oznacza przejście bramek repozytorium na konkretnym SHA, a nie samą asercję.',
          },
          {
            title: 'Review',
            text: 'Dwie osie równolegle, w osobnych subagentach: Standards i Spec. Każde znalezisko ma lokalizację w pliku i dostaje rozstrzygnięcie.',
          },
          {
            title: 'Commit i PR',
            text: 'Commit w formacie z profilu, PR zawsze jako szkic, z wynikiem testów i zrzutami ekranu, gdy zmiana dotyczy interfejsu.',
          },
          {
            title: 'Werdykt',
            text: 'Confidence check w świeżej sesji: high-confidence albo needs-review. Kto scala, agent czy człowiek, określa profil.',
          },
        ],
      },
      preview: {
        title: 'Przykładowy przebieg',
        text: 'Sesja na fikcyjnym projekcie bookshelf-api, od otwarcia ticketu po werdykt.',
      },
      transcript: {
        label: 'Przykład ilustracyjny',
        intro:
          'Fikcyjny mini-projekt bookshelf-api (REST API w TypeScript) i ticket SHELF-12: filtrowanie listy książek po autorze. Log pokazuje, co robi każdy skill według jego opisu w repozytorium; nazwy, liczby i wyniki są wymyślone na potrzeby przykładu.',
        entries: [
          {
            command: '/flow-start-ticket SHELF-12',
            output: [
              { tone: 'muted', text: 'profil: bookshelf (plik .tiller-profile w repozytorium)' },
              {
                tone: 'plain',
                text: 'SHELF-12 · Filtrowanie książek po autorze · Backlog, bez blokad, 2 kryteria akceptacji',
              },
              {
                tone: 'plain',
                text: 'gałąź SHELF-12-filter-by-author z origin/main · status: In Progress',
              },
              { tone: 'plain', text: 'plan w 3 krokach uzgodniony przed kodem' },
            ],
          },
          {
            command: '/flow-plan-ticket SHELF-12',
            output: [
              {
                tone: 'plain',
                text: 'założenie potwierdzone: GET /books istnieje (src/routes/books.ts), parametru author brak',
              },
              {
                tone: 'plain',
                text: 'rodzaj: code · seam: filterBooks(books, query) · unit · przypadki spisane z góry',
              },
              {
                tone: 'plain',
                text: 'celowo nie testowane tu: warstwa HTTP poza jednym testem request',
              },
              {
                tone: 'muted',
                text: 'decyzja (self, do zmiany): pusty ?author= zwraca całą listę → rejestr decyzji',
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
              { tone: 'muted', text: 'czerwony z powodu z ticketu, nie z błędu uruchomienia' },
              { tone: 'green', text: '✓ 6 passed · lint ok · typecheck ok' },
              {
                tone: 'plain',
                text: 'pin: bez parametru lista się nie zmienia (zielony z założenia)',
              },
              {
                tone: 'muted',
                text: 'po cofnięciu implementacji test znów pada z tego samego powodu',
              },
            ],
          },
          {
            command: '/flow-code-review',
            output: [
              {
                tone: 'plain',
                text: 'Standards · 1 znalezisko · src/routes/books.ts:18 · nazwa parametru niezgodna z konwencją z README',
              },
              {
                tone: 'plain',
                text: 'Spec · 0 znalezisk · AC1 i AC2 pokryte, decyzja z rejestru uwzględniona',
              },
              { tone: 'green', text: 'znalezisko przyjęte i poprawione · ✓ 6 passed' },
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
                text: 'szkic PR #7 · opis: zakres, wynik testów, link do ticketu',
              },
            ],
          },
          {
            command: '/flow-confidence-check SHELF-12',
            output: [
              { tone: 'muted', text: 'nowa sesja; na wejściu tylko ticket' },
              { tone: 'plain', text: 'CI na head SHA: zielone' },
              { tone: 'plain', text: 'AC1 covered · AC2 covered · 0 blocker / high / medium' },
              { tone: 'green', text: 'werdykt: high-confidence' },
              {
                tone: 'muted',
                text: 'scalanie według merge authority z profilu: tutaj podpis człowieka',
              },
            ],
          },
        ],
        note: 'To nie jest nagranie prawdziwego projektu. Kroki i ich kolejność odpowiadają opisom skilli w repozytorium tillera; nic tu nie wywołuje API.',
      },
      results: {
        title: 'Wyniki i lekcje',
        intro:
          'Liczby z publicznego repozytorium, bez danych o wdrożeniach. Każdą można sprawdzić pod wskazaną ścieżką.',
        facts: [
          { value: '23', label: 'skille flow-*', source: 'skills/flow-*/SKILL.md' },
          {
            value: '1011',
            label: 'testów zadeklarowanych w 89 plikach testów Node',
            source: 'wiersze zaczynające się od test( (także z wcięciem) w *.test.mjs',
          },
          {
            value: '168',
            label: 'commitów na main od pierwszego, 12 października 2026',
            source: 'git rev-list --count d536250',
          },
          {
            value: '14',
            label: 'faz przebiegu bez nadzoru, każda z punktem kontrolnym',
            source: 'lib/driver/phases.mjs',
          },
          {
            value: '6',
            label: 'mandatów, w których rola owner proxy może działać za właścicielkę',
            source: 'README.md',
          },
          { value: 'MIT', label: 'licencja', source: 'LICENSE' },
        ],
        asOf: 'Stan: 22 października 2026, gałąź main repozytorium tillera (commit d536250).',
        lessonsTitle: 'Lekcje',
        lessons: [
          {
            title: 'Procedura osobno, fakty osobno',
            text: 'Skill bez faktów projektu przenosi się do kolejnego repozytorium przez napisanie profilu, a nie przez kopiowanie instrukcji. Skill ticketu, który nie rozpozna profilu, zatrzymuje się zamiast zgadywać.',
          },
          {
            title: 'Dwie osie review, nie jedna ocena',
            text: 'Kod może trzymać się wszystkich konwencji i robić nie to, co trzeba, albo odwrotnie. W połączonym raporcie jedna oś przykrywa drugą, dlatego Standards i Spec idą w osobnych subagentach.',
          },
          {
            title: 'Decyzje zapisane od razu',
            text: 'Odstępstwo, którego nie ma w rejestrze, review zgłasza jako błąd albo rozszerzenie zakresu. Zapisane w chwili decyzji staje się czymś, co review ocenia, a nie odkrywa.',
          },
          {
            title: 'Zielony to pomiar',
            text: 'Test jest zielony, gdy bramki przeszły na konkretnym SHA; bez tego werdykt nie będzie high-confidence. Sesja, która pisała kod, nie wydaje mu werdyktu.',
          },
          {
            title: 'Granice jako kod',
            text: 'Zasady scalania, bramki i lista inviolables są w profilu, a sprawdza je skrypt. Decyzja, która dotyka granicy, zatrzymuje przebieg i czeka na człowieka. Podpisu nie przejmuje żadna rola agenta.',
          },
        ],
      },
      stack: ['Claude Code', 'Codex', 'Bash', 'Node.js', 'GitHub CLI'],
    },
    'relay-defense': {
      metaTitle: 'Heartwood: logiczna gra tower defense — kokot.it',
      metaDescription:
        'Własny projekt: gra tower defense w świecie fantasy, zaprojektowana jak łamigłówka, z deterministyczną symulacją i poziomami wyważonymi przez solver.',
      card: {
        title: 'Heartwood: gra logiczna',
        summary:
          'Tower defense, w którym plan wygrywa z refleksem. Poziomy wyważone solverem z przewidywaniem i sprawdzone w CI.',
        tags: ['gra', 'symulacja', 'open source'],
      },
      lead: 'Gra tower defense w świecie fantasy, w przeglądarce, zaprojektowana jak łamigłówka: łuczniczki, druidzi, jednorożce i enty przeciw trollom, upiorom i wodzowi ogrów. Każda fala jest widoczna z wyprzedzeniem, symulacja jest deterministyczna, a między falami gra czeka na gracza. Dziesięć poziomów, każdy zbudowany wokół jednego pomysłu, i Oblężenie w pięciu rozdziałach na jednej mapie, w którym obrona przechodzi do kolejnych rozdziałów, a każdy dokłada nowe utrudnienie.',
      kind: 'Własny projekt, repozytorium publiczne (MIT)',
      problem: [
        'Grę tower defense łatwo zrobić trudną, a trudno uczciwą. Liczby ustawiane na wyczucie dają poziomy albo banalne, albo wygrywane szczęściem, a każda zmiana jednej wieży przesuwa balans wszystkich.',
        'Projekty z agentami i automatyzacją mają ten sam problem: zachowanie trzeba sprawdzać powtarzalnymi przebiegami i mierzalnym kryterium, a nie wrażeniem.',
      ],
      solution: {
        text: [
          'Logika gry to czysta, deterministyczna symulacja oddzielona od rysowania: te same ruchy zawsze dają ten sam wynik. Dzięki temu rozwiązania można odtwarzać w testach i wyszukiwać automatycznie.',
          'Solver z przewidywaniem sprawdza każdy dostępny ruch, symuluje nadchodzące fale i zostawia najlepszy. To on zapisał rozwiązanie referencyjne każdego poziomu; testy je odtwarzają i oczekują wygranej. Sonda z nieuważnym graczem, który stawia losowych obrońców przy trasie, pokazuje, że od trzeciego poziomu szczęście nie wystarcza.',
        ],
        points: [
          'siedmiu obrońców i siedem rodzajów potworów; każdy szczególny wymaga jednej wyraźnej odpowiedzi: pancerz, niewidzialność, rozpad, leczenie i boss osłaniający eskortę',
          'otwarta łąka, na której każdy obrońca jest częścią labiryntu, z podglądem nowej trasy przed budową',
          'każdy poziom ma 50–90% siły, którą solver jeszcze pokonuje; od trzeciego poziomu nieuważny gracz wygrywa najwyżej raz na dziesięć prób',
          'Oblężenie: porażka cofa na początek rozdziału, a przed pierwszą falą przeniesiona obrona sprzedaje się za pełną wartość, a złoto jest dopłacane tak, by obrona była warta co najmniej próg rozdziału, więc rozwiązanie od progu dowodzi, że każdy punkt kontrolny da się wygrać',
          'postacie z darmowych modeli 3D (CC0), uzupełnione o rekwizyty i wyrenderowane do grafik 2D skryptem w Blenderze; pełna obsługa klawiaturą, tryb ograniczonego ruchu, polski i angielski',
        ],
      },
      preview: {
        title: 'Dziesięć poziomów i Oblężenie',
        text: 'Zacznij od pierwszego poziomu: każda odprawa przedstawia nowego obrońcę albo potwora. Oblężenie znajdziesz pod listą poziomów. Postęp zapisuje się tylko w tej przeglądarce.',
      },
      toolNote: 'Gra działa w całości w przeglądarce i nigdzie niczego nie wysyła.',
      stack: ['TypeScript', 'Canvas 2D', 'Blender', 'Vite', 'Vitest', 'Playwright'],
    },
  },
};
