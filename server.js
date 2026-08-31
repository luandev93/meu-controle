import express from 'express';
import { readState, writeState } from './db.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
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
    await writeState(req.body);
    res.json({ ok: true });
  } catch {
    res.status(503).json({ error: 'database_unavailable' });
  }
});

app.listen(port, () => console.log(`meu-controle listening on ${port}`));
