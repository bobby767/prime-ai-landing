// Checks the missed-call ROI model in receptionist.html.
// Run: node test-roi.js
//
// The radio `value` attributes double as lookup keys in calculateLoss AND as
// sentence fragments in the results copy. Editing a label without editing the
// matching key silently falls back to the default and quietly shows every
// visitor the same wrong number. That is what this guards.

const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync(__dirname + '/../receptionist.html', 'utf8');

// new Function() on file contents is deliberate here: the input is our own
// committed HTML, read by a dev running this locally. Parsing the maps out
// instead would mean reimplementing the model in the test, which would then
// pass even when the real function is broken — the opposite of the point.
const start = html.indexOf('function calculateLoss');
const end = html.indexOf('\n      }', start) + '\n      }'.length;
assert(start > 0, 'calculateLoss not found — did the function get renamed?');
const calculateLoss = new Function(html.slice(start, end) + '; return calculateLoss;')();

// --- every radio value in the markup must resolve to a real key ---
const valuesFor = name =>
  [...html.matchAll(new RegExp(`name="${name}" value="([^"]+)"`, 'g'))].map(m => m[1]);

const calls = valuesFor('calls');
const unanswered = valuesFor('unanswered');
const jobvalues = valuesFor('jobvalue');
assert.strictEqual(calls.length, 4, 'expected 4 call-volume options');
assert.strictEqual(unanswered.length, 4, 'expected 4 unanswered options');
assert.strictEqual(jobvalues.length, 4, 'expected 4 job-value options');

const fallback = calculateLoss('nope', 'nope', 'nope');
for (const c of calls) {
  for (const u of unanswered) {
    for (const j of jobvalues) {
      const r = calculateLoss(c, u, j);
      assert(Number.isFinite(r.lostRevenue), `NaN for ${c}/${u}/${j}`);
      assert(r.missedNewCustomers <= r.missedCalls,
        `new customers exceed missed calls for ${c}/${u}/${j}`);
      // Believability ceiling: without NEW_CUSTOMER_SHARE this hit 108k/month,
      // which reads as a lie to any owner who knows their own books.
      assert(r.lostRevenue < 200000, `implausible €${r.lostRevenue} for ${c}/${u}/${j}`);
    }
  }
}

// Each option must actually change the result, i.e. none silently hit the default.
const base = calculateLoss(calls[0], unanswered[0], jobvalues[0]);
assert(calls.every(c => c === calls[0] ||
  calculateLoss(c, unanswered[0], jobvalues[0]).missedCalls !== base.missedCalls),
  'a call-volume option does not affect the result — key mismatch with callCounts');
assert(unanswered.every(u => u === unanswered[0] ||
  calculateLoss(calls[0], u, jobvalues[0]).missedCalls !== base.missedCalls),
  'an unanswered option does not affect the result — key mismatch with missRates');
assert(jobvalues.every(j => j === jobvalues[0] ||
  calculateLoss(calls[0], unanswered[0], j).lostRevenue !== base.lostRevenue),
  'a job-value option does not affect the result — key mismatch with jobValues');

// The unanswered values are dropped into "where the phone ___," so they must
// stay lowercase sentence fragments.
for (const u of unanswered) {
  assert.strictEqual(u, u.toLowerCase(), `"${u}" must be lowercase to read correctly in the results copy`);
}

console.log(`OK — ${calls.length * unanswered.length * jobvalues.length} combinations checked`);
console.log(`  headline scenario: ${JSON.stringify(calculateLoss('150-300', 'goes to voicemail', '1500-5000'))}`);
console.log(`  unknown input falls back to: ${JSON.stringify(fallback)}`);

// ---------------------------------------------------------------------
// es.html — the missed-call sum on the Spanish/English trades page.
//
// A different model from the one above on purpose, and NOT a simplification
// of it. The trades page's visitor presses a button and is talking to
// sales-agent.ts moments later, and that agent is instructed to do this exact
// sum OUT LOUD from the prospect's own figures (PITCH_STATE):
//
//     missed calls a day × 20 working days, then roughly A THIRD of those,
//     at the price of the CHEAPEST thing a customer books.
//
// So the page's job is to agree with the call, not to be a better estimator.
// If these ever diverge, the prospect hears two different numbers built from
// the same two answers, which is worse than showing no number at all.
// ---------------------------------------------------------------------
const esHtml = fs.readFileSync(__dirname + '/../es.html', 'utf8');

