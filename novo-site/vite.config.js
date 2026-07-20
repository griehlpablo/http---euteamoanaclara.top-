import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const configureGemini = () => ({
  name: 'configure-gemini-cupido',
  enforce: 'pre',
  transform(code, id) {
    const normalizedId = id.replaceAll('\\', '/').split('?')[0];
    if (!normalizedId.endsWith('/src/services/gemini.js')) return null;

    let updatedCode = code.replace(
      "STANDARD: 'gemini-flash-latest'",
      "STANDARD: 'gemini-3.1-flash-lite'",
    );

    updatedCode = updatedCode.replace(
      'const systemInstruction = options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;',
      `const now = new Date();
  const localDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSince = (year, month, day) => Math.max(0, Math.floor(
    (localDay.getTime() - new Date(year, month - 1, day).getTime()) / 86400000,
  ));
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'não informado';
  const currentDateTime = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(now);
  const runtimeContext = [
    'CONTEXTO TEMPORAL CONFIÁVEL, obtido do relógio do aparelho nesta exata solicitação:',
    \`Data e hora atuais: \${currentDateTime}.\`,
    \`Data local numérica: \${String(now.getDate()).padStart(2, '0')}/\${String(now.getMonth() + 1).padStart(2, '0')}/\${now.getFullYear()}.\`,
    \`Fuso horário: \${timeZone}.\`,
    \`Pablo e Ana ficaram pela primeira vez há \${daysSince(2023, 7, 6)} dias, em 06/07/2023.\`,
    \`Eles namoram há \${daysSince(2023, 9, 23)} dias, desde 23/09/2023.\`,
    'Ao responder sobre hoje, agora, dia da semana, ano, aniversário ou duração do relacionamento, use somente estes dados.',
    'Nunca invente outra data. Não use uma data de treinamento do modelo e não afirme meses ou anos sem conferir pelos dados acima.',
  ].join(' ');
  const systemInstruction = \`\${options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION} \${runtimeContext}\`;`,
    );

    if (updatedCode === code) {
      this.warn('Não foi possível aplicar a configuração dinâmica do Cupido.');
    }

    return { code: updatedCode, map: null };
  },
});

export default defineConfig({
  plugins: [configureGemini(), react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        planohelena: resolve(__dirname, 'planohelena/index.html'),
      },
      external: ['dashjs', 'hls.js', 'flv.js'],
    },
  },
});
