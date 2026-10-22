import { documentHtml, escapeHtml, formatMoney, logoSvg, text } from '../shared/html.ts';
import {
  isDraft,
  pricing as defaultPricing,
  type Category,
  type Pricing,
} from '../oferta/pricing.ts';
import { priceQuote, type QuoteData, type Totals } from './quote.ts';

// Price quote for a Dig.IT 2/2026 application (T-05 form b), Polish only (D-035). Every
// requirement from requirements.ts is placed with `data-req`; requirements.test.ts checks it.

export interface QuoteOptions {
  data: QuoteData;
  /** Contact e-mail from the CV content outside the repo; `{{EMAIL}}` when unknown. */
  email: string | null;
  pricing?: Pricing;
}

/** Cost categories exactly as in the application form (Wzór wniosku, pkt 20.1.1.3). */
export const CATEGORY_LABEL: Record<Category, { part: string; form: string }> = {
  programming: {
    part: 'Technologia cyfrowa — oprogramowanie na zamówienie',
    form: 'Komponent obligatoryjny – zakup usług programistycznych',
  },
  implementation: {
    part: 'Wdrożenie',
    form: 'Komponent obligatoryjny – wdrożenie Technologii cyfrowych do działalności przedsiębiorstwa',
  },
  training: {
    part: 'Szkolenie',
    form: 'Komponent fakultatywny – przeszkolenie pracowników przedsiębiorstwa z wykorzystania zakupionych Technologii cyfrowych',
  },
};

const CATEGORIES: Category[] = ['programming', 'implementation', 'training'];

const money = (grosze: number | null | undefined, field = '{{KWOTA}}'): string =>
  grosze === null || grosze === undefined
    ? text(field)
    : escapeHtml(formatMoney(grosze, 'pl', { decimals: true }));

const list = (items: string[]): string =>
  `<ul>${items.map((i) => `<li>${text(i)}</li>`).join('')}</ul>`;

const totalsCells = (t: Totals | null | undefined): string =>
  `<td class="num">${money(t?.net)}</td><td class="num">${money(t?.vat)}</td><td class="num">${money(t?.gross)}</td>`;

