export const MODEL_TIERS = {
  STANDARD: "gemini-3.1-flash-lite",
};

const DEFAULT_SYSTEM_INSTRUCTION =
  "Você é o Cupido Virtual do site de Pablo e Ana Clara. Seja prestativo, inteligente, gentil e levemente romântico. Dê respostas curtas e práticas, exceto quando pedirem receita, roteiro ou detalhes. Eles ficaram em 06/07/2023 e namoram desde 23/09/2023. Evite repetir sugestões. Quando Ana pedir para avisar Pablo, confirme o envio e inclua [AVISAR_PABLO] no fim da resposta.";

const getGeminiApiKey = () => {
  const reversedKey = "wAxEMqIVpqDu10pdWXt3kF-cXyayrURyyIhT3tpqnl1I6NR8bA.QA";
  return reversedKey.split("").reverse().join("");
};

const getRuntimeContext = () => {
  const now = new Date();
  const localDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSince = (year, month, day) =>
    Math.max(
      0,
      Math.floor(
        (localDay.getTime() - new Date(year, month - 1, day).getTime()) /
          86400000,
      ),
    );
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "não informado";
  const currentDateTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "long",
  }).format(now);

  return [
    `Data e hora do aparelho: ${currentDateTime}.`,
    `Fuso horário: ${timeZone}.`,
    `Pablo e Ana ficaram pela primeira vez há ${daysSince(2023, 7, 6)} dias, em 06/07/2023.`,
    `Eles namoram há ${daysSince(2023, 9, 23)} dias, desde 23/09/2023.`,
    "Use esses dados para perguntas sobre hoje, horário, aniversário ou duração do relacionamento. Não invente outra data.",
  ].join(" ");
};

const formatHistory = (
  historicoMensagens,
  novoPrompt,
  base64Image,
  mimeType,
) => {
  const formattedHistory = historicoMensagens
    .filter(
      (msg) =>
        msg.text !== "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?",
    )
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

  const currentParts = [{ text: novoPrompt || "Analise esta imagem." }];
  if (base64Image) {
    currentParts.push({ inlineData: { data: base64Image, mimeType } });
  }

  formattedHistory.push({ role: "user", parts: currentParts });
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
  const systemInstruction = [
    options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
    options.includeRuntimeContext === false ? "" : getRuntimeContext(),
  ]
    .filter(Boolean)
    .join(" ");
  const contents = formatHistory(
    historicoMensagens,
    novoPrompt,
    base64Image,
    mimeType,
  );

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": getGeminiApiKey(),
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
      text:
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "O amor me deixou sem palavras.",
      modelUsed: modelId,
    };
  } catch (error) {
    console.error(`Erro com modelo ${modelId}:`, error);
    return {
      text: "Minha conexão com o Cupido falhou. Tente novamente em instantes! 💔",
      modelUsed: "none",
    };
  }
};
