#!/bin/zsh
# Clique duas vezes para ligar o site em http://localhost:8080
# Para desligar: feche esta janela ou aperte Ctrl+C.

cd "$(dirname "$0")"
export PATH="$HOME/.local/node/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v npm >/dev/null; then
  echo "Node não encontrado. Instale em https://nodejs.org e tente de novo."
  read -k1 "?Aperte uma tecla para fechar."
  exit 1
fi

# Se já tem algo na porta 8080, libera ela.
old=$(lsof -ti tcp:8080 2>/dev/null)
[ -n "$old" ] && kill $old 2>/dev/null && sleep 1

# Instala as dependências se faltarem.
[ -d node_modules ] || npm install

ip=$(ipconfig getifaddr en0 2>/dev/null)
echo ""
echo "  GoFocus ligando..."
echo "  No Mac:     http://localhost:8080"
[ -n "$ip" ] && echo "  No celular: http://$ip:8080  (mesmo Wi-Fi)"
echo ""

(sleep 3 && open "http://localhost:8080") &
npm run dev
