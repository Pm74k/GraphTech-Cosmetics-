# GraphTech — plugin Vencord

Affiche des décorations d'avatar, effets de profil, plaques nominatives, cadres et badges
personnalisés sur ton profil Discord. **Visible uniquement par toi et par les autres personnes
qui ont aussi ce plugin installé** — ça ne modifie rien sur le vrai compte Discord (aucun risque
de perdre des données, aucun achat, rien d'irréversible).

## Installation (une seule fois)

Il te faut : macOS/Windows/Linux avec [Node.js](https://nodejs.org) installé, et un terminal.

1. **Clone Vencord** (le mod Discord sur lequel ce plugin se greffe) :
   ```bash
   git clone --depth 1 https://github.com/Vendicated/Vencord.git
   cd Vencord
   ```

2. **Copie le dossier `graphtech`** (celui à côté de ce README) dans :
   ```
   Vencord/src/userplugins/graphtech
   ```
   (crée le dossier `userplugins` s'il n'existe pas déjà)

3. **Installe les dépendances et compile** (toujours depuis le dossier `Vencord`) :
   ```bash
   npx pnpm install
   npx pnpm build
   ```

4. **Injecte Vencord dans ton Discord** :
   ```bash
   npx pnpm inject
   ```
   Choisis ton install Discord dans la liste si demandé. Si ça bloque sur une histoire de
   permission macOS, donne l'accès "Full Disk Access" à l'app listée dans l'erreur, dans
   Réglages Système → Confidentialité et sécurité, puis relance la commande.

5. **Quitte complètement Discord** (Cmd+Q / clic droit → Quitter) et relance-le.

6. Dans Discord : **Réglages utilisateur → Vencord → Plugins**, cherche **"GraphTech"**,
   active-le, redémarre si demandé.

7. Toujours dans les réglages du plugin, clique sur **"Choisir mon apparence"** et
   **"Gérer mes badges"** pour personnaliser ton profil.

## Mettre à jour le plugin plus tard

Si je (pm74k) te renvoie une nouvelle version du dossier `graphtech` :
1. Remplace le dossier `Vencord/src/userplugins/graphtech` par le nouveau
2. Relance `npx pnpm build` depuis le dossier `Vencord`
3. Redémarre Discord

Pas besoin de refaire `pnpm inject` sauf si Discord a été mis à jour entre-temps (dans ce cas,
relance aussi `npx pnpm inject`).
