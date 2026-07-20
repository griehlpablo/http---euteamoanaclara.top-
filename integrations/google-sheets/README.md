# Sincronização de gastos com Google Planilhas

Esta integração envia os lançamentos feitos em `https://www.euteamoanaclara.top/gastos` para a aba **Lançamentos** da planilha:

`https://docs.google.com/spreadsheets/d/1z5Z3pmTMMVJpX0CSulH4AhnJPoU6zmeKLdJeWPsq6y0/edit`

## 1. Criar o Apps Script

1. Abra a planilha.
2. Acesse **Extensões → Apps Script**.
3. Apague o conteúdo inicial de `Code.gs`.
4. Copie todo o conteúdo do arquivo `integrations/google-sheets/Code.gs` deste repositório.
5. Cole no editor e salve.

## 2. Criar o código secreto

1. No Apps Script, abra **Configurações do projeto**.
2. Em **Propriedades do script**, adicione uma propriedade.
3. Nome: `WRITE_TOKEN`.
4. Valor: crie um código longo e difícil de adivinhar, com pelo menos 12 caracteres.
5. Salve.

Não coloque esse código no GitHub nem em arquivos públicos do site.

## 3. Implantar como aplicativo da Web

1. Clique em **Implantar → Nova implantação**.
2. Escolha **Aplicativo da Web**.
3. Em **Executar como**, selecione **Eu**.
4. Em **Quem pode acessar**, selecione **Qualquer pessoa**.
5. Autorize o acesso à planilha.
6. Copie a URL terminada em `/exec`.

## 4. Configurar no site

1. Abra `https://www.euteamoanaclara.top/gastos`.
2. Clique no botão verde **Planilha**, no canto inferior direito.
3. Cole a URL terminada em `/exec`.
4. Digite o mesmo `WRITE_TOKEN`.
5. Clique em **Salvar integração**.

O endereço e o código ficam somente no navegador configurado. Repita esta etapa no celular da Ana e em outros aparelhos usados para registrar gastos.

## Funcionamento

- Cada lançamento continua salvo localmente primeiro.
- O site tenta enviá-lo automaticamente à planilha.
- Gastos pendentes são reenviados quando a página é aberta novamente.
- O Apps Script ignora lançamentos repetidos usando o ID da compra.
- Excluir um lançamento no site não apaga automaticamente a linha já sincronizada na planilha.
