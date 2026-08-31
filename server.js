import express from 'express';
import { readFile } from 'node:fs/promises';
import { readState, writeState } from './db.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

async function sendApp(req, res) {
  try {
    const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
    const injected = html.replace(
      '</head>',
      '<script src="/api-sync.js"></script></head>'
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
    await readState();
    res.json({ ok: true, service: 'meu-controle', database: true });
  } catch {
    res.status(503).json({ ok: false, service: 'meu-controle', database: false });
  }
});

app.get('/api/state', async (_req, res) => {
  try {
    res.json(await readState());
  } catch {
    res.status(503).json({ error: 'database_unavailable' });
  }
});

app.put('/api/state', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'invalid_state' });
    }
    await writeState(req.body);
    res.json({ ok: true });
  } catch {
    res.status(503).json({ error: 'database_unavailable' });
  }
});

app.listen(port, () => console.log(`meu-controle listening on ${port}`));
