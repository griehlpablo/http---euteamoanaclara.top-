import { callGeminiAPI } from "./gemini";

export const callMilkaAI = async ({ history = [], prompt, systemInstruction, base64Image = null, mimeType = null }) => {
  const result = await callGeminiAPI(history, prompt, base64Image, mimeType, {
    systemInstruction,
    includeRuntimeContext: true,
  });

  if (!result || result.modelUsed === "none") {
    throw new Error("Não foi possível acessar o assistente agora.");
  }

  return { ok: true, text: result.text, modelUsed: result.modelUsed };
};
