# 🛍 SaaS Loja de Roupas — Guia de Instalação

## Visão Geral

Sistema completo de gestão para loja de roupas com:
- Multi-usuário com isolamento de dados (RLS)
- Autenticação completa (login, cadastro, recuperar senha)
- Cadastros: Produtos, Vendedores, Clientes, Formas de Pagamento
- PDV (Ponto de Venda) com múltiplos itens
- Dashboard com KPIs e gráficos
- Relatórios por período com filtros de data

---

## Passo 3 — Configurar o projeto React

### Opção A — Usando Create React App

```bash
npx create-react-app minha-loja
cd minha-loja
```

Substitua o conteúdo de `src/App.jsx` pelo arquivo `loja_saas.jsx`

### Opção B — Usando Vite (recomendado)

```bash
npm create vite@latest minha-loja -- --template react
cd minha-loja
npm install
```

Substitua `src/App.jsx` pelo conteúdo de `loja_saas.jsx`

---

## Passo 4 — Configurar credenciais

No início do arquivo `loja_saas.jsx`, substitua:

```javascript
const SUPABASE_URL = "https://tfzjctogkcmjtthvsvph.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmempjdG9na2NtanR0aHZzdnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDczNzQsImV4cCI6MjA5NDE4MzM3NH0.WraDMwj6oVUhJD2QfzZ9DRdjXy86fRriFycovxwzDW4";
```

Com seus dados reais do Supabase.

---

## Passo 5 — Rodar o projeto

```bash
npm run dev     # Vite
# ou
npm start       # Create React App
```

Acesse: http://localhost:5173 (Vite) ou http://localhost:3000 (CRA)

---

## Passo 6 — Primeiro acesso

1. Clique em **Criar conta** na tela de login
2. Cadastre seu e-mail e senha
3. Após o login, você estará no Dashboard
4. Comece cadastrando:
   - Grupos e Categorias (no SQL Editor, ou adicione tela de grupos)
   - Formas de Pagamento (Débito, Crédito, PIX)
   - Produtos (com SKU)
   - Vendedores

---

## Estrutura das tabelas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis dos usuários |
| `groups` | Grupos de produtos |
| `categories` | Categorias (ligadas a grupos) |
| `products` | Produtos com SKU, preço, estoque |
| `sellers` | Vendedores |
| `payment_methods` | Formas de pagamento (debit/credit/pix) |
| `customers` | Clientes com CPF, data nasc., etc. |
| `sales` | Cabeçalho das vendas |
| `stock_entries` | Entradas de estoque por SKU (compras, ajustes) |
| `sale_items` | Itens de cada venda (saídas de estoque por SKU) |

---

## Segurança (RLS)

Cada usuário vê **apenas seus próprios dados**. O isolamento é feito via Row Level Security (RLS) do Supabase — a política `user_id = auth.uid()` é aplicada a todas as tabelas.

---

## Relacionamento por SKU

O **SKU é a chave de negócio central** do sistema. Todas as movimentações de estoque são rastreadas por ele:

| Tabela | Papel |
|--------|-------|
| `products` | Cadastro mestre do SKU (descrição, preço, grupo) |
| `stock_entries` | **Entradas** de estoque (compras, transferências, ajustes) |
| `sale_items` | **Saídas** de estoque (itens vendidos) |

A posição de estoque é calculada em tempo real:
```
Saldo (SKU) = Σ stock_entries.quantity − Σ sale_items.quantity
```

O script SQL inclui a query de posição de estoque para uso direto no Supabase.

---

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Faça upload da pasta `dist/` no painel Netlify
```

---

## Suporte e extensões sugeridas

- **Grupos/Categorias via interface**: adicionar telas de cadastro de grupos e categorias
- **Relatório de estoque**: exibir produtos com estoque baixo
- **Impressão de cupom**: adicionar botão de imprimir venda
- **Dashboard avançado**: integrar Chart.js para gráficos de linha/pizza

---

## Tecnologias

- **React** (JSX puro, sem TypeScript)
- **Supabase** (PostgreSQL + Auth + RLS)
- **CSS puro** (sem bibliotecas de UI externas)
- **Fetch API** (sem dependência do `@supabase/supabase-js`)

> Nenhuma dependência adicional além do React é necessária.
