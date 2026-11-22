// The Hacienda's live feed: Krafted Lab's bots check in to the Hacienda hub's database (agents/<id>: status, task,
// updatedAt, log), and each one is a person in the office. No made-up work: what you see is what the bots reported.
//
//   working  → at work: Vee hands over the task, they go to their station
//   waiting  → needs Vee (the drafts and decisions waiting for approval)
//   blocked  → waiting, marked stuck, with what blocks them
//   done     → reports back to Vee, then rests
//   idle     → resting
//
// The page reads the database through the artifact runtime (`claude.use("db")`), so it is live only at its claude.ai
// link. Opened anywhere else (a local build, GitHub Pages) it shows the team at rest and says so.
import { state } from '../core/state.js';
import { $ } from '../core/env.js';
import { sessions } from '../people/workers.js';
import { setConn, upsertSession } from '../net/live.js';
import { onEvent } from '../life/incidents.js';
import { queueUi, renderFeed, toast } from '../ui/activity.js';
import { logLine } from '../demo/demo-log.js';
import { labOf } from './crew.js';

// where each bot's work takes them (life/incidents.js ACT): research in the library, numbers and SOPs at the desk,
// builds in the server room
const WORK_AT = { scoutie: 'web', proofie: 'web', storie: 'read', loidie: 'read', bez: 'read', sopie: 'write', teachie: 'read', kraftie: 'bash', replie: 'bash' };
const workType = (id) => WORK_AT[id] || 'edit';

const ROSTER = [   // (before the database answers, or with none: everyone at their desk)
  ['bez', 'Bez', 'founder'], ['loidie', 'Loidie', 'founder'], ['scoutie', 'Scoutie', 'money'], ['pitchie', 'Pitchie', 'money'],
  ['proofie', 'Proofie', 'money'], ['brandie', 'Brandie', 'brand'], ['storie', 'Storie', 'brand'], ['kraftie', 'Kraftie', 'flow'],
  ['replie', 'Replie', 'flow'], ['sopie', 'Sopie', 'flow'], ['contentie', 'Contentie', 'content'], ['selfie', 'Selfie', 'content'],
  ['tubie', 'Tubie', 'content'], ['teachie', 'Teachie', 'learn'], ['nextie', 'Nextie', 'learn'], ['talkie', 'Talkie', 'learn'],
];
const STATUS = { working: 'work', waiting: 'wait', blocked: 'wait', done: 'rest', idle: 'rest' };
const norm = (st) => (STATUS[st] ? st : 'idle');
const tsOf = (v) => { const t = typeof v === 'number' ? v : Date.parse(v); return Number.isFinite(t) ? t : 0; };
const clean = (v, n = 220) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

let seq = 0, LOG;
const known = new Map();   // bot id -> { status, task, updatedAt } last applied

