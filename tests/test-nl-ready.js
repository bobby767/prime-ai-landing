// Deploy gate for nl.html. Run: node test-nl-ready.js
//
// THIS IS MEANT TO EXIT 1 RIGHT NOW. That is not a broken test, it is the
// point: nl.html is finished as a page and unfinished as a deployment, and
// the gap is the kind that goes live by accident because the page LOOKS done
// when you open it in a browser. Everything below is a thing that is invisible
// on localhost and load-bearing on a real domain.
//
// Why this is a separate file from test-palette.js: that one guards copy and
// palette quality across all three pages and is green, which is the signal Dan
// already relies on before deploying /es/ and /en/. Folding these blockers in
// would have made it red on every run and taught everyone to ignore it. Two
// signals, each one honest about a different question:
//   node test-palette.js   — is the copy allowed to say what it says?   (green)
//   node test-nl-ready.js  — can nl.html actually be deployed?          (red)
//
// Delete this file the day it goes green for good and nl.html is live.
const fs = require('fs');
const path = require('path');

const nl = fs.readFileSync(`${__dirname}/../nl.html`, 'utf8');
const blockers = [];
const cleared = [];
const check = (name, isBlocked, detail) =>
  (isBlocked ? blockers : cleared).push(isBlocked ? `${name}\n      ${detail}` : name);

// 1. THE DATA CONTROLLER. The one thing in nl.html written half-finished on
//    purpose. Dan said there would be a Dutch entity and that he would supply
//    the details; until they arrive, no name gets written, because the
//    controller's identity is a legal declaration and not a string to guess.
check(
  'Data controller named for the Dutch entity',
  nl.includes('TODO-BLOQUEANTE-NL'),
  'nl.html still carries the TODO-BLOQUEANTE-NL marker in <footer class="pie">. ' +
  'Supply the Dutch entity\'s legal name and registered address, write them into ' +
  'the notice, and delete the marker.'
);

// 2. THE ART. 13 ROUTE. In /es/ NO page shows who the controller is — the name,
//    address and email exist only at /voice/privacidad, served by the OTHER
//    repo (Voice_agent, PM2 prime-voice) behind server_name prime-ai.es. That
//    design is fine there because the route answers 200. prime-ai.nl does not
//    inherit it, so copying the link across leaves the page with NO layer where
//    the controller is named — not a worse layer, none at all.
//    test-palette.js cannot catch this: it can only see that the link exists,
//    never what is on the other side of it.
check(
  'Privacy notice reachable and in Dutch',
  nl.includes('/voice/privacidad'),
  'nl.html links to /voice/privacidad, which is served off prime-ai.es and 404s ' +
  'on a new domain. Either proxy it, or publish the Dutch entity\'s own notice ' +
  'and point at that. It also reads "(in het Spaans)" — a Spanish-language ' +
  'privacy notice was already the weak point on /es/; on a .nl domain it is not ' +
  'defensible.'
);

// 3. THE MAILTO. support@prime-ai.es delivers (it is on MAIL_OK), so the
//    address sweep in test-palette.js passes it — correctly, because that check
//    asks "does this mailbox receive mail?" and the answer is yes. The question
//    HERE is different: is it the right controller's mailbox? A verified
//    address belonging to the wrong legal entity passes one check and fails the
//    other, which is exactly why this is not folded into that sweep.
check(
  'Contact address belongs to the Dutch controller',
  /mailto:[^"']*@prime-ai\.es/.test(nl),
  'nl.html offers a @prime-ai.es address as the route to reach the controller ' +
  'and request deletion. If the Dutch entity is a separate legal person, that ' +
  'is the wrong mailbox. Whatever replaces it must be added to MAIL_OK in ' +
  'test-palette.js, and only after a real message has been delivered AND read.'
);

// 4. THE DEMO BACKEND. The single most likely thing to be missed, because
//    nothing in the HTML looks wrong. The page imports /voice/retell.js and
//    mints through POST /voice/token, SAME ORIGIN. On prime-ai.es that works
//    because of one nginx line: `location / { proxy_pass 127.0.0.1:3023 }`.
//    Without it the script 404s and the button does not degrade — there is no
//    call at all, which is the whole product.
// Read the configs with fs rather than shelling out to `cat *.conf`: no shell
// means no quoting to get wrong, and it is the same three lines.
let nginx = '';
const SITES = '/etc/nginx/sites-enabled';
try {
  for (const f of fs.readdirSync(SITES)) {
    try { nginx += fs.readFileSync(path.join(SITES, f), 'utf8'); } catch (e) { /* unreadable one */ }
  }
} catch (e) {
  // Not on the server, or no permission. Unknown is treated as blocked below:
  // a gate that passes because it could not look is worse than no gate.
}
check(
  'nginx serves prime-ai.nl with the /voice backend on the same origin',
  !/server_name[^;]*\bprime-ai\.nl\b/.test(nginx),
  'No server_name for prime-ai.nl found in /etc/nginx/sites-enabled/. The demo ' +
  'needs /voice/retell.js and POST /voice/token on the SAME origin as the page. ' +
  'Config to enable: docs/nl-deploy.md. (If this ran off-server it could not ' +
  'read nginx, and unknown counts as blocked on purpose.)'
);

// 5. NATIVE REVIEW. Not machine-checkable, and left blocking rather than
//    dropped: the 96 Dutch strings were written for db07bb0, were live on /es/
//    for about 31 minutes, and no native speaker has read them. On /es/ that
//    barely mattered — Dutch was an extra on a page that stood up in Spanish.
//    Here it is the entire page. Set this to the reviewer's name to clear it.
const DUTCH_REVIEWED_BY = null;
check(
  'Dutch copy reviewed by a native speaker',
  !DUTCH_REVIEWED_BY,
  'All 96 strings are unreviewed machine-written Dutch. Set DUTCH_REVIEWED_BY ' +
  'in this file once someone has actually read the page.'
);

for (const c of cleared) console.log(`  cleared  ${c}`);
if (!blockers.length) {
  console.log('\nOK — nl.html is deployable. Delete this file.');
  process.exit(0);
}
console.error(`\nNOT DEPLOYABLE — ${blockers.length} blocker(s):`);
blockers.forEach((b, i) => console.error(`  ${i + 1}. ${b}`));
console.error('\nnl.html is complete as a page. None of the above is a code defect.');
process.exit(1);
