export const MODEL_TIERS = {
  PREMIUM: 'gemini-1.5-pro',
  STANDARD: 'gemini-3-flash',
  LITE: 'gemini-3.1-flash-lite-preview',
};

const DEFAULT_SYSTEM_INSTRUCTION = 'Instruções: Você é o assistente virtual criado pelo desenvolvedor Pablo Griehl para ajudar a namorada dele, Ana Clara. Seu tom deve ser prestativo, inteligente e gentil, com um leve toque romântico. Dê respostas curtas e práticas, EXCETO quando ela pedir uma receita, um roteiro ou detalhes específicos. Eles ficaram em 06/07/2023 e namoram desde 23/09/2023. NÃO REPITA sugestões. REGRA CRÍTICA: Se a Ana Clara pedir para avisar/notificar o namorado (ex: "fala pro pablo", "pede pro pablo", etc.), confirme que vai enviar e OBRIGATORIAMENTE inclua a tag secreta [AVISAR_PABLO] no final da sua resposta.';

const getGeminiApiKey = () => {
  // TODO: mover chamada da IA para backend futuramente para proteger a chave.
  const chaveInvertida = 'QTuVoVZNCzC4i7gRA0sha6SBVXAMRJ0MBySazIA';
  return chaveInvertida.split('').reverse().join('');
};

const formatHistory = (historicoMensagens, novoPrompt, base64Image, mimeType) => {
  const formattedHistory = historicoMensagens
    .filter((msg) => msg.text !== 'Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

  const currentParts = [{ text: novoPrompt || 'Analise esta imagem.' }];
  if (base64Image) {
    currentParts.push({ inlineData: { data: base64Image, mimeType } });
  }

  formattedHistory.push({ role: 'user', parts: currentParts });
  return formattedHistory;
};

export const callGeminiAPI = async (
  historicoMensagens,
  novoPrompt,
  base64Image = null,
  mimeType = null,
  options = {},
) => {
  const apiKey = getGeminiApiKey();
  const systemInstruction = options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;

  let modelOrder = [MODEL_TIERS.LITE, MODEL_TIERS.STANDARD, MODEL_TIERS.PREMIUM];
  if (base64Image || (novoPrompt && novoPrompt.length > 250)) {
    modelOrder = [MODEL_TIERS.PREMIUM, MODEL_TIERS.STANDARD, MODEL_TIERS.LITE];
  }

  const contents = formatHistory(historicoMensagens, novoPrompt, base64Image, mimeType);

  for (const modelId of modelOrder) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'O amor me deixou sem palavras.',
          modelUsed: modelId,
        };
      }

      if (response.status === 429) {
        console.warn(`Modelo ${modelId} atingiu o limite. Tentando próximo...`);
        continue;
      }

      throw new Error(data.error?.message || 'Erro desconhecido');
    } catch (error) {
      console.error(`Erro com modelo ${modelId}:`, error);
      if (modelId === modelOrder[modelOrder.length - 1]) {
        return { text: 'Minha conexão falhou em todos os níveis. Tente novamente! 💔', modelUsed: 'none' };
      }
    }
  }

  return { text: 'Minha conexão falhou em todos os níveis. Tente novamente! 💔', modelUsed: 'none' };
};
