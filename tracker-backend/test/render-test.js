/* Renders every view against several progress scenarios and checks the derived
   stats, using a minimal DOM stub. Run with:  node test/render-test.js        */

const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const PUB = path.join(__dirname, '..', 'public');

const el = () => new Proxy({}, {
  get: (t, k) => {
    if (k === 'classList') return { toggle(){}, add(){}, remove(){}, contains(){ return false; } };
    if (['setAttribute', 'click', 'closest', 'matches', 'focus', 'addEventListener', 'removeEventListener'].includes(k)) return () => el();
    if (k === 'dataset' || k === 'style') return {};
    return '';
  },
  set: () => true,
});

const ctx = {
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  Math, JSON, Object, Array, String, Number, Boolean, Proxy, Error, Date,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  addEventListener() {}, removeEventListener() {},
  fetch: async () => ({ ok: true, json: async () => ({}), blob: async () => ({}) }),
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  document: {
    querySelector: () => el(),
    querySelectorAll: () => [],
    documentElement: { dataset: {} },
    addEventListener() {},
    createElement: () => el(),
  },
};
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);

for (const file of ['curriculum.js', 'app.js']) {
  vm.runInContext(fs.readFileSync(path.join(PUB, file), 'utf8'), ctx, { filename: file });
}

const STORE = vm.runInContext('store', ctx);
const TASKS = vm.runInContext('TASKS', ctx);
const VIEWS = vm.runInContext('VIEWS', ctx);
const STATS = vm.runInContext('stats', ctx);
const NEXT = vm.runInContext('nextDay', ctx);

const allTasks = () => Object.fromEntries(TASKS.map((t) => [t.key, true]));

STORE.user = { name: 'Manish', email: 'a@b.com' };

const mixed = {
  1: { day: 1, completed: true, lessonRead: true, tasks: allTasks(), minutes: 95, confidence: 4,
       reflection: { q1: 'the staging area finally clicked', q3: 'reviewing diffs before committing' } },
  2: { day: 2, completed: false, lessonRead: true, tasks: { concept: true, walkthrough: true }, minutes: 40, confidence: 2, reflection: {} },
  5: { day: 5, completed: false, tasks: { concept: true }, minutes: 12, confidence: null,
       reflection: { q2: 'fast-forward vs three-way merge' } },
};

const scenarios = {
  mixed,
  empty: {},
  complete: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i + 1,
    { day: i + 1, completed: true, lessonRead: true, tasks: allTasks(), minutes: 90, confidence: 5, reflection: { q1: 'notes' } }])),
};

let fail = 0;

console.log('\nrendering views');
for (const [label, acts] of Object.entries(scenarios)) {
  STORE.activities = acts;
  for (const view of Object.keys(VIEWS)) {
    STORE.view = view;
    STORE.openDay = view === 'today' ? 2 : null;
    try {
      const html = VIEWS[view]();
      if (typeof html !== 'string' || html.length < 200) throw new Error(`output too short (${html && html.length})`);
      const leak = html.match(/.{0,40}(undefined|NaN|\[object Object)[\s\S]{0,40}/);
      if (leak) throw new Error(`leaked value: ...${leak[0].replace(/\s+/g, ' ')}...`);
      console.log(`  ok    ${view.padEnd(10)} ${label.padEnd(9)} ${String(html.length).padStart(6)} chars`);
    } catch (e) {
      fail++;
      console.log(`  FAIL  ${view.padEnd(10)} ${label.padEnd(9)} ${e.message}`);
    }
  }
}

const assert = (name, got, want) => {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}: ${got}${ok ? '' : ` (expected ${want})`}`);
};

console.log('\nderived stats');
STORE.activities = mixed;
const s = STATS();
assert('days complete', s.done, 1);
assert('total minutes', s.minutes, 147);
assert('journal entries', s.journal, 2);
assert('in progress', s.inProgress, 2);
assert('avg minutes', s.avgMin, 147);
assert('next unfinished day', NEXT(), 2);
assert('phase 1 complete', s.byPhase[1], 1);

STORE.activities = scenarios.complete;
const c = STATS();
assert('all done — percent', c.pct, 100);
assert('all done — best streak', c.best, 30);
assert('all done — next day', NEXT(), 30);

STORE.activities = {};
const e = STATS();
assert('empty — percent', e.pct, 0);
assert('empty — next day', NEXT(), 1);
assert('empty — avg confidence', e.avgConf, null);

console.log(fail ? `\n${fail} failure(s)\n` : '\nall checks passed\n');
process.exit(fail ? 1 : 0);
