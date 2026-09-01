# meu-controle

App pessoal para controlar **dívidas/contas** e **escala de trabalho** (HMSM · Noite e HMMV · Dia), com preenchimento automático de escala e persistência real na nuvem.

**App oficial (use este link):**
👉 https://meu-controle-api.onrender.com/

---

## Arquitetura

Um único serviço Node.js/Express serve **tudo**: a interface (HTML) e a API. Não há front-end e back-end separados.

```text
Navegador (PWA)
      │
      ▼
meu-controle-api (Render · Node/Express)
      │  server.js  → serve index.html + rotas /api/*
      │  api-sync.js → intercepta localStorage e sincroniza com a API
      │  db.js       → lê/escreve o estado no Postgres
      ▼
Neon PostgreSQL
      └── tabela public.app_state (estado inteiro do app em JSONB)
```

### Por que só uma tabela?

O app inteiro (dívidas, escala, configuração de preenchimento automático) é salvo como um único registro JSONB em `public.app_state`. Isso é proposital: simplifica backup, sincronização e evolução do formato, sem normalizar prematuramente um app pessoal de escopo pequeno.

---

## Arquivos principais

| Arquivo | Função |
|---|---|
| `index.html` | Interface do app (dívidas + escala) |
| `server.js` | Servidor Express — serve o HTML e as rotas de API |
| `db.js` | Conexão com o Neon e leitura/escrita do estado |
| `api-sync.js` | Faz o `index.html` (que só sabe usar `localStorage`) conversar com a API, sem precisar alterar a interface |
| `watermark.js` | Marca d'água do mascote no canto da tela |
| `manifest.json` + `icon-192.png` + `icon-512.png` | Configuração de PWA (instalar na tela de início) |
| `sw.js` | Service worker para funcionamento offline do "casco" do app |
| `schema.sql` | Definição da tabela `app_state` (o próprio app também cria a tabela sozinho, se não existir) |

---

## Rodando localmente

```bash
npm install
DATABASE_URL="postgresql://usuario:senha@host/neondb?sslmode=require" npm start
```

O servidor sobe em `http://localhost:3000`.

---

## Variáveis de ambiente

| Variável | Onde configurar | Observação |
|---|---|---|
| `DATABASE_URL` | Render → serviço `meu-controle-api` → Environment | Connection string do Neon, **sem aspas**, sem o prefixo `DATABASE_URL=`. Nunca deve existir no front-end nem em nenhum arquivo do repositório. |

---

## Endpoints da API

| Rota | Método | Descrição |
|---|---|---|
| `/api/health` | GET | Verifica se o servidor está de pé e conectado ao Neon (`{"ok":true,"database":true}`) |
| `/api/state` | GET | Retorna o estado salvo (dívidas, escala, configuração) |
| `/api/state` | PUT | Substitui o estado salvo pelo enviado no corpo da requisição |

---

## Deploy (Render)

Um único Web Service, chamado **`meu-controle-api`**:
- **Build command:** `npm install`
- **Start command:** `npm start` (roda `node server.js`)
- **Environment:** `DATABASE_URL` configurada (ver acima)

> ⚠️ Não é necessário nenhum outro serviço além deste. Um segundo serviço chamado apenas `meu-controle` (sem `-api`) foi criado por engano durante o desenvolvimento e não tem função — deve ser removido caso ainda exista.

---

## Versão legada (descontinuada)

Existiu uma versão anterior hospedada em **GitHub Pages** (`luandev93.github.io/meu-controle/`), que salvava os dados só no `localStorage` do navegador (sem nuvem). Essa versão está **descontinuada** — os dados dela não sincronizam com o app atual. Use sempre o link do Render acima.

---

## Segurança

- `DATABASE_URL` só existe como variável de ambiente no Render (back-end). Nunca deve ser commitada no repositório nem exposta no front-end.
- Se uma credencial vazar (ex: aparecer em log ou print), rotacione a senha no Neon imediatamente e atualize a variável no Render.

---

## Identidade visual

Mascote: uma "marmota do Go com dinheiro", usada como marca d'água discreta (`watermark.js`) sem alterar o layout original do app.
