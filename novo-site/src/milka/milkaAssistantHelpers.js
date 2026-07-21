export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
  });

export const extractJson = (text) => {
  const cleaned = String(text || "").replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
};

export const QUICK_QUESTIONS = [
  "Quanto devo dar de comida agora?",
  "O que falta fazer hoje?",
  "Calcule a alimentação sem sachê",
  "Analise os últimos registros",
];
