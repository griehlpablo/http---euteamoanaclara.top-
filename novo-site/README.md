# Eu Te Amo Ana Clara

Site pessoal do casal, com central de memórias, mural, planos, registros e o Cupido Virtual.

## Desenvolvimento

```bash
npm ci
npm run dev
```

## Publicação

As alterações são feitas em `novo-site`. Para gerar a versão publicada na raiz:

```bash
npm run build:root
```

O cliente do Supabase usa a chave pública do projeto. A URL e a chave também podem ser fornecidas pelas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
