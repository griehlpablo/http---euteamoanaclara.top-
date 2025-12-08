# Eu te amo Ana Clara ❤

Este repositório já inclui o site completo (HTML, CSS, JS e manifestos) pronto para colocar no ar. Abaixo estão formas rápidas de usar os arquivos, seja publicando direto ou baixando tudo em um ZIP.

## Como publicar no GitHub Pages (sem ZIP)
1. Faça login no GitHub e crie um repositório público novo (ou use o atual).
2. Faça upload dos arquivos deste projeto (index.html, sw.js, images/, etc.) direto pela interface web.
3. Em **Settings → Pages**, escolha a branch principal e a pasta raiz (`/`) como fonte. O GitHub gera a URL do site automaticamente.
4. Abra a URL para testar. Se editar algo depois, é só subir a versão atualizada dos arquivos.

## Como baixar um ZIP
- **Pelo GitHub:** na página do repositório clique em **Code → Download ZIP** e extraia no seu computador.
- **Pelo terminal:**
  ```bash
  git archive --format=zip --output site.zip HEAD
  ```
  Isso cria `site.zip` com todos os arquivos prontos para abrir ou hospedar.

## Como levar do Codex para o seu GitHub
1. Baixe o ZIP (qualquer uma das opções acima) ou use `git clone` se preferir trabalhar via Git.
2. No GitHub, crie um repositório público e clique em **Add file → Upload files**.
3. Arraste todos os arquivos extraídos (`index.html`, `sw.js`, `site.webmanifest`, pasta `images/`, etc.) e confirme o commit pela interface.
4. Em **Settings → Pages**, escolha a branch principal e a raiz (`/`) como fonte para o GitHub Pages.
5. Abra a URL gerada para testar; para trocar algo depois, repita o upload dos arquivos atualizados ou faça um novo push.

## Como atualizar depois
1. Faça as mudanças que quiser nos arquivos (principalmente `index.html`).
2. Teste abrindo `index.html` localmente no navegador (o service worker só ativa via HTTPS ou localhost).
3. Suba os arquivos atualizados para o GitHub Pages ou gere um novo ZIP usando os passos acima.

## Dica de cache/offline
O `sw.js` já está configurado para cachear os arquivos principais. Sempre que alterar o site, troque algo no `cacheName` dentro do `sw.js` ou faça um novo deploy para garantir que o navegador baixe a versão nova.
