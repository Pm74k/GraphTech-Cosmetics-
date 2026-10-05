# GraphTech — plugin Vencord

Affiche des décorations d'avatar, effets de profil, plaques nominatives, cadres et badges
personnalisés sur ton profil Discord. **Visible par toi ET par les autres personnes qui ont
aussi ce plugin installé** (les choix sont partagés via un petit serveur GraphTech) — ça ne
modifie rien sur ton vrai compte Discord : aucun risque de perdre des données, aucun achat,
rien d'irréversible.

Ce guide marche pour **Windows** 🪟 et **Mac** 🍎. Chaque étape donne les commandes pour les deux :
prends uniquement celles de ton système.

## ⚠️ À lire avant de commencer

- **Ouvre le bon terminal** :
  - 🪟 **Windows** → **PowerShell** (touche Windows, tape `PowerShell`, Entrée).
  - 🍎 **Mac** → l'app **Terminal** (Cmd+Espace, tape `Terminal`, Entrée).
- **Ne copie que le contenu des blocs de code** : jamais le mot `bash` ni les ```` ``` ```` qui les entourent.
- **Ne mélange pas les systèmes** : les commandes Windows (`dir`, `\`, `npx.cmd`) ne marchent pas sur Mac, et inversement.
- 🪟 Ne travaille jamais dans `C:\Windows\System32` (si le prompt affiche `C:\WINDOWS\system32>`, tape d'abord `cd $HOME`).

---

## Étape 1 — Installer Node.js

Va sur **[nodejs.org](https://nodejs.org)**, télécharge la version **LTS**, installe-la ("Suivant" partout),
puis **ferme et rouvre ton terminal**. Vérifie :

```
node --version
```

Tu dois voir un numéro (ex: `v22.x.x`), pas une erreur.

## Étape 2 — Installer Git

- 🪟 **Windows** : va sur **[git-scm.com/download/win](https://git-scm.com/download/win)**, lance l'installeur ("Next" partout),
  puis **ferme et rouvre PowerShell**.
- 🍎 **Mac** : tape `git --version`. S'il n'est pas installé, macOS te propose de l'installer : accepte.

Vérifie :

```
git --version
```

## Étape 3 — Récupérer Vencord

Dans ton terminal :

```
cd $HOME
git clone --depth 1 https://github.com/Vendicated/Vencord.git
cd Vencord
```

(`cd $HOME` te place dans ton dossier personnel — `C:\Users\toi` sur Windows, `/Users/toi` sur Mac.)
Reste dans ce dossier `Vencord` pour toutes les étapes suivantes.

## Étape 4 — Ajouter le plugin GraphTech

1. **Dézippe** `graphtech-plugin.zip` (ou télécharge le repo : [GraphTech-Cosmetics-](https://github.com/Pm74k/GraphTech-Cosmetics-)).
   Tu obtiens un dossier `graphtech-plugin` qui contient un dossier **`graphtech`** : c'est lui qu'il faut.
2. **Crée le dossier des plugins perso** :
   - 🪟 `mkdir src\userplugins`
   - 🍎 `mkdir -p src/userplugins`

   (Si le dossier existe déjà, une erreur « existe déjà » est sans gravité.)
3. **Place le dossier `graphtech`** (celui qui contient `index.tsx`) dans `src/userplugins` :
   - 🪟 Glisse-le dans `C:\Users\toi\Vencord\src\userplugins\`
   - 🍎 Glisse-le dans `/Users/toi/Vencord/src/userplugins/`
     (ou en commande, en adaptant le chemin du dossier dézippé : `cp -R ~/Downloads/graphtech-plugin/graphtech src/userplugins/graphtech`)
4. **Vérifie que c'est bien placé** :
   - 🪟 `dir src\userplugins\graphtech`
   - 🍎 `ls src/userplugins/graphtech`

   Tu dois voir **directement** `index.tsx`, `native.ts`, `syncApi.ts`, `settings.tsx`, etc.
   Si tu vois à la place un autre dossier `graphtech`, tu as un niveau de trop : remonte les fichiers d'un cran.

⚠️ Jamais dans `src/plugins` (réservé aux plugins officiels).

## Étape 5 — Compiler et injecter

Toujours depuis le dossier `Vencord` :

🪟 **Windows** (avec `npx.cmd` — voir « Dépannage » si `npx` est bloqué) :

```
npx.cmd pnpm install
npx.cmd pnpm build
npx.cmd pnpm inject
```

🍎 **Mac** :

```
npx pnpm install
npx pnpm build
npx pnpm inject
```

- `install` télécharge les dépendances (1-2 minutes).
- `build` doit finir par des lignes `Done in ...ms`, **sans message rouge**.
- `inject` te demande de choisir ton Discord dans une liste (prends le bon : Stable / PTB / Canary).
- 🍎 Si `inject` bloque sur une permission : **Réglages Système → Confidentialité et sécurité → Accès complet au disque**,
  active l'app citée dans l'erreur, puis relance `inject`.

## Étape 6 — Activer le plugin

1. **Quitte complètement Discord** :
   - 🪟 clic droit sur son icône en bas à droite de la barre des tâches → **Quitter Discord**
   - 🍎 `Cmd+Q`
2. Relance Discord.
3. **Paramètres utilisateur** (roue crantée en bas à gauche) → **Vencord → Plugins** → cherche **GraphTech** → active-le.

## Étape 7 — Personnaliser ton profil

Dans les réglages du plugin GraphTech :
- **« Choisir mon apparence »** → décoration d'avatar, effet de profil, plaque, cadre.
- **« Gérer mes badges »** → cacher tes vrais badges ou en afficher des faux / perso.
  Pour un badge perso : lien **direct** en `https://` vers une image carrée (idéalement 128×128 px, PNG).

