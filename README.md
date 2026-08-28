# davidbarriere.github.io

Site personnel et vitrine scientifique de **David Barrière**, chercheur CNRS (UMR 7247 PRC — INRAE/CNRS/Université de Tours/IFCE), avec cinq visualisateurs 3D interactifs d'atlas cérébraux.

🔗 **https://davidbarriere.github.io/**

## Contenu

- **Site principal** (`index.html`, `david.html`, `projects.html`, `news.html`, `lab.html`, `tools.html`, `collaborations.html`) — présentation, projets de recherche, actualités, environnement de laboratoire. Bilingue FR/EN.
- **Visualisateurs d'atlas cérébraux** (`mouse.html`, `rat.html`, `sheep.html`, `horse.html`, `swine.html`) — rendu 3D interactif (coupes + volume) via [NiiVue](https://github.com/niivue/niivue), avec navigation par région, recherche et fiches descriptives.

| Espèce | Atlas / template |
|---|---|
| Souris (*Mus musculus*) | Turone Mouse Brain Atlas and Template (TMBTA) |
| Rat (*Rattus norvegicus*) | SIGMA Rat Brain Templates and Atlases |
| Mouton (*Ovis aries*) | Turone Sheep Brain Templates and Atlas (TSBTA) |
| Cheval (*Equus caballus*) | Turone Equine Brain Template and Atlas (TEBTA) |
| Cochon (*Sus scrofa domesticus*) | Turone Pig Brain Template and Atlas (TPBTA) |

## Stack technique

Site statique, sans framework ni étape de build : HTML/CSS/JS vanilla, hébergé sur GitHub Pages.

- `assets/css/`, `assets/js/` — styles et scripts partagés (`site.*` pour le site principal, `viewer.*` pour les visualisateurs d'atlas).
- `data/<espèce>/` — volumes NIfTI (template, atlas, atlas+frontières), table de couleurs et métadonnées par région, générés et recolorés via les scripts dans `scripts/`.
- `scripts/build_atlas_data.py` — construit les fichiers `data/<espèce>/*` à partir des fichiers sources (template, atlas, labels) ; voir `--help` pour le détail des options et des contournements de bugs NiiVue documentés en tête de fichier.
- `scripts/recolor_regions.py` — réattribue une palette de couleurs distinguable entre régions adjacentes.

## Développement local

```bash
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000/`.

## Déploiement

Déployé automatiquement par **GitHub Pages** depuis la branche `main` (racine du dépôt) à chaque push.
