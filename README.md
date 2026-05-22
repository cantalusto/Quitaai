# Quita aí — Controle. Cobre. Receba.

App de controle de fiado, crediário e empréstimos para açougues, padarias e comércios populares. Cadastra clientes/produtos, faz vendas, marca prazo, calcula juros, e envia cobranças no WhatsApp.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** + **Tailwind v4**
- **shadcn-like UI** custom (sem dependência pesada)
- **next-themes** (dark/light)
- **Sonner** (toasts)
- **localStorage** como persistência (data layer trocável por Supabase)
- **PWA** instalável

## Rodando localmente

```bash
npm install
npm run dev
```

Acessa em http://localhost:3000

> Os dados ficam no `localStorage` do navegador. Vem com um seed (Tete Nazaré, João da Esquina e 5 produtos) na primeira vez que abre.

## Build de produção

```bash
npm run build
npm run start
```

## Deploy na Vercel

1. Sobe esse repositório no GitHub
2. Vai em https://vercel.com/new
3. Importa o repo
4. Vercel detecta Next.js automaticamente — **não precisa configurar env vars** (a versão atual usa localStorage)
5. Clica **Deploy**

Pronto. Em ~1 min o app tá no ar com domínio `*.vercel.app`.

### Variáveis de ambiente (futuro)

Quando migrar pra Supabase/Postgres, adicionar:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Estrutura

```
src/
  app/
    page.tsx              → Início (cobranças do dia)
    painel/page.tsx       → Painel (insights/analytics)
    clientes/             → CRUD + conta do cliente
    produtos/             → CRUD
    vendas/nova/          → PDV (3 modalidades)
    emprestimos/novo/     → Empréstimo em dinheiro
  components/
    ui/                   → primitivos (Button, Card, Dialog…)
    app-shell.tsx         → layout responsivo (sidebar PC / bottom nav mobile)
    notifications-drawer.tsx → painel de notificações (Portal)
    logo.tsx              → logo SVG
  lib/
    store.tsx             → camada de dados (localStorage + helpers)
    types.ts              → tipos
    utils.ts              → helpers (formatBRL, datas, cn…)
```

## Identidade

- Nome: **Quita aí** — trocadilho com "quita.ai" (paga aí, acerta aí)
- Tagline: **Controle · Cobre · Receba**
- Paleta: grafite azulado + dourado
- Tipografia: Inter + JetBrains Mono (valores)