Tes choix sont envoyés automatiquement (toutes les ~3 secondes quand tu changes quelque chose) au serveur
GraphTech, pour que les autres utilisateurs du plugin les voient sur ton profil — et inversement.
Discord doit être ouvert, avec une connexion internet. Ouvre le profil d'un ami (qui a aussi le plugin) :
ses décorations/badges apparaissent après quelques secondes.

**Limite** : ton compte Discord n'est « relié » qu'à **une seule installation** du plugin (la première qui envoie
ses données). Si tu réinstalles ailleurs et que tes choix ne remontent plus, préviens pm74k.

---

## Mettre à jour le plugin plus tard

1. Remplace entièrement `Vencord/src/userplugins/graphtech` par le nouveau dossier `graphtech`.
2. Depuis `Vencord` : 🪟 `npx.cmd pnpm build` / 🍎 `npx pnpm build`
3. **Quitte complètement Discord** et relance-le.

Pas besoin de refaire `inject`, sauf si Discord s'est mis à jour entre-temps (dans ce cas, refais aussi `inject`).

---

## 🛠️ Dépannage

| Problème | Cause | Solution |
|---|---|---|
| `'bash' n'est pas reconnu` | Tu as tapé `bash` ou copié les ```` ``` ```` | Tape seulement la commande, sans `bash` ni backticks |
| `'git' n'est pas reconnu` | Git pas installé / terminal pas rouvert | Étape 2, puis ferme et rouvre le terminal |
| 🪟 `npx : Impossible de charger le fichier ...npx.ps1 ... l'exécution de scripts est désactivée` | PowerShell bloque les scripts `.ps1` | Utilise `npx.cmd` à la place de `npx` (ex: `npx.cmd pnpm install`), ou lance une fois `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` et réponds `O` |
| 🍎 `zsh: command not found: dir` | Commande Windows tapée sur Mac | Sur Mac, utilise `ls` au lieu de `dir`, et `/` au lieu de `\` |
| `cd: no such file or directory` / `could not create work tree dir` / `Permission denied` | Mauvais dossier (ex: `System32`) | Fais `cd $HOME`, puis recommence |
| `ls`/`dir` sur `src/userplugins/graphtech` : introuvable | Le dossier `graphtech` n'est pas (ou mal) placé | Reprends l'étape 4 : il doit être dans `Vencord/src/userplugins/graphtech` |
| GraphTech absent de la liste des plugins | Build fait avant la copie, build en erreur, mauvais Discord injecté, ou Discord pas redémarré à fond | Refais `build` **après** avoir copié le dossier, vérifie qu'il n'y a pas d'erreur rouge, `inject` sur le bon Discord, puis quitte/relance Discord |
| Rond gris à la place d'un badge perso | Lien d'image en `http://` ou pas direct | Utilise un lien `https://` direct vers le fichier image (.png/.jpg/.webp/.gif) |
| Je ne vois pas le profil d'un ami | Il n'a pas la dernière version, ou Discord pas relancé | Vérifiez que vous avez tous les deux la dernière version, `build`, et relancez Discord |

En cas de souci, ouvre la console de Discord (🪟 `Ctrl+Shift+I` / 🍎 `Cmd+Option+I` → onglet **Console**) et envoie les lignes rouges contenant `GraphTech`.
