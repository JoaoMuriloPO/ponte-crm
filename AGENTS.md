# AGENTS.md — Ponte CRM

## Visão Geral
CRM financeiro para controle de vendas de "pontes" (vendedores). Mostra distribuição de receita entre Empresa (60%), Ferramentas (10%), Ponte e Proprietário. **Este projeto deve reutilizar padrões do kpsi-app.**

## Repo
- **URL:** https://github.com/JoaoMuriloPO/ponte-crm.git
- **Branch ativa:** `feat/github-auth-gist-storage`
- **Branch principal:** `main`

## Stack
- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Recharts (gráficos)
- react-hook-form + Zod (formulários)
- @octokit/rest (GitHub API)
- react-router-dom v7 (rotas)
- Vercel (deploy)

## Comandos Importantes
- `npm run dev` — iniciar dev server
- `npm run build` — build de produção
- `npm run lint` — ESLint

## Arquitetura Atual

### Storage (MANUAL — precisa migrar para auto-sync)
- **Local:** localStorage via `localStorageService.ts`
- **Nuvem:** GitHub Gist via OAuth (botões manuais Save/Load)
- **Sync:** MANUAL — usuário clica "Salvar na nuvem" / "Carregar da nuvem"

### Auth
- OAuth Flow (não Device Flow)
- Client ID em `VITE_GITHUB_CLIENT_ID`
- Endpoint proxy: `/api/auth/github`
- Gist privado criado automaticamente no primeiro login

### Tipos Principais
```ts
interface Vendedor {
  id: string; nome: string; createdAt: string;
  ferramentasEnabled: boolean;
  percentualVendedor: number;
  percentualProprietario: number;
}

interface Venda {
  id: string; vendedorId: string; valor: number;
  data: string; descricao?: string;
  distribuicao: { empresa: number; ferramentas: number; vendedor: number; proprietario: number };
}

interface Configuracoes { nomeProprietario: string }
```

### Constantes
- `EMPRESA_PERCENTUAL = 60`
- `FERRAMENTAS_PERCENTUAL = 10`

## Arquivos Principais
| Arquivo | Função |
|---------|--------|
| `src/types/index.ts` | Todos os tipos |
| `src/contexts/AuthContext.tsx` | Auth + sync manual (precisa migrar) |
| `src/services/github/githubService.ts` | Octokit + Gist CRUD |
| `src/services/storage/localStorageService.ts` | CRUD localStorage |
| `src/pages/Dashboard.tsx` | Dashboard com gráficos |
| `src/pages/Vendedores.tsx` | CRUD pontes |
| `src/pages/Vendas.tsx` | CRUD vendas |
| `src/pages/Relatorios.tsx` | Relatórios com filtros + gráficos |
| `src/pages/Configuracoes.tsx` | Config + sync manual |
| `src/layouts/AppLayout.tsx` | Layout com sidebar |
| `src/hooks/useVendedores.ts` | Hook de vendedores |
| `src/hooks/useVendas.ts` | Hook de vendas |
| `src/utils/calculations.ts` | Cálculos de distribuição |
| `src/utils/format.ts` | Formatação de moeda |
| `src/lib/demo-data.ts` | Dados de demonstração |

## O Que Precisa Ser Feito

### 1. Auto-sync (prioridade alta)
Substituir sync manual por automático como o kpsi-app:
- Criar `remote.ts` com SyncDoc pattern
- Criar `useSync.ts` hook com debounce
- Sync: pull no mount + push após cada operação
- Merge: Gist como source of truth

### 2. Multi-usuário / Múltiplas Pontes
Cada "ponte" (vendedor) tem seus dados. O proprietário vê tudo.
- Opção A: Perfis como no kpsi-app (um owner gerencia tudo) — RECOMENDADO
- Opção B: Cada vendedor com sua own conta (mais complexo)

### 3. Relatório PDF
Download de relatório por ponte mostrando:
- Total vendido pela ponte
- Quanto a ponte ganha
- Quanto o proprietário ganha
- Período filtrado
- Padrão similar ao ReportView do kpsi-app

## Padrões a Reutilizar do kpsi-app
1. **SyncDoc pattern** — `remote.ts` com Gist CRUD tipado
2. **useSync hook** — debounce + merge + auto pull/push
3. **localStorage cache** — sempre escrever em ambos (local + nuvem)
4. **Profile system** — paleta de cores, DEFAULT_PERFIL_ID
5. **Relatório PDF** — ReportView com badges e impressão

## Convenções
- shadcn/ui para componentes
- Commit messages concisos e descritivos
- Branches: `feat/`, `fix/`, `chore/`
- Não commitar secrets ou chaves
