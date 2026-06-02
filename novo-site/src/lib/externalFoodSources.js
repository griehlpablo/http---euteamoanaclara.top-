export async function searchOpenFoodFacts() {
  return {
    enabled: false,
    message: 'Busca online ainda nao ativada.',
    results: [],
  };
}

export async function lookupOpenFoodFactsByBarcode() {
  return {
    enabled: false,
    message: 'Busca por codigo de barras ainda nao ativada.',
    product: null,
  };
}
