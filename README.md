# GraphTech — plugin Vencord

Affiche des décorations d'avatar, effets de profil, plaques nominatives, cadres et badges personnalisés sur ton profil Discord. **Visible par toi ET par les autres personnes qui ont aussi ce plugin** (les choix sont partagés via un petit serveur GraphTech). Ça ne modifie rien sur ton vrai compte Discord : aucun achat, rien d'irréversible.

Code open source sous licence GPL-3.0.

## Installer ou mettre à jour (une seule commande)

La même commande sert pour la première installation et pour chaque mise à jour.

**Prérequis, une seule fois** : [Node.js](https://nodejs.org) (version LTS) et Git.

### 🍎 Mac

Dans l'app **Terminal** :

```
curl -fsSL https://raw.githubusercontent.com/Pm74k/GraphTech-Cosmetics-/main/install.sh | bash
```

### 🪟 Windows

Dans **PowerShell** :

```
irm https://raw.githubusercontent.com/Pm74k/GraphTech-Cosmetics-/main/install.ps1 | iex
```

### Ensuite

1. Première installation : choisis ton Discord dans la liste quand le script le demande.
2. **Quitte Discord complètement** (Cmd+Q sur Mac, clic droit sur l'icône puis Quitter sur Windows) et relance-le.
3. Première installation seulement : Paramètres → Vencord → Plugins → GraphTech → active-le.

Le plugin te prévient dans Discord quand une nouvelle version est disponible : il suffit alors de relancer la commande.

## Personnaliser ton profil

Dans les réglages du plugin :
- **« Choisir mon apparence »** : décoration d'avatar, effet de profil, plaque, cadre.
- **« Gérer mes badges »** : cacher tes vrais badges ou en afficher des perso. Pour un badge perso : lien **direct** en `https://` vers une image carrée (idéalement 128×128 px, PNG).

Tes choix sont envoyés automatiquement au serveur GraphTech toutes les ~3 secondes quand tu changes quelque chose. Discord doit être ouvert, avec une connexion internet.

**Limite** : ton compte Discord n'est relié qu'à **une seule installation** du plugin (la première qui envoie ses données). Si tu réinstalles ailleurs et que tes choix ne remontent plus, préviens pm74k.

## Dépannage

| Problème | Solution |
|---|---|
| `'git'` ou `node` introuvable | Installe-le, puis ferme et rouvre le terminal |
| 🪟 Erreur sur `npx.ps1` / scripts désactivés | Lance une fois `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, réponds `O`, puis relance la commande |
| GraphTech absent de la liste des plugins | Relance la commande, vérifie qu'il n'y a pas d'erreur rouge, puis quitte et relance Discord |
| Je ne vois pas les cosmétiques d'un ami | Vous devez tous les deux avoir la dernière version et avoir relancé Discord |
| Rond gris à la place d'un badge perso | Utilise un lien `https://` direct vers le fichier image |

En cas de souci, ouvre la console de Discord (🪟 `Ctrl+Shift+I` / 🍎 `Cmd+Option+I`, onglet **Console**) et envoie les lignes rouges contenant `GraphTech`.
