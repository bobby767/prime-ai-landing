# Prime AI — Product Context

**Register:** brand

Marketing surfaces where the design *is* the product. No app UI, no dashboard,
no authenticated views. Every page in this repo is a landing page whose only job
is to move a stranger to a phone call or a form submission.

## Product Purpose

Prime AI sells AI phone agents to businesses whose revenue arrives by telephone.
Two offers currently live in this repo:

- **AI Receptionist** (`receptionist.html`) — answers every inbound call 24/7,
  books into the calendar, escalates emergencies. Sold to high-ticket local
  services.
- **Real-estate lead engine** (`variant-a/b/c-*.html`) — the original offer,
  three untested copy variants.

## Users

High-ticket local services: dental and cosmetic clinics, law firms, HVAC and
plumbing. The qualifying trait is not the trade, it is the arithmetic — one job
worth €1,000+ and a phone as the primary intake channel. Below that job value
the ROI argument stops being honest, which is why the page names these trades
rather than "small business".

The reader is an owner-operator or practice manager, not a marketer. They are
mid-forties to sixties, sceptical of software vendors, and have been sold to
badly before. They are frequently reading between appointments on a phone.

## Tone

Direct, arithmetic, unembarrassed about money. The page argues with numbers the
reader can check against their own books, then invites them to verify the claim
themselves by phoning the demo line. It never says "revolutionise", "unlock",
"seamless", or "game-changing".

Confidence comes from specificity and from citing sources by name. Where a
figure is arithmetic rather than research, the page says so in the label.

## Brand

- **Trust is earned by verifiability, not by polish.** The primary CTA is "call
  it and hear it" precisely because a working demo outranks any claim.
- **Never fabricate a source.** See the statistics policy in
  `docs/superpowers/specs/2026-08-04-ai-receptionist-landing-design.md`. Four
  stats were rejected for unverifiable attribution, including several that
  competitors cite freely.
- **Never publish a dead promise.** A demo number that does not answer costs
  more trust than offering no demo at all.

## Anti-references

Things this brand must not resemble:

- **Clinic-blue SaaS.** Blue and cyan on pure white is the first-order palette
  reflex for anything medical or legal. Every competitor lands there. Prime AI's
  identity is warm ink and amber; blue is demoted to buttons and links only.
- **Agency dark mode.** Neon on near-black reads as crypto or growth-hacking to
  a fifty-five-year-old dental practice owner. The pages were deliberately
  converted from dark to light for this reason.
- **Vendor-blog statistics.** The "$126,000 lost per year" genre of made-up
  arithmetic presented as research.
- **Hero-metric template.** Big gradient number, small label, three supporting
  stats in identical cards.

## Strategic principles

- Two pages do not justify an abstraction. No shared CSS extraction, no template
  engine, no folder restructure until a third product exists.
- Copy variants ship only after the previous one has conversion data.
- The ROI model applies a `newCustomerShare = 0.35` factor. Without it the
  calculator reports figures large enough to read as a lie, which loses the
  reader at the exact moment the page asks for trust.
