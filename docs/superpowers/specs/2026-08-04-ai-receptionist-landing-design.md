# AI Receptionist Landing Page — Design

**Date:** 2026-08-04
**Status:** Approved, in build
**Deliverable:** `receptionist-dark-closer.html` + `index.html` update

## Goal

Reuse the Variant A ("Dark Closer") landing page structure to sell Prime AI's AI
receptionist to high-ticket local service businesses, without diluting the
existing real-estate lead-gen page.

## Audience

High-ticket local services: dental and cosmetic clinics, law firms, HVAC and
plumbing — any business where one job is worth €1,000+ and the phone is the
primary intake channel.

Chosen over a single named niche (better conversion, but needs one file per
trade) and over generic "all local services" (ROI math becomes uncitable when a
missed call is worth €45 to a barber and €4,000 to an implant clinic).

## Primary CTA

**Live demo number** — "call this number and talk to your new receptionist."
The product demonstrates itself in 60 seconds, which beats any stat on the page.

The line is **not live yet**. Ships as `+31 6 XXXX XXXX` with a
`<!-- TODO: swap before launch -->` comment, wired as a `tel:` link in the hero,
sticky nav, mobile bottom bar, and final CTA. The 5-step qualifying form remains
the secondary CTA and the actual lead capture.

**Launch blocker:** a dead demo number damages trust more than not offering one.
Do not push to GitHub Pages until the number resolves.

## Files

```
receptionist-dark-closer.html   cp of variant-a-dark-closer.html, content rewritten
index.html                      two groups: Real Estate / AI Receptionist
```

Variant A only. If it converts, B and C are a copy-paste of this content into
their markup.

**Not doing:** folder restructure, shared CSS extraction, template engine. Two
pages do not justify an abstraction; revisit at the third product.

## Statistics policy

The template's credibility rests on named sources (NAR, Harvard Business
Review). Every stat on the receptionist page must trace to a named primary
source or be labelled as arithmetic. No stat gets a fabricated attribution.

### Accepted

| Stat | Source |
|---|---|
| 62% of small-business calls go unanswered | [411 Locals, 2024](https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/) — 85 businesses, 58 industries, 30 days (37.8% live, 37.8% voicemail, 24.3% no response) |
| 21x more likely to convert within 5 minutes | Harvard Business Review |
| €2,791/mo average Dutch receptionist salary | [Indeed NL](https://nl.indeed.com/career/receptionist/salaries) |
| 168 hours/week covered vs 40 | Arithmetic — labelled as such, not presented as research |

### Rejected

- **"85% never call back" / "86% hang up" / "80%" / "90%"** — one claim, four
  numbers, no primary source. Circulated between AI-receptionist vendors.
- **"$126,000/year lost per small business"** — vendor blog arithmetic presented
  as a study.
- **"62% of unanswered callers contact a competitor"** — numerically identical to
  the unanswered-call figure, consistent with a copy-paste error that propagated.
- **Hiya State of the Call** — a real report (150B+ calls), but it measures
  consumers not answering *outbound* business calls. Multiple vendor blogs cite
  it for the opposite claim. Wrong direction.

Caveat to keep in mind: 411 Locals is itself a marketing company and n=85 is
small. It is the best available primary source, not a strong one.

## Content map

| Section | Change |
|---|---|
| Nav | CTA → "Hear It Live" (tel: link) |
| Hero | "Your Phone Rang 200 Times Last Month. You Answered 76 of Them." + demo number |
| Stats | The four accepted stats above |
| Problem | Rings during a procedure/on a job · after-hours emergency reaches a competitor · receptionist costs €2,791/mo, takes holidays, sleeps · paying Google Ads to ring an unanswered phone |
| Solution | 1 Map your call flow → 2 Build + train on your services → 3 Run, monitor, tune weekly |
| Bonus stack | Receptionist trained on your services · calendar integration · weekly transcripts + report · after-hours overflow · emergency escalation rules |
| ROI | See model below |
| Proof | Dan's founder story kept; closing line reframed to call handling. Case study retained — it already includes AI call handling and call scoring |
| Video | Copy reframed |
| Qualify | FOR: 100+ calls/mo, jobs €1,000+, already missing after-hours / NOT: <30 calls/mo, want a self-serve chatbot, want cheapest |
| FAQ | Rewritten to receptionist objections, including GDPR (below) |
| Final CTA | Guarantee + scarcity reframed; scarcity month corrected (currently reads "June") |
| Footer | Unchanged |
| Form | 5 steps rewritten + `calculateLoss()` remodelled |

## ROI model

The static ROI section and the form's `calculateLoss()` must agree.

```
missed new-customer calls = calls × missRate × newCustomerShare
lost revenue              = missed new-customer calls × jobValue × closeRate
```

`newCustomerShare = 0.35` — most inbound calls are existing customers,
suppliers, or spam. Omitting this was inflating results to implausible numbers
(€108k/month for a large clinic), which destroys credibility faster than a small
number does.

`closeRate` scales inversely with job value — a €5,000 job does not close at the
same rate as a €400 one.

**Static section:** 200 calls → 30% unanswered → 21 missed new customers →
€2,500 average job → **€13,125/month**. Headline uses 30%, half the cited
industry rate; the killer line notes that at the 62% average it exceeds €27,000.

**Form steps:**

1. Calls per month → `<50: 35, 50-150: 100, 150-300: 225, 300+: 400`
2. What happens now when nobody answers → `voicemail: 0.35, rings out: 0.45, answering service: 0.15, team member: 0.10`
3. Business type → segmentation only, no effect on the math
4. Average value of a new customer → `<500: 350, 500-1500: 1000, 1500-5000: 3000, 5000+: 8000`
5. Name / email / phone

Results screen shows raw missed calls as the headline number and the
new-customer subset in the detail line, so the big number stays accurate to what
it claims to measure.

## GDPR

Targeting dental and cosmetic clinics in the EU means call content is health
data — special category under GDPR Art. 9. Recording and transcribing it needs a
lawful basis and a processor agreement.

Scope here is **one FAQ entry answering it as a sales objection**, because it is
the first thing a clinic will ask. The actual compliance setup (DPA templates,
retention policy, data residency) is a business decision outside this page.

## Out of scope

- Wiring the demo line to a live AI agent
- Variants B and C
- Actual GDPR/DPA paperwork
- Form backend — submission is still client-side only, as on the existing page
