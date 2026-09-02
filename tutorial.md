# GraphTech — plugin Vencord

Affiche des décorations d'avatar, effets de profil, plaques nominatives, cadres et badges
personnalisés sur ton profil Discord. **Visible par toi ET par les autres personnes qui ont
aussi ce plugin installé** (les choix sont partagés via un petit serveur GraphTech) — ça ne
modifie rien sur ton vrai compte Discord : aucun risque de perdre des données, aucun achat,
rien d'irréversible.

## ⚠️ Avant de commencer

- Il te faut un ordinateur Windows, macOS ou Linux, avec une connexion internet.
- Toutes les commandes ci-dessous se tapent dans un **terminal** :

  - **Windows** → ouvre **PowerShell** (touche Windows, tape `PowerShell`, Entrée). ⚠️ Ce n'est
    **pas** une invite `bash` : ne tape jamais le mot `bash` avant une commande, et ne copie
    jamais les ```` ``` ```` (backticks) qui décorent les blocs de code sur GitHub — seul le
    contenu à l'intérieur du bloc est une vraie commande.
    
  - **macOS** → ouvre l'app **Terminal** (Cmd+Espace, tape `Terminal`, Entrée).
  
  - **Linux** → ton terminal habituel.
  
- Ne travaille jamais dans un dossier système comme `C:\Windows\System32` : si ton terminal
  s'ouvre là (le prompt affiche `C:\WINDOWS\system32>`), va d'abord dans ton dossier personnel :
  ```powershell
  cd $HOME
  ```

## Étape 1 — Installer Node.js

Va sur **[nodejs.org](https://nodejs.org)**, télécharge la version **LTS** (recommandée), installe-la
en cliquant "Next" partout, puis **ferme et rouvre ton terminal** (sinon la commande `node`
reste introuvable).

Vérifie que ça a marché :
```bash
node --version
```
Tu dois voir un numéro de version (ex: `v22.x.x`), pas une erreur.

## Étape 2 — Installer Git

**Windows uniquement** (macOS et Linux l'ont déjà, ou te le proposent automatiquement) :

1. Va sur **[git-scm.com/download/win](https://git-scm.com/download/win)** — le téléchargement démarre seul.
2. Lance l'installeur, clique "Next" à toutes les étapes (les réglages par défaut conviennent).
3. **Ferme et rouvre PowerShell** (obligatoire, sinon `git` reste introuvable).

Vérifie :
```bash
git --version
```

## Étape 3 — Cloner Vencord

Vencord est le mod Discord sur lequel ce plugin se greffe. Dans ton terminal, assure-toi d'abord
d'être dans ton dossier personnel :
```bash
cd $HOME
```
Puis clone-le :
```bash
git clone --depth 1 https://github.com/Vendicated/Vencord.git
cd Vencord
```
À partir d'ici, reste dans ce dossier `Vencord` pour toutes les commandes suivantes.

## Étape 4 — Installer le plugin GraphTech

1. Télécharge et dézippe le dossier `graphtech` qu'on t'a fourni (ou clone
   [ce repo](https://github.com/Pm74k/GraphTech-Cosmetics-)).
   
2. Crée le dossier qui accueille les plugins perso :
   ```bash
   mkdir src\userplugins
   ```
   *(sur macOS/Linux : `mkdir -p src/userplugins`)*
   Si le dossier existe déjà, cette commande affiche juste une erreur sans gravité — ignore-la.
   
3. Place le dossier `graphtech` (celui contenant `index.tsx`, `settings.tsx`, etc. — **pas** le
   dossier `graphtech-plugin` qui le contient) directement dans `src\userplugins`, pour obtenir :
   ```
   Vencord\src\userplugins\graphtech\index.tsx
   Vencord\src\userplugins\graphtech\settings.tsx
   Vencord\src\userplugins\graphtech\...
   ```
   ⚠️ Ne le mets **jamais** dans `src\plugins` (réservé aux plugins officiels de Vencord — ça
   casserait le build ou serait écrasé à la prochaine mise à jour).

## Étape 5 — Compiler et injecter

Toujours depuis le dossier `Vencord` :
```bash
npx pnpm install
npx pnpm build
npx pnpm inject
```
- La 1ère commande télécharge les dépendances (peut prendre 1-2 minutes).

- `pnpm inject` te demande de choisir ton installation Discord dans une liste si tu en as
  plusieurs — choisis la bonne, valide.
  
- **macOS** : si ça bloque sur une histoire de permission, va dans **Réglages Système →
  Confidentialité et sécurité → Accès complet au disque**, active l'app mentionnée dans
  l'erreur, puis relance `npx pnpm inject`.

## Étape 6 — Activer le plugin

1. **Quitte complètement Discord** — pas juste fermer la fenêtre : sur Windows, clic droit sur
   l'icône dans la barre des tâches en bas à droite → **Quitter Discord** (ou Alt+F4 puis
   vérifier qu'il n'est plus dans la barre système). Sur Mac : Cmd+Q.
   
2. Relance Discord normalement.

3. Va dans **Réglages utilisateur** (roue crantée en bas à gauche) → **Vencord → Plugins**.

4. Cherche **"GraphTech"** dans la barre de recherche, active le interrupteur. Redémarre Discord
   si demandé.

## Étape 7 — Personnaliser ton profil

Toujours dans les réglages du plugin GraphTech (User Settings → Vencord → Plugins → GraphTech,
clique sur son nom ou l'icône ⚙️ à côté) :
- **"Choisir mon apparence"** → décoration d'avatar, effet de profil, plaque, cadre.
- **"Gérer mes badges"** → cacher tes vrais badges ou en afficher des faux/perso.

Tes choix sont automatiquement partagés (toutes les ~3 secondes s'il y a un changement) avec le
serveur GraphTech, pour que les autres utilisateurs du plugin les voient sur ton profil — et
inversement pour les leurs. Il faut juste avoir Discord ouvert et une connexion internet.

**Limite à connaître** : ton compte Discord ne peut être "relié" qu'à un seul appareil/install
du plugin à la fois (le premier qui envoie des données réclame ton compte). Si tu réinstalles le
plugin ailleurs plus tard et que ça ne remonte plus tes badges, préviens pm74k.

## Mettre à jour le plugin plus tard

Si on te renvoie une nouvelle version du dossier `graphtech` :
1. Remplace entièrement `Vencord\src\userplugins\graphtech` par le nouveau dossier.
2. Depuis `Vencord` : `npx pnpm build`
3. Redémarre Discord (étape 6.1).

Pas besoin de refaire `pnpm inject`, sauf si Discord lui-même a été mis à jour entre-temps
(dans ce cas, relance aussi `npx pnpm inject`).

## Ça ne marche pas ? — Dépannage rapide

| Message d'erreur | Cause | Solution |
|---|---|---|
| `'bash' n'est pas reconnu...` | Tu as tapé `bash` avant la commande, ou collé les backticks ```` ``` ```` | Retape juste la commande, sans `bash` ni backticks |
| `'git' n'est pas reconnu...` | Git pas installé, ou terminal pas rouvert après install | Étape 2, puis ferme/rouvre PowerShell |
| `could not create work tree dir` / `Permission denied` | Tu es dans un dossier système (`System32`) | `cd $HOME` puis recommence le clone |
| Le dossier `graphtech` n'apparaît nulle part | Il n'a pas été placé au bon endroit | Vérifie qu'il est bien dans `Vencord\src\userplugins\graphtech` (pas `src\plugins`, pas dans un sous-dossier en trop) |
| "GraphTech" n'apparaît pas dans la liste des plugins Discord | Build fait avant la copie du dossier, ou Discord pas complètement redémarré | Refais `npx pnpm build` **après** avoir copié le dossier, puis quitte/relance Discord entièrement |
| Tu ne vois pas les badges d'un pote (qui a aussi le plugin) | Normal la 1ère seconde (récupération en tâche de fond) | Rouvre son profil après quelques secondes ; vérifiez que vous avez tous les deux la dernière version du plugin |
