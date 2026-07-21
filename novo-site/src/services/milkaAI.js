const toContents = (history, prompt, base64Image, mimeType) => {
  const contents = (Array.isArray(history) ? history : [])
    .slice(-12)
    .map((message) => ({
      role: message?.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message?.text || "").slice(0, 12000) }],
    }));
  const parts = [{ text: String(prompt || "").slice(0, 20000) }];
  if (base64Image && mimeType) parts.push({ inlineData: { data: base64Image, mimeType } });
  contents.push({ role: "user", parts });
  return contents;
};

export const callMilkaAI = async ({
  history = [],
  prompt,
  systemInstruction,
  base64Image = null,
  mimeType = null,
}) => {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction,
      contents: toContents(history, prompt, base64Image, mimeType),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    const error = new Error(data.error || `Erro HTTP ${response.status}`);
    error.code = data.code || "AI_REQUEST_FAILED";
    throw error;
  }
  return data;
};
