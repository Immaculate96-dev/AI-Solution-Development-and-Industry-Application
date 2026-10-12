require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const dataFile = path.resolve(process.env.DATA_FILE || './data/patients.json');
const dataDir = path.dirname(dataFile);
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]', { mode: 0o600 });
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET must be at least 32 characters in production.');
  console.warn('WARNING: Set a long random SESSION_SECRET in your .env file.');
}
if (process.env.NODE_ENV === 'production' && !process.env.STAFF_PASSWORD_HASH) {
  throw new Error('Set STAFF_PASSWORD_HASH in your production environment.');
}

const DEPTS = [
  { code: 'EMG', name: 'Emergency Triage', room: 'Triage Room 1' },
  { code: 'GEN', name: 'General Consultation', room: 'Consulting Room 2' },
  { code: 'CHR', name: 'Chronic Care', room: 'Chronic Care Window' },
  { code: 'MCH', name: 'Maternal & Child Health', room: 'Room 4' },
  { code: 'MNT', name: 'Mental Health', room: 'Counselling Room' },
  { code: 'PHA', name: 'Pharmacy & Admin', room: 'Pharmacy Window' }
];
const RED = [
  [/chest\s*(pain|pressure|tight)|tightness in (the )?chest/i, 'Chest pain/pressure'],
  [/can'?t breathe|cannot breathe|difficulty breathing|shortness of breath|struggl\w* to breath/i, 'Breathing difficulty'],
  [/stroke|face droop|slurred speech|one side.*(weak|numb)/i, 'Possible stroke signs'],
  [/suicid|self[- ]harm|kill myself|end my life/i, 'Self-harm risk'],
  [/severe bleeding|bleeding heavily|won'?t stop bleeding/i, 'Severe bleeding'],
  [/unconscious|fainted|collaps|passed out/i, 'Loss of consciousness'],
  [/seizure|convuls/i, 'Seizure']
];
const rank = { routine: 0, soon: 1, urgent: 2 };
function readPatients() {
  try { const v = JSON.parse(fs.readFileSync(dataFile, 'utf8')); return Array.isArray(v) ? v : []; }
  catch (e) { console.error('Could not read patient data:', e.message); return []; }
}
function writePatients(patients) {
  const temp = `${dataFile}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(patients, null, 2), { mode: 0o600 });
  fs.renameSync(temp, dataFile);
}
function nextTicket(patients, code) {
  const nums = patients.filter(p => p.ticket && p.ticket.startsWith(`${code}-`)).map(p => Number(p.ticket.split('-')[1]) || 0);
  return `${code}-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
}
function triage(p) {
  const text = `${p.reason} ${p.duration || ''}`;
  const flags = RED.filter(([re]) => re.test(text)).map(([, label]) => label);
  let dept = 'GEN';
  if (flags.includes('Self-harm risk')) dept = 'MNT';
  else if (flags.length) dept = 'EMG';
  else if (/pregnan|antenatal|baby|infant|child|immunis|vaccin/i.test(text)) dept = 'MCH';
  else if (/anxiety|depress|stress|panic|low mood|can'?t sleep/i.test(text)) dept = 'MNT';
  else if (/diabet|sugar|hypertens|blood pressure|asthma|hiv|arv|chronic|repeat/i.test(text)) dept = 'CHR';
  else if (/refill|prescription|script|collect|sick note|certificate|referral|form/i.test(text)) dept = 'PHA';
  const pr = flags.length ? 'urgent' : 'soon';
  const summary = `${p.age ? `${p.age}-year-old` : 'Patient'} presenting with: ${p.reason}. Duration: ${p.duration || 'not stated'}.`;
  return { pr, reason: flags.length ? 'Safety rule: a red-flag keyword was detected. Staff must assess immediately.' : 'Automated rules cannot determine clinical urgency; staff review required.', summary, symptoms: [], meds: p.meds ? [p.meds] : [], alg: p.allergies ? [p.allergies] : [], dur: p.duration || '', rf: flags, dept };
}
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use(session({
  name: 'smartintake.sid',
  secret: process.env.SESSION_SECRET || 'local-development-only-change-this-secret-now',
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: dataDir }),
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 2 * 60 * 60 * 1000 }
}));
app.use('/api/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }));
const requireStaff = (req, res, next) => req.session && req.session.staff ? next() : res.status(401).json({ error: 'Staff login required.' });

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'smart-patient-intake' }));
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  const expectedUser = process.env.STAFF_USERNAME || 'clinical.admin';
  const hash = process.env.STAFF_PASSWORD_HASH;
  let valid = false;
  if (hash) { try { valid = await bcrypt.compare(String(password || ''), hash); } catch (_) {} }
  else if (process.env.NODE_ENV !== 'production') valid = username === expectedUser && password === 'administrator';
  if (username !== expectedUser || !valid) return res.status(401).json({ error: 'Incorrect username or password.' });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Could not start staff session.' });
    req.session.staff = true;
    req.session.save(err2 => err2 ? res.status(500).json({ error: 'Could not save staff session.' }) : res.json({ ok: true }));
  });
});
app.post('/api/logout', (req, res) => req.session.destroy(() => { res.clearCookie('smartintake.sid'); res.json({ ok: true }); }));
app.get('/api/session', (req, res) => res.json({ authenticated: Boolean(req.session && req.session.staff) }));
app.get('/api/patients', requireStaff, (_req, res) => res.json(readPatients()));
app.post('/api/patients', (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 100);
  const reason = String(body.reason || '').trim().slice(0, 2000);
  const age = body.age === '' || body.age == null ? '' : Number(body.age);
  if (!name || !reason) return res.status(400).json({ error: 'Please provide a name and reason for the visit.' });
  if (age !== '' && (!Number.isInteger(age) || age < 0 || age > 120)) return res.status(400).json({ error: 'Age must be a whole number between 0 and 120.' });
  const p = { name, age: age === '' ? '' : String(age), reason, duration: String(body.duration || '').trim().slice(0, 200), meds: String(body.meds || '').trim().slice(0, 500), allergies: String(body.allergies || '').trim().slice(0, 500) };
  const patients = readPatients();
  const result = { id: require('crypto').randomUUID(), ...p, ...triage(p), time: new Date().toISOString(), status: 'waiting' };
  result.ticket = nextTicket(patients, result.dept);
  patients.push(result); writePatients(patients);
  res.status(201).json({ ticket: result.ticket, dept: result.dept, department: DEPTS.find(d => d.code === result.dept), pr: result.pr, ahead: patients.filter(q => q.id !== result.id && q.dept === result.dept && q.status === 'waiting' && (rank[q.pr] > rank[result.pr] || (rank[q.pr] === rank[result.pr] && q.time < result.time))).length });
});
app.patch('/api/patients/:id', requireStaff, (req, res) => {
  const patients = readPatients(); const p = patients.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Ticket not found.' });
  const { status, dept, summary } = req.body || {};
  if (status !== undefined && !['waiting', 'serving', 'done'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  if (dept !== undefined && !DEPTS.some(d => d.code === dept)) return res.status(400).json({ error: 'Invalid department.' });
  if (status !== undefined) p.status = status;
  if (dept !== undefined) { p.dept = dept; p.ticket = nextTicket(patients.filter(x => x.id !== p.id), dept); }
  if (summary !== undefined) p.summary = String(summary).slice(0, 3000);
  writePatients(patients); res.json(p);
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`Smart Patient Intake running at http://localhost:${PORT}`));