// Same new Function() reasoning as the top of this file, and the same limits:
// the only thing interpolated is a slice of our own committed es.html, read by
// a dev running this locally. Nothing here reads user input, and this file
// never ships to a browser. Reimplementing the sum in the test instead would
// make it pass while the real one is broken, which is the failure this exists
// to catch.
const esStart = esHtml.indexOf('function loQueSeEscapa');
assert(esStart > 0, 'loQueSeEscapa not found in es.html — did the function get renamed?');
const esEnd = esHtml.indexOf('\n      }', esStart) + '\n      }'.length;
// The constants live outside the function, so they are pulled in with it.
const loQueSeEscapa = new Function(
  'var DIAS_LABORABLES = 20, PROPORCION_QUE_RESERVA = 1 / 3;' +
  esHtml.slice(esStart, esEnd) + '; return loQueSeEscapa;'
)();

// The constants in the page must be the agent's, not the test's. Reading them
// from the file rather than trusting the shim above is the point: otherwise
// this passes while the page quietly uses 30 days and half.
assert(/var DIAS_LABORABLES = 20;/.test(esHtml),
  'es.html no longer uses a 20-day working month — the agent says 20 out loud');
assert(/var PROPORCION_QUE_RESERVA = 1 \/ 3;/.test(esHtml),
  'es.html no longer takes a third — the agent announces a third as its own rough guess');

const esCalls = [...esHtml.matchAll(/name="llamadas" id="[^"]+" value="(\d+)"/g)].map(m => Number(m[1]));
const esPrices = [...esHtml.matchAll(/name="precio" id="[^"]+" value="(\d+)"/g)].map(m => Number(m[1]));
assert.strictEqual(esCalls.length, 4, 'expected 4 missed-call options on es.html');
assert.strictEqual(esPrices.length, 4, 'expected 4 cheapest-job options on es.html');

// The worked example the agent would give: 3 a day is 60 a month, a third of
// those is 20, at the cheapest thing being EUR 150 is EUR 3,000.
const worked = loQueSeEscapa(3, 150);
assert.strictEqual(worked.perdidasAlMes, 60, 'a 3-a-day miss rate must come to 60 a month');
assert.strictEqual(worked.euros, 3000, 'the worked example must agree with the agent: 60 -> a third -> x150');

for (const c of esCalls) {
  for (const p of esPrices) {
    const r = loQueSeEscapa(c, p);
    assert(Number.isFinite(r.euros), `NaN for ${c} calls at EUR ${p}`);
    assert.strictEqual(r.perdidasAlMes, c * 20, `month is not 20 working days for ${c}`);
    // Rounding may only ever shrink the number. The agent's rule is that a
    // guess it is allowed to make may only make the figure SMALLER, never
    // bigger, because the conservative version is the one that survives the
    // prospect checking it.
    assert(r.euros <= c * 20 * (1 / 3) * p,
      `rounding inflated the figure for ${c} calls at EUR ${p} — it may only round down`);
    assert.strictEqual(r.euros % 50, 0, `EUR ${r.euros} is not rounded to the nearest 50`);
  }
}

// Every option must move the number, i.e. no option is inert.
assert(new Set(esCalls.map(c => loQueSeEscapa(c, esPrices[0]).euros)).size === esCalls.length,
  'two missed-call options produce the same figure — one of them does nothing');
assert(new Set(esPrices.map(p => loQueSeEscapa(esCalls[3], p).euros)).size === esPrices.length,
  'two cheapest-job options produce the same figure — one of them does nothing');

console.log(`OK — es.html sum: ${esCalls.length * esPrices.length} combinations, agrees with sales-agent.ts`);
console.log(`  worked example (3 a day, cheapest EUR 150): ${JSON.stringify(worked)}`);
console.log(`  top of range (10 a day, cheapest EUR 900):  ${JSON.stringify(loQueSeEscapa(10, 900))}`);