function sessionOf(a, prev) {
  const st = norm(a.status), task = clean(a.task);
  const lab = labOf(a.dept);
  return {
    id: `bot-${a.id}`, pid: 0, name: clean(a.name, 40) || a.id, dir: `~/hacienda/${lab}`, git: { repo: lab }, link: null,
    desk: prev?.desk ?? -1, status: STATUS[st], lastPrompt: st === 'idle' ? '' : task, taskStart: st === 'working' ? tsOf(a.updatedAt) || Date.now() : 0,
    counts: prev?.counts || { read: 0, edit: 0, cmd: 0, web: 0 }, subs: [], doneSubs: [], todos: [],
    last: task ? { type: st === 'working' ? workType(a.id) : st === 'done' ? 'stop' : 'wait', label: task } : null,
    lastAt: tsOf(a.updatedAt) || prev?.lastAt || 0,
    stuck: st === 'blocked' ? { kind: 'blocked', label: task || 'Blocked', n: 1 } : null,
    role: clean(a.role, 80), lab, bot: a.id,
  };
}
function emit(s, type, label, extra = {}) {
  const e = { id: ++seq, ts: Date.now(), sess: s.id, name: s.name, type, label, ...extra };
  onEvent(e);
}
// the conversation in a bot's drawer: its log, oldest first
function fillLog(s, a) {
  const log = (Array.isArray(a.log) ? a.log : []).slice().sort((x, y) => tsOf(x.ts) - tsOf(y.ts)).slice(-40);
  LOG.set(s.id, []);
  for (const l of log) {
    const st = norm(l.status), text = clean(l.msg, 400);
    if (!text) continue;
    logLine(LOG, s.id, st === 'working' ? { role: 'user', text, ts: tsOf(l.ts) } : { role: 'claude', text: `${{ waiting: '⏳ Needs you: ', blocked: '⛔ Blocked: ', done: '✅ ' }[st] || ''}${text}`, ts: tsOf(l.ts) });
  }
}
// the activity feed at the start: every bot's recent log lines, newest last
function seedFeed(list) {
  const items = [];
  for (const a of list) for (const l of Array.isArray(a.log) ? a.log : []) {
    const st = norm(l.status), msg = clean(l.msg);
    if (!msg) continue;
    items.push({ id: ++seq, ts: tsOf(l.ts), sess: `bot-${a.id}`, name: clean(a.name, 40) || a.id, label: msg,
      type: { working: 'prompt', waiting: 'wait', blocked: 'fail', done: 'stop' }[st] || 'stop' });
  }
  state.feed = items.sort((x, y) => x.ts - y.ts).slice(-150);
  renderFeed();
}
// one bot's change since the last snapshot: the events that move its person
function changed(a, first) {
  const prev = known.get(a.id), st = norm(a.status), task = clean(a.task), at = tsOf(a.updatedAt);
  const sPrev = sessions.get(`bot-${a.id}`), s = sessionOf(a, sPrev);
  known.set(a.id, { st, task, at });
  upsertSession(s, !first);
  fillLog(s, a);
  if (first || (prev && prev.st === st && prev.task === task && prev.at === at)) {
    if (first && st === 'working') emit(s, workType(a.id), task, { quiet: true });   // (already at work: to their station)
    return;
  }
  if (st === 'working') {
    emit(s, 'prompt', task || 'New task');
    setTimeout(() => { const now = sessions.get(s.id); if (now?.status === 'work') emit(now, workType(a.id), task, { quiet: true }); }, 2500);
  } else if (st === 'waiting') emit(s, 'wait', task || 'Waiting for you');
  else if (st === 'blocked') emit(s, 'wait', task ? `Blocked: ${task}` : 'Blocked');
  else if (st === 'done') emit(s, 'stop', task || 'Done');
  else if (prev && prev.st !== 'idle') emit(s, 'stop', task || 'Back at the desk', { quiet: true });
}

function roster(note) {
  for (const [id, name, dept] of ROSTER) {
    const s = sessionOf({ id, name, dept, status: 'idle' }, sessions.get(`bot-${id}`));
    upsertSession(s, false);
  }
  state.connectedOnce = true; queueUi();
  if (note) toast(note, 9000);
}

export async function startHacienda(log) {
  LOG = log;
  state.stats = { prompts: 0, read: 0, edit: 0, cmd: 0, deploy: 0 };
  state.todos = [];
  const chip = $('demo-chip'); if (chip) chip.hidden = true;
  roster();
  let db = null;
  try { db = window.claude?.use ? await window.claude.use('db') : null; } catch { db = null; }
  if (!db) { setConn(false); roster('Showing the team at rest: open the Hacienda from its claude.ai link to see live check-ins.'); return; }
  let first = true;
  const timer = setTimeout(() => { setConn(false); toast("Can't reach the bots' check-ins yet. What you see may be out of date.", 8000); }, 10000);
  db.collection('agents').onSnapshot((snap) => {
    const list = snap.docs.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }));
    if (!snap.metadata?.fromCache) { clearTimeout(timer); setConn(true); }
    // bots that left the database leave the office
    for (const id of [...known.keys()]) if (!list.some((a) => a.id === id)) known.delete(id);
    for (const a of list) changed(a, first);
    if (first) seedFeed(list);
    first = false; state.connectedOnce = true; queueUi();
  }, (err) => {
    clearTimeout(timer); setConn(false);
    toast(err?.code === 'revoked' ? 'Live updates stopped for this view.' : 'Live updates stopped. Reload the page to reconnect.', 9000);
  });
}