export function renderQuote(opts: QuoteOptions): string {
  const q = opts.data;
  const p = opts.pricing ?? defaultPricing;
  const priced = priceQuote(q, p);
  const vatPct = `${String(Math.round(p.vatRate * 100))}%`;
  const rate = formatMoney(p.dayRateNet * 100, 'pl');
  const c = {
    name: q.contractor?.name ?? '{{NAZWA_FIRMY}}',
    nip: q.contractor?.nip ?? '{{NIP}}',
    address: q.contractor?.address ?? '{{ADRES}}',
    email: q.contractor?.email ?? opts.email ?? '{{EMAIL}}',
    signatory: q.contractor?.signatory ?? '{{OSOBA_PODPISUJACA}}',
  };

  const draft = isDraft(p)
    ? '<p class="draft-badge" data-draft>Cennik wstępny — do zatwierdzenia</p>'
    : '';
  const example = q.example
    ? `<p class="example-banner" data-example>${escapeHtml(q.example)}</p>`
    : '';

  const stageRows = priced.stages
    .map(
      (s, i) => `<tr>
        <td class="num">${String(i + 1)}</td>
        <td>${text(s.label)}</td>
        <td class="cat">${escapeHtml(CATEGORY_LABEL[s.category].part)}</td>
        <td class="num">${s.days === null ? text('{{DNI}}') : String(s.days)}</td>
        ${totalsCells(s.net === null ? null : { net: s.net, vat: s.vat ?? 0, gross: s.gross ?? 0 })}
      </tr>`,
    )
    .join('');

  const splitRows = CATEGORIES.map((cat) => {
    const t = priced.byCategory?.[cat];
    const share =
      t && priced.services && priced.services.net > 0
        ? `${(Math.round((t.net / priced.services.net) * 1000) / 10).toLocaleString('pl-PL')}%`
        : '{{UDZIAL}}';
    return `<tr>
      <td><strong>${escapeHtml(CATEGORY_LABEL[cat].part)}</strong><br /><span class="form-cat">${escapeHtml(CATEGORY_LABEL[cat].form)}</span></td>
      ${totalsCells(t)}
      <td class="num">${text(share)}</td>
    </tr>`;
  }).join('');

  const externalRows = q.externalCosts
    .map(
      (e) => `<tr>
        <td>${text(e.name)}</td>
        <td>${text(e.provider)}</td>
        <td>${text(e.dataRegion)}</td>
        <td>${text(e.sla)}</td>
        <td class="num">${e.projectNet === null ? text('{{KWOTA}}') : money(e.projectNet * 100)}</td>
        <td>${text(e.monthlyAfter)}</td>
      </tr>`,
    )
    .join('');

  const scheduleRows = priced.stages
    .map(
      (s, i) =>
        `<tr><td class="num">${String(i + 1)}</td><td>${text(s.label)}</td><td>${text(s.schedule)}</td></tr>`,
    )
    .join('');

  const paymentRows = q.payment
    .map((m) => `<tr><td>${text(m.milestone)}</td><td class="num">${text(m.share)}</td></tr>`)
    .join('');

  const hypercare = priced.stages.find((s) => s.id === 'hypercare');
  const hypercareDays = hypercare?.days === null || !hypercare ? '{{DNI}}' : String(hypercare.days);

  const body = `<article class="doc quote">
  <header class="doc-header">
    ${logoSvg('doc-logo')}
    <div class="doc-header-meta">
      <p class="label">Oferta cenowa · Dig.IT 2/2026</p>
      ${draft}
    </div>
  </header>
  ${example}

  <h1>Oferta cenowa nr ${text(q.offer.number)}</h1>
  <p class="lead">${text(q.scope.title)}</p>

  <dl class="meta">
    <div data-req="3"><dt>Data oferty</dt><dd>${text(q.offer.date)}, ${text(q.offer.place)}</dd></div>
    <div data-req="28"><dt>Ważność</dt><dd>${String(q.offer.validityDays)} dni od daty oferty</dd></div>
    <div data-req="5"><dt>Dotyczy zapytania</dt><dd>${text(q.inquiry.reference)} z dnia ${text(q.inquiry.date)}: „${text(q.inquiry.subject)}”</dd></div>
  </dl>

  <div class="parties">
    <section data-req="24">
      <h2>Wykonawca</h2>
      <p><strong>${text(c.name)}</strong><br />NIP: ${text(c.nip)}<br />${text(c.address)}<br />e-mail: ${text(c.email)}</p>
    </section>
    <section data-req="25">
      <h2>Zamawiający</h2>
      <p><strong>${text(q.client.name)}</strong><br />${text(q.client.address)}</p>
    </section>
  </div>

  <p class="intro" data-req="1">Wykonawca przedstawia ofertę cenową w odpowiedzi na zapytanie Zamawiającego. Oferta służy szacowaniu wartości wydatków projektu w konkursie Dig.IT 2/2026 (Reg. § 6 ust. 3), do którego wniosku Zamawiający dołącza co najmniej trzy oferty cenowe.</p>

  <section data-req="6">
    <h2>1. Przedmiot oferty</h2>
    <p>${text(q.scope.process)}</p>
    <div class="cols-3">
      <div><h3>Funkcje</h3>${list(q.scope.functions)}</div>
      <div><h3>Integracje</h3>${list(q.scope.integrations)}</div>
      <div><h3>Produkty i rezultaty</h3>${list(q.scope.deliverables)}</div>
    </div>
    <p class="fine" data-req="21">Przedmiotem oferty jest nowa technologia cyfrowa tworzona na zamówienie Zamawiającego. Nie jest to aktualizacja ani nowa wersja oprogramowania, z którego Zamawiający już korzysta (Reg. § 4 ust. 10).</p>
  </section>

  <section class="price-section">
    <h2>2. Cena</h2>
    <table class="price" data-req="10 11 13">
      <thead><tr><th class="num">Lp.</th><th>Etap</th><th>Część (kategoria Dig.IT)</th><th class="num">Osobodni</th><th class="num">Netto</th><th class="num">VAT ${vatPct}</th><th class="num">Brutto</th></tr></thead>
      <tbody>${stageRows}</tbody>
      <tfoot><tr><td></td><td colspan="2">Razem usługi wykonawcy (ryczałt)</td><td class="num">${priced.days === null ? text('{{DNI}}') : String(priced.days)}</td>${totalsCells(priced.services)}</tr></tfoot>
    </table>
    <p class="fine" data-req="13">Kalkulacja: liczba osobodni × stawka ${escapeHtml(rate)} netto za osobodzień (${String(p.hoursPerDay)} h). Cena każdego etapu jest ryczałtowa; liczba osobodni obejmuje rezerwę na ryzyko projektu. Kwoty w PLN.</p>

    <h3>Podział ceny według części zamówienia</h3>
    <table class="split" data-req="9 10">
      <thead><tr><th>Część zamówienia / kategoria kosztu we wniosku</th><th class="num">Netto</th><th class="num">VAT ${vatPct}</th><th class="num">Brutto</th><th class="num">Udział</th></tr></thead>
      <tbody>${splitRows}</tbody>
    </table>

    <h3>Koszty zewnętrzne w okresie projektu (szacunek)</h3>
    <table class="external" data-req="20">
      <thead><tr><th>Pozycja</th><th>Dostawca</th><th>Region danych</th><th>Gwarancja dostępności</th><th class="num">Netto w okresie projektu</th><th>Po projekcie (płaci Zamawiający)</th></tr></thead>
      <tbody>${externalRows}</tbody>
    </table>
    <p class="fine" data-req="15 20">Koszty zewnętrzne nie są wynagrodzeniem wykonawcy: są rozliczane według faktur dostawców, wyłącznie za okres kwalifikowalności projektu, od dostawców z gwarantowanym poziomem dostępności i odpowiedzialnością za dane. Za oprogramowanie wykonane na zamówienie nie są pobierane opłaty licencyjne ani subskrypcyjne.</p>

    <table class="grand" data-req="11">
      <tbody>
        <tr><th>Razem netto (usługi + koszty zewnętrzne)</th><td class="num">${money(priced.total?.net)}</td></tr>
        <tr><th>VAT ${vatPct}</th><td class="num">${money(priced.total?.vat)}</td></tr>
        <tr class="grand-total"><th>Razem brutto</th><td class="num">${money(priced.total?.gross)}</td></tr>
      </tbody>
    </table>
    <p class="fine" data-req="2">Wartość zamówienia przekracza 20 000 zł netto, więc podlega szacowaniu wartości wydatków (zał. 9 pkt 2). Podatek VAT nie jest kosztem kwalifikowalnym.</p>
  </section>

  <section data-req="12">
    <h2>3. Harmonogram</h2>
    <p>Łączny czas realizacji: ${text(q.duration)}. Terminy liczone od dnia podpisania umowy; każdy etap kończy się protokołem odbioru.</p>
    <table class="schedule">
      <thead><tr><th class="num">Lp.</th><th>Etap</th><th>Termin od podpisania umowy</th></tr></thead>
      <tbody>${scheduleRows}</tbody>
    </table>
  </section>

  <section data-req="7">
    <h2>4. Zestawienie do porównania ofert</h2>
    <dl class="compare">
      <div><dt>Cena</dt><dd>${money(priced.total?.net)} netto / ${money(priced.total?.gross)} brutto</dd></div>
      <div><dt>Termin realizacji</dt><dd>${text(q.duration)}</dd></div>
      <div><dt>Kluczowe funkcjonalności</dt><dd>${q.scope.functions.map(text).join('; ')}</dd></div>
      <div><dt>Gwarancja</dt><dd>${text(q.warranty)}</dd></div>
      <div><dt>Wsparcie w okresie projektu</dt><dd>${text(hypercareDays)} osobodni wsparcia powdrożeniowego, do odbioru końcowego</dd></div>
    </dl>
  </section>

  <section data-req="8">
    <h2>5. Przewagi techniczne</h2>
    ${list(q.advantages)}
  </section>

  <section data-req="18">
    <h2>6. Wdrożenie i wsparcie</h2>
    <p>Wdrożenie obejmuje integrację rozwiązania z dotychczasowymi systemami Zamawiającego oraz usługi doradcze dostawcy technologii niezbędne do jej uruchomienia. Wsparcie powdrożeniowe jest świadczone wyłącznie w okresie realizacji projektu i kończy się odbiorem końcowym. Oferta nie zawiera abonamentu utrzymaniowego ani usług o charakterze ciągłym lub okresowym; ewentualne utrzymanie po projekcie to osobna umowa poza projektem.</p>
  </section>

  <section data-req="19">
    <h2>7. Szkolenie</h2>
    <p>Szkolenie dotyczy wyłącznie korzystania z wdrażanej technologii. Uczestnicy: ${text(q.training.participants)}. Czas: ${text(q.training.days)}. Prowadzi wykonawca (trener niepowiązany z Zamawiającym); materiały szkoleniowe w cenie.</p>
    ${list(q.training.program)}
  </section>

  <section data-req="17">
    <h2>8. Zgodność z AI Act</h2>
    <p>Rozwiązanie zostanie zaprojektowane i wdrożone zgodnie z rozporządzeniem (UE) 2024/1689 (AI Act): klasyfikacja systemu według poziomu ryzyka przed rozpoczęciem budowy, nadzór człowieka nad decyzjami (pola niepewne trafiają do weryfikacji), rejestrowanie zdarzeń i śladu decyzji agenta, informowanie użytkowników o pracy z systemem AI oraz dokumentacja techniczna. Wykonawca przekazuje notatkę zgodności z AI Act jako część dokumentacji.</p>
  </section>

  <section>
    <h2>9. Prawa autorskie, rozbudowa, konkurencja</h2>
    <ul>
      <li data-req="14">Wykonawca przenosi na Zamawiającego całość autorskich praw majątkowych do oprogramowania wytworzonego na zamówienie, wraz z kodem źródłowym i dokumentacją, na polach eksploatacji niezbędnych do korzystania z niego, jego modyfikacji i rozbudowy, z chwilą zapłaty za dany etap, i zobowiązuje się do niewykonywania autorskich praw osobistych. Wynagrodzenie za przeniesienie praw jest wliczone w cenę.</li>
      <li data-req="15">Za oprogramowanie na zamówienie nie są pobierane opłaty licencyjne. Wykorzystane biblioteki open source są wykazane w dokumentacji wraz z licencjami.</li>
      <li data-req="16">Zamawiający otrzymuje kod źródłowy, dokumentację techniczną i opis interfejsów, co pozwala rozbudowywać rozwiązanie w przyszłości, samodzielnie lub z dowolnym wykonawcą.</li>
      <li data-req="31">Oferta nie zawiera warunków wyłączności ani zapisów uzależniających Zamawiającego od wykonawcy; rozwiązanie korzysta z otwartych interfejsów i standardowych formatów danych.</li>
    </ul>
  </section>

  <section>
    <h2>10. Wykonawca</h2>
    <ul>
      <li data-req="23">Usługi programistyczne objęte ofertą wykonawca realizuje samodzielnie, bez podzlecania osobom lub podmiotom trzecim (Reg. § 6 ust. 11 lit. e). Doświadczenie i potencjał: CV wykonawcy w załączniku, projekty pokazowe opisane na kokot.it, otwarte narzędzie tiller (github.com/Aberratio/tiller).</li>
      <li data-req="22">Wykonawca oświadcza, że nie jest powiązany z Zamawiającym kapitałowo, osobowo ani faktycznie, w tym przez powiązania rodzinne z członkami organów lub właścicielami Zamawiającego (w rozumieniu Reg. § 1 pkt 17–18).</li>
    </ul>
  </section>

  <section>
    <h2>11. Warunki</h2>
    <ul>
      <li data-req="28">Oferta jest ważna ${String(q.offer.validityDays)} dni od daty jej sporządzenia.</li>
      <li data-req="4">Na etapie realizacji projektu Zamawiający ponownie prowadzi rozeznanie rynku (Reg. § 6 ust. 4); cena może wtedy zostać zaktualizowana, w szczególności ze względu na zmianę zakresu lub czas, który upłynął od daty oferty.</li>
      <li data-req="32">Oferta nie jest umową ani zobowiązaniem do jej zawarcia. Zawarcie wiążącej umowy, rozpoczęcie prac i jakakolwiek płatność, w tym zaliczka, mogą nastąpić najwcześniej po złożeniu wniosku o powierzenie grantu (Reg. § 5 ust. 6).</li>
      <li data-req="30">Płatność przelewem na rachunek wykonawcy, w transzach po odbiorze etapów, na podstawie faktur VAT:</li>
    </ul>
    <table class="payment" data-req="30">
      <thead><tr><th>Transza (po odbiorze)</th><th class="num">Udział</th></tr></thead>
      <tbody>${paymentRows}</tbody>
    </table>
    <p class="fine"><span data-req="26">Oferta sporządzona w języku polskim.</span> <span data-req="29">Dokument w formacie PDF.</span></p>
  </section>

  <section class="signature" data-req="27">
    <div class="sign-line"></div>
    <p>${text(c.signatory)}<br /><span class="fine">podpis wykonawcy (kwalifikowany podpis elektroniczny albo podpis własnoręczny)</span></p>
  </section>
</article>`;

  return documentHtml({
    lang: 'pl',
    title: `Oferta cenowa ${q.offer.number} — kokot.it`,
    styles: ['oferta-cenowa/quote.css'],
    body,
  });
}
