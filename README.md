# Pobb URL Fetcher (Next.js + Vercel)

Projeto simples com:

- Uma tela unica com campo para URL `pobb.in`
- Um endpoint backend em `app/api/pobb/route.ts`
- Sem login e sem banco de dados

## Rodar local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Como funciona

1. Voce informa uma URL, por exemplo: `https://pobb.in/3J6Dm6pkA6-5`
2. O frontend envia para `POST /api/pobb`
3. O backend valida se o host e `pobb.in`
4. O backend faz o `fetch` e devolve:
   - status HTTP
   - URL final
   - content-type
   - corpo da resposta

## Deploy no Vercel

1. Suba o projeto para o GitHub
2. Importe o repositorio no Vercel
3. Deploy (nao ha variaveis obrigatorias)
