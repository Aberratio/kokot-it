import {
  documentHtml,
  escapeHtml,
  formatMoney,
  formatRange,
  brandSvg,
  draftBadge,
  list,
  text,
  type Lang,
} from '../shared/html.ts';
import { offerCopy } from './content.ts';
import { isDraft, pricing as defaultPricing, type Pricing } from './pricing.ts';

export interface OfferOptions {
  lang: Lang;
  /** Contact e-mail (basics.email from the CV content outside the repo); `{{EMAIL}}` when unknown. */
  email: string | null;
  pricing?: Pricing;
}

/** The presentation offer (T-05 form a): 1–2 A4 pages, PL or EN. */
export function renderOffer(opts: OfferOptions): string {
  const { lang } = opts;
  const p = opts.pricing ?? defaultPricing;
  const c = offerCopy[lang];
  const email = opts.email ?? '{{EMAIL}}';
  const draft = isDraft(p) ? draftBadge(c.draftBadge) : '';

  const packages = p.packages
    .map((pkg) => {
      const copy = c.packages.items[pkg.code];
      const external = pkg.externalNet
        ? `<p class="pkg-external">+ ${escapeHtml(c.packages.externalLabel)} ${escapeHtml(formatRange(pkg.externalNet[0], pkg.externalNet[1], lang))}</p>`
        : '';
      return `<section class="pkg" data-package="${pkg.code}">
        <p class="pkg-code">${pkg.code}</p>
        <h3>${text(copy.title)}</h3>
        <p class="pkg-price"><span class="pkg-amount">${escapeHtml(formatRange(pkg.netMin, pkg.netMax, lang))}</span> <span class="pkg-net">${escapeHtml(c.packages.netLabel)}</span></p>
        <p class="pkg-duration"><span class="label">${escapeHtml(c.packages.durationLabel)}</span> ${escapeHtml(pkg.duration[lang])}</p>
        ${external}
        <p class="pkg-for">${text(copy.forWhom)}</p>
        ${list(copy.points)}
        <p class="pkg-note">${text(copy.note)}</p>
      </section>`;
    })
    .join('\n');

  const steps = c.timeline.steps
    .map(
      (s, i) => `<li>
        <span class="step-index">${String(i + 1).padStart(2, '0')}</span>
        <span class="step-when">${escapeHtml(s.when)}</span>
        <strong class="step-what">${escapeHtml(s.what)}</strong>
        <span class="step-text">${text(s.text)}</span>
      </li>`,
    )
    .join('');

  const body = `<article class="doc offer">
  <header class="doc-header">
    ${brandSvg('logo-on-light', 'doc-logo')}
    <div class="doc-header-meta">
      <p class="label">${escapeHtml(c.eyebrow)}</p>
      ${draft}
    </div>
  </header>

  <h1>${escapeHtml(c.title)}</h1>
  <p class="lead">${text(c.lead)}</p>

  <div class="cols-2">
    <section>
      <h2>${escapeHtml(c.problem.title)}</h2>
      ${list(c.problem.points)}
    </section>
    <section>
      <h2>${escapeHtml(c.approach.title)}</h2>
      ${list(c.approach.points)}
    </section>
  </div>

  <section class="packages">
    <h2>${escapeHtml(c.packages.title)}</h2>
    <div class="pkg-grid">
${packages}
    </div>
    <p class="fine">${text(c.packages.priceNote(formatMoney(p.dayRateNet * 100, lang)))}</p>
  </section>

  <section class="timeline">
    <h2>${escapeHtml(c.timeline.title)}</h2>
    <ol class="steps">${steps}</ol>
  </section>

  <div class="cols-2">
    <section>
      <h2>${escapeHtml(c.deliverables.title)}</h2>
      ${list(c.deliverables.points)}
    </section>
    <section>
      <h2>${escapeHtml(c.eligibility.title)}</h2>
      ${list(c.eligibility.points)}
      <p class="fine">${text(c.eligibility.disclaimer)}</p>
    </section>
  </div>

  <div class="cols-2">
    <section>
      <h2>${escapeHtml(c.showcase.title)}</h2>
      ${list(c.showcase.points)}
      <p class="fine">${text(c.showcase.note)}</p>
    </section>
    <section>
      <h2>${escapeHtml(c.terms.title)}</h2>
      ${list(c.terms.points)}
    </section>
  </div>

  <section class="contact">
    <h2>${escapeHtml(c.contact.title)}</h2>
    <p>${text(c.contact.text)}</p>
    <p class="contact-line"><span class="contact-email">${text(email)}</span><span class="contact-site">${escapeHtml(c.contact.site)}</span></p>
  </section>
</article>`;

  return documentHtml({ lang, title: c.docTitle, styles: ['oferta/offer.css'], body });
}
