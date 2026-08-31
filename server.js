import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static('.'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'meu-controle' });
});

app.listen(port, () => {
  console.log(`meu-controle listening on ${port}`);
});
