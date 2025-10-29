
# Eu te amo Ana Clara — site

Arquivos nesta pasta:
- `index.html` — página única pronta para publicar.
- `CNAME` — (contém o domínio `euteamoanaclara.top`) para usar com GitHub Pages.
- `.gitignore` — itens para ignorar no Git.

## Como usar (passo a passo rápido)

1. Abra a pasta no VSCode (`File -> Open Folder`).
2. (Opcional) Teste local: dê duplo-clique em `index.html` para abrir no navegador — funciona sem servidor.
3. Para publicar com **GitHub Pages**:
   - Crie um repositório no GitHub (por exemplo `euteamoanaclara.top`).
   - No terminal do VSCode, rode:
     ```bash
     git init
     git add .
     git commit -m "Primeiro deploy do site"
     git branch -M main
     git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
     git push -u origin main
     ```
   - No GitHub: `Settings -> Pages`, selecione `main` e `/ (root)`. O GitHub vai detectar `CNAME` e configurar o domínio automaticamente.
   - No painel do seu registrador (onde comprou o domínio), aponte o DNS conforme instruções do GitHub Pages (A records) ou siga o passo a passo do seu provedor se estiver usando Vercel/Netlify (se quiser, eu te guio no painel do provedor).

4. Alternativa (Vercel/Netlify): importe o repositório e faça deploy automático. Depois adicione o domínio `euteamoanaclara.top` no painel do serviço.

Se quiser, eu gero também uma versão com imagens de exemplo dentro da pasta `images/` — basta me dizer. 😉
