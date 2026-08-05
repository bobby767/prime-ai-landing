# Spanish localisation — every market-specific figure, researched and flagged

_Researched 2026-08-05. Rows 1, 1b and 3 went live on the ENGLISH page
2026-08-05 (Dan: the salary was Dutch and the page sells in Málaga). Rows 2
and 4 are still unconfirmed — confirm them before the Spanish page ships._

The English page at `prime-ai.es/en/` was written with Dutch-market figures even
though it sells to businesses in Spain, so the corrections below are not only for
a future Spanish page — the ones marked LIVE are already on the English one.
`test-palette.js` pins them so the Dutch values cannot come back.

## Needs replacing

| # | Claim on the English page | Source there | Spanish equivalent found | Source | Confidence |
|---|---|---|---|---|---|
| 1 | ~~`€2,791/mo` average receptionist salary~~ **LIVE** | Indeed NL | **1.603 €/mes bruto** (19.235 €/año ÷ 12) | [Indeed ES](https://es.indeed.com/career/recepcionista/salaries), updated 29 Mar 2026 | High |
| 1b | **LIVE** — the headline stat is this one, not the gross | — | **2.118 €/mes true cost to employer** (1.603 € + 32,15% cotización empresarial) | [Grupo Castilla](https://www.grupocastilla.es/coste-trabajador/), [Factorial](https://factorial.es/blog/coste-empresa-trabajador/) | High |
| 2 | `€2,500` average job value (ROI calculator default) | unsourced | **150–300 €** general dental ticket medio; **400–700 €** depending on specialty | [consultoriadental.com](https://consultoriadental.com/como-optimizar-el-ticket-medio-en-tu-clinica/), [traspasodental.es](https://www.traspasodental.es/estetica-dental-valoracion-traspaso-clinica/) | **Low — still blocked, see below** |
| 3 | ~~FAQ "Can it handle Dutch and English?"~~ **LIVE** — now Spanish and English | — | Should read Spanish and English | — | n/a |
| 4 | `+31` phone formatting, NL references | — | Spanish formatting | — | n/a |

**Row 4 status.** No `+31` number survives on the English page — the demo CTA is
not a phone number at all any more, it opens the in-page call panel. What is left
under row 4 is only whatever a future Spanish page introduces.

**Which basis row 1 uses.** The page quotes 1.603 €/mes, i.e. the annual figure
over 12. If you would rather publish the 14-pagas basis (1.374 €/mes), the
all-in stat and `test-palette.js` both have to move with it.

**Cross-check on #1.** Jobted gives 1.379–1.759 €/mes bruto starting and
1.449–1.914 €/mes after five years, which brackets the Indeed figure. Two
independent sources agree, so 1.603 € is safe to publish. Note Spanish salaries
are often quoted over 14 pagas — 19.235 €/año over 14 is 1.374 €/mes. The page
should say which basis it uses.

**Why #2 is blocked, not just uncertain.** It is the single biggest lever in the
ROI calculator, and the honest answer depends on which vertical the page targets:

- The live `/voice` demo repo carries **both** `clinics/` and `fontaneros`
  (plumbers) assets. These have wildly different job values.
- General dental ticket medio is 150–300 €. Implants and ortho are 1.200–2.000 €.
  A plumber callout is lower still.
- The English page's own 2.500 € is already aggressive for general dentistry —
  it implies implant or ortho work, not check-ups.

Picking a number here silently would either understate the ROI to the point of
killing the pitch, or overstate it to the point of being a false claim. It needs
a decision on vertical first.

## Reusable as-is, but label the origin

| Claim | Note |
|---|---|
| `62%` of calls go unanswered | 411 Locals, 2024 — a **US** study of 85 businesses. Already sourced inline on the English page. Reusable if the citation stays visible, since the page shows its source. |
| `21x` more likely to convert inside 5 minutes | Harvard Business Review. General, not market-specific. |
| `168 hrs` covered vs 40 with a receptionist | Arithmetic, market-neutral. |
| GDPR framing | Becomes RGPD in Spanish. Same regulation, Spanish name. |

## Open decision before writing the Spanish copy

**Which vertical does the Spanish page address — dental/clinics, trades, or
both?** That answer sets figure #2, the calculator defaults, and whether the copy
says "paciente" or "cliente" throughout. The English page is clinic-framed: it
says "patient", "practice", and "we handle patient data".
