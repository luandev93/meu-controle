import express from 'express';
import { readFile } from 'node:fs/promises';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readStateRecord, writeState } from './db.js';

const app = express();
const port = process.env.PORT || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD || '';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

const AUTH_COOKIE = 'mc_auth';
const SESSION_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const PUBLIC_PATHS = new Set(['/login', '/icon-512.png', '/icon-192.png', '/favicon.png']);

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  });
  return out;
}

function expectedAuthToken() {
  return createHmac('sha256', APP_PASSWORD).update('meu-controle-session-v1').digest('hex');
}

function isAuthed(req) {
  if (!APP_PASSWORD) return true;
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[AUTH_COOKIE];
  if (!token) return false;
  const expected = expectedAuthToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

app.use((req, res, next) => {
  if (PUBLIC_PATHS.has(req.path) || isAuthed(req)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'unauthorized' });
  return res.redirect('/login');
});

app.get('/login', async (_req, res) => {
  try {
    const html = await readFile(new URL('./login.html', import.meta.url), 'utf8');
    res.type('html').send(html);
  } catch {
    res.status(500).send('Login unavailable');
  }
});

app.post('/login', (req, res) => {
  const submitted = typeof req.body?.password === 'string' ? req.body.password : '';
  const submittedBuf = Buffer.from(submitted);
  const expectedBuf = Buffer.from(APP_PASSWORD);
  const ok = APP_PASSWORD && submittedBuf.length === expectedBuf.length && timingSafeEqual(submittedBuf, expectedBuf);
  if (!ok) return res.redirect('/login?erro=1');
  res.cookie(AUTH_COOKIE, expectedAuthToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS
  });
  res.redirect('/');
});

app.get('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE);
  res.redirect('/login');
});

function safeDbError(error) {
  const code = typeof error?.code === 'string' ? error.code : null;
  const name = typeof error?.name === 'string' ? error.name : 'Error';
  let message = typeof error?.message === 'string' ? error.message : String(error || 'Unknown database error');
  message = message
    .replace(/postgres(?:ql)?:\/\/[^\s)]+/gi, 'postgres://***')
    .replace(/(password|passwd|pwd)=([^\s&;]+)/gi, '$1=***');
  return { name, code, message };
}

function noStore(res, updatedAt) {
  res.set('Cache-Control', 'no-store, max-age=0');
  if (updatedAt) res.set('X-State-Updated-At', new Date(updatedAt).toISOString());
}

async function sendApp(_req, res) {
  try {
    const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
    const injected = html.replace(
      '</head>',
      '<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png"><link rel="stylesheet" href="/theme.css?v=5"><script src="/api-sync.js"></script><script src="/opening.js?v=1"></script><script src="/watermark.js"></script><script src="/shortcut.js"></script></head>'
    );
    res.type('html').send(injected);
  } catch {
    res.status(500).send('Application unavailable');
  }
}

app.get('/', sendApp);
app.get('/index.html', sendApp);
app.use(express.static('.'));

app.get('/api/health', async (_req, res) => {
  try {
    const record = await readStateRecord();
    noStore(res, record.updated_at);
    res.json({ ok: true, service: 'meu-controle', database: true });
  } catch (error) {
    console.error('[db] health check failed', safeDbError(error));
    noStore(res);
    res.status(503).json({ ok: false, service: 'meu-controle', database: false, error: safeDbError(error) });
  }
});

app.get('/api/state', async (_req, res) => {
  try {
    const record = await readStateRecord();
    noStore(res, record.updated_at);
    res.json(record.data);
  } catch (error) {
    console.error('[db] state read failed', safeDbError(error));
    noStore(res);
    res.status(503).json({ error: 'database_unavailable', detail: safeDbError(error) });
  }
});

app.put('/api/state', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'invalid_state' });
    }
    const updatedAt = await writeState(req.body);
    noStore(res, updatedAt);
    res.json({ ok: true });
  } catch (error) {
    console.error('[db] state write failed', safeDbError(error));
    noStore(res);
    res.status(503).json({ error: 'database_unavailable', detail: safeDbError(error) });
  }
});

app.listen(port, () => console.log(`meu-controle listening on ${port}`));
