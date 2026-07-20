import { callGeminiAPI as callOriginalGeminiAPI } from './gemini.js?original';

const ORIGINAL_MODEL_ID = 'gemini-flash-latest';
const TARGET_MODEL_ID = 'gemini-3.1-flash-lite';
const ORIGINAL_MODEL_PATH = `/models/${ORIGINAL_MODEL_ID}:generateContent`;
const TARGET_MODEL_PATH = `/models/${TARGET_MODEL_ID}:generateContent`;

const replaceModelInResource = (resource) => {
  if (typeof resource === 'string') {
    return resource.replace(ORIGINAL_MODEL_PATH, TARGET_MODEL_PATH);
  }

  if (resource instanceof URL) {
    return new URL(resource.toString().replace(ORIGINAL_MODEL_PATH, TARGET_MODEL_PATH));
  }

  return resource;
};

export const callGeminiAPI = async (...args) => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (resource, options) => (
    originalFetch(replaceModelInResource(resource), options)
  );

  try {
    const result = await callOriginalGeminiAPI(...args);

    return {
      ...result,
      modelUsed: result.modelUsed === ORIGINAL_MODEL_ID ? TARGET_MODEL_ID : result.modelUsed,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
};
