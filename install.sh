#!/bin/bash
set -e
VENCORD="$HOME/Vencord"
ZIP_URL="https://github.com/Pm74k/GraphTech-Cosmetics-/archive/refs/heads/main.zip"

for cmd in node git curl unzip; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Il manque '$cmd'. Installe-le (Node.js : https://nodejs.org, Git : tape 'git --version' pour que macOS le propose), puis relance cette commande."
    exit 1
  fi
done

FIRST_INSTALL=0
if [ ! -d "$VENCORD" ]; then
  FIRST_INSTALL=1
  echo "Téléchargement de Vencord..."
  git clone --depth 1 https://github.com/Vendicated/Vencord.git "$VENCORD"
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "Téléchargement de GraphTech..."
curl -fsSL "$ZIP_URL" -o "$TMP/gt.zip"
unzip -q "$TMP/gt.zip" -d "$TMP"

mkdir -p "$VENCORD/src/userplugins"
rm -rf "$VENCORD/src/userplugins/graphtech"
SRC="$(find "$TMP" -type f -name index.tsx -path '*/graphtech/index.tsx' -exec dirname {} \; | head -n 1)"
if [ -z "$SRC" ]; then
  echo "Dossier du plugin introuvable dans l'archive téléchargée."
  exit 1
fi
cp -R "$SRC" "$VENCORD/src/userplugins/graphtech"

cd "$VENCORD"
echo "Installation des dépendances..."
npx --yes pnpm install
echo "Compilation..."
npx pnpm build

if [ "$FIRST_INSTALL" = "1" ]; then
  echo "Choisis ton Discord dans la liste :"
  npx pnpm inject < /dev/tty
fi

echo ""
echo "Terminé. Quitte Discord complètement (Cmd+Q) puis relance-le."
if [ "$FIRST_INSTALL" = "1" ]; then
  echo "Active ensuite le plugin : Paramètres > Vencord > Plugins > GraphTech."
fi
