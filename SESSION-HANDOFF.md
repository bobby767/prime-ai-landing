# Session Handoff — AI Receptionist landing page, light theme, founder rename

_Last updated: 2026-08-05_

## Where it started
User asked for the URL of the Prime AI landing page, then whether the existing
real-estate templates could be reused to promote an AI receptionist offer with the
same structure. Scope grew into building that page, converting it to a light theme,
and fixing a founder-name bug found along the way. Nothing has been pushed — all
work is committed locally only.

## Decisions locked + what shipped
- **Audience: high-ticket local services** (dental/cosmetic clinics, law firms,
  HVAC/plumbing) — chosen over a single named niche or generic "all local services",
  because the ROI math only stays honest when job values are €1,000+.
- **Primary CTA: live demo number** ("call it and hear it"), qualifying form as
  secondary capture. Number is a **placeholder** — 5 × `DEMO-NUMBER` markers in
  `/home/ubuntu/Prime_AI/Landingpage/receptionist.html`.
- **Stats policy: no fabricated attributions.** Accepted 411 Locals 2024 (62%),
  HBR (21x), Indeed NL (€2,791/mo); 4th card is labelled arithmetic. Rejected
  "85% never call back", "$126k/year", and Hiya State of the Call (measures
  outbound, cited backwards by vendor blogs).
- **ROI model got a `newCustomerShare = 0.35` factor** — without it a large clinic
  saw €108k/month, which reads as a lie. Static section and form calculator agree.
- **Light theme** — 28 hardcoded `rgba(255,255,255,x)` overlays replaced with
  semantic vars; added `--text-on-accent` (blue buttons were inheriting
  `--text-primary` and would have gone dark); brand cyan `#00E5FF` → `#0891B2`
  (was ~1.4:1 on white).
- **File renamed** `receptionist-dark-closer.html` → `receptionist.html` (git mv)
  once it stopped being dark.
- **Chase → Dan rename finished** across variants A/B/C — `9f222ca` had missed
  avatar initials and left the literal name in two places.
- Commits: `eb2bd97` (page), `d06d7eb` (light theme + rename), `ef2334d` (founder fix).

## Key files for next session
- `/home/ubuntu/Prime_AI/Landingpage/docs/superpowers/specs/2026-08-04-ai-receptionist-landing-design.md`
  — read first; full design rationale, stats accept/reject list with reasons, ROI model spec.
- `/home/ubuntu/Prime_AI/Landingpage/receptionist.html` — the deliverable;
  `calculateLoss()` near line 2320.
- `/home/ubuntu/Prime_AI/Landingpage/test-roi.js` — guards radio-value/lookup-key
  drift, which caused two real bugs this session.
- `/home/ubuntu/Prime_AI/Landingpage/index.html` — two-group chooser page.
- Plan file: none.
- Memory files touched: none.

## Running state
- Background processes: preview server **PID 305506** —
  `python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage`.
  Kill with `kill 305506`. Started detached via `setsid`, so it survives session end.
  **It is publicly reachable** — port 9876 is open in ufw.
- Dev servers / ports: http://srv1233720.hstgr.cloud:9876/receptionist.html
  (also `:9876/` for the index). Plain HTTP, no TLS.
- Open worktrees / branches: none. On `master`, **3 commits ahead of origin, unpushed**.

## Verification — how to confirm things still work
- `cd /home/ubuntu/Prime_AI/Landingpage && node test-roi.js` — expect
  `OK — 64 combinations checked`.
- `grep -c DEMO-NUMBER receptionist.html` — expect `5`; all must be swapped before publishing.
- `grep -rni chase . --exclude-dir=.git` — expect no output.
- `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9876/receptionist.html`
  — expect `200` while the preview server lives.
- `git status -sb` — expect `## master...origin/master [ahead 3]`.

## Deferred + open questions
- Deferred: variants B and C of the receptionist offer — build only if variant A converts.
- Deferred: wiring the demo line to a live AI agent; GDPR/DPA paperwork (the page
  answers it as a sales objection only).
- Deferred: form backend — submission is still client-side only, same as the original pages.
- Open: **how to push.** User was given two options and did not answer — (1) push the
  variant fixes only and hold `receptionist.html` on a branch until the demo line is
  live, or (2) push everything and accept dead demo buttons. Variants A/B/C are live
  right now showing the wrong founder name, which argues for pushing soon.
- Open: the real demo phone number.

## Pick up here
Get the demo number from the user or a push decision, then swap the 5 `DEMO-NUMBER`
placeholders and push — the live pages still show "Chase".
