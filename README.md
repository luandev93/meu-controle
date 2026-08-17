# Controle Pessoal — Dívidas & Escala

Pacote pronto para publicar de graça. Contém:
- `index.html` — o app
- `manifest.json` + `icon-192.png` + `icon-512.png` — permitem "Adicionar à tela de início" como app de verdade
- `sw.js` — deixa o app funcionando offline depois do primeiro acesso

**Importante:** os dados (dívidas e escala) ficam salvos no navegador do seu celular (`localStorage`), não em um banco de dados na nuvem. Ou seja: funcionam sempre que você acessar pelo mesmo navegador/aparelho, mas não sincronizam entre celular e computador, por exemplo. Isso é normal para hospedagem 100% estática e gratuita — só a *página* fica na nuvem, os dados ficam com você.

---

## Opção 1 — GitHub Pages (recomendado, gratuito para sempre)

1. Crie uma conta em github.com (se não tiver).
2. Crie um repositório novo (pode ser privado ou público), ex: `meu-controle`.
3. Faça upload dos 5 arquivos deste pacote para a raiz do repositório (botão "Add file" → "Upload files").
4. Vá em **Settings → Pages**.
5. Em "Source", selecione a branch `main` e a pasta `/root`, e salve.
6. Em ~1 minuto seu app estará em `https://SEUUSUARIO.github.io/meu-controle/`.
7. Abra esse link no celular → menu do navegador → **"Adicionar à tela de início"**.

## Opção 2 — Netlify Drop (mais rápido, sem criar repositório)

1. Acesse **app.netlify.com/drop**.
2. Arraste a pasta inteira (os 5 arquivos) para a área indicada.
3. Em segundos você recebe uma URL pública (ex: `nome-aleatorio.netlify.app`).
4. Crie uma conta gratuita para o link não expirar.

## Opção 3 — Vercel

1. Acesse **vercel.com**, crie conta gratuita.
2. "Add New Project" → "Deploy" → arraste a pasta ou conecte um repositório GitHub com esses arquivos.
3. Você recebe uma URL `seu-projeto.vercel.app`.

---

Qualquer uma das três é gratuita e suficiente para este app (é só HTML/CSS/JS estático, sem servidor).
