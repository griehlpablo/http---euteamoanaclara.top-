#!/bin/bash
set -e -E

# Substitua pela sua API Key nova
GEMINI_API_KEY="AIzaSyBM0JRMAXVBS6ahs0ARg7i4CzCNZVoVuTQ"
MODEL_ID="gemini-3.1-flash-lite-preview"
GENERATE_CONTENT_API="streamGenerateContent"

cat << EOF > request.json
{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Sugira uma ideia de encontro romântico em Campo Mourão para mim e minha namorada Ana Clara. Estamos juntos desde 23/09/2023. Dê uma resposta curta e direta."
          }
        ]
      }
    ]
}
EOF

echo "Enviando requisição limpa para o modelo ${MODEL_ID}..."

curl \
-X POST \
-H "Content-Type: application/json" \
-H "Referer: https://euteamoanaclara.top/" \
"https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${GENERATE_CONTENT_API}?key=${GEMINI_API_KEY}" -d '@request.json'

echo -e "\n\nRequisição finalizada."