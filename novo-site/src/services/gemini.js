export const MODEL_TIERS = {
  STANDARD: 'gemini-flash-latest',
};

const DEFAULT_SYSTEM_INSTRUCTION = 'Instruções: Você é o assistente virtual criado pelo desenvolvedor Pablo Griehl para ajudar a namorada dele, Ana Clara. Seu tom deve ser prestativo, inteligente e gentil, com um leve toque romântico. Dê respostas curtas e práticas, EXCETO quando ela pedir uma receita, um roteiro ou detalhes específicos. Eles ficaram em 06/07/2023 e namoram desde 23/09/2023. NÃO REPITA sugestões. REGRA CRÍTICA: Se a Ana Clara pedir para avisar/notificar o namorado (ex: "fala pro pablo", "pede pro pablo", etc.), confirme que vai enviar e OBRIGATORIAMENTE inclua a tag secreta [AVISAR_PABLO] no final da sua resposta.';

const getGeminiApiKey = () => {
  const reversedKey = 'wAxEMqIVpqDu10pdWXt3kF-cXyayrURyyIhT3tpqnl1I6NR8bA.QA';
  return reversedKey.split('').reverse().join('');
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
  const modelId = MODEL_TIERS.STANDARD;
  const systemInstruction = options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
  const contents = formatHistory(historicoMensagens, novoPrompt, base64Image, mimeType);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': getGeminiApiKey(),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const apiMessage = data.error?.message || `Erro HTTP ${response.status}`;
      throw new Error(apiMessage);
    }

    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'O amor me deixou sem palavras.',
      modelUsed: modelId,
    };
  } catch (error) {
    console.error(`Erro com modelo ${modelId}:`, error);
    return {
      text: 'Minha conexão com o Cupido falhou. Tente novamente em instantes! 💔',
      modelUsed: 'none',
    };
  }
};
