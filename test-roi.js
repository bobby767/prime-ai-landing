// Checks the missed-call ROI model in receptionist.html.
// Run: node test-roi.js
//
// The radio `value` attributes double as lookup keys in calculateLoss AND as
// sentence fragments in the results copy. Editing a label without editing the
// matching key silently falls back to the default and quietly shows every
// visitor the same wrong number. That is what this guards.

const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync(__dirname + '/receptionist.html', 'utf8');

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
