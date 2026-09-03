import express from 'express';
import { readFile } from 'node:fs/promises';
import { readStateRecord, writeState } from './db.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

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

    // Corrige em trânsito o typo legado que impedia o script inline de ser parseado.
    // A correção também fica protegida contra o cache do PWA, pois o HTML é no-store.
    const repaired = html.replace(
      "actions:[{label:'OK',style:'btn-ghost'}]);",
      "actions:[{label:'OK',style:'btn-ghost'}]});"
    );

    const injected = repaired.replace(
      '</head>',
      '<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png"><link rel="stylesheet" href="/theme.css?v=3"><link rel="stylesheet" href="/watermark.css?v=1"><script src="/api-sync.js"></script><script src="/opening.js?v=1"></script><script src="/watermark.js"></script><script src="/shortcut.js"></script></head>'
    );
    res.set('Cache-Control', 'no-store, max-age=0');
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
