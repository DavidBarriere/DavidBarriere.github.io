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

---

# English (see below)

Personal and scientific showcase website of **David Barrière**, CNRS researcher (UMR 7247 PRC — INRAE/CNRS/University of Tours/IFCE), featuring five interactive 3D brain atlas viewers.

🔗 **https://davidbarriere.github.io/**

## Content

- **Main site** (`index.html`, `david.html`, `projects.html`, `news.html`, `lab.html`, `tools.html`, `collaborations.html`) — overview, research projects, news, lab environment. Bilingual FR/EN.
- **Brain atlas viewers** (`mouse.html`, `rat.html`, `sheep.html`, `horse.html`, `swine.html`) — interactive 3D rendering (slices + volume) via [NiiVue](https://github.com/niivue/niivue), with region-by-region navigation, search, and description panels.

| Species | Atlas / template |
|---|---|
| Mouse (*Mus musculus*) | Turone Mouse Brain Atlas and Template (TMBTA) |
| Rat (*Rattus norvegicus*) | SIGMA Rat Brain Templates and Atlases |
| Sheep (*Ovis aries*) | Turone Sheep Brain Templates and Atlas (TSBTA) |
| Horse (*Equus caballus*) | Turone Equine Brain Template and Atlas (TEBTA) |
| Pig (*Sus scrofa domesticus*) | Turone Pig Brain Template and Atlas (TPBTA) |

## Tech stack

Static site, no framework or build step: vanilla HTML/CSS/JS, hosted on GitHub Pages.

- `assets/css/`, `assets/js/` — shared styles and scripts (`site.*` for the main site, `viewer.*` for the atlas viewers).
- `data/<species>/` — NIfTI volumes (template, atlas, atlas+borders), color lookup table and per-region metadata, generated and recolored via the scripts in `scripts/`.
- `scripts/build_atlas_data.py` — builds the `data/<species>/*` files from source files (template, atlas, labels); see `--help` for the full option list and the NiiVue-bug workarounds documented at the top of the file.
- `scripts/recolor_regions.py` — reassigns a color palette that keeps adjacent regions visually distinguishable.

## Local development

```bash
python3 -m http.server 8000
```

then open `http://localhost:8000/`.

## Deployment

Automatically deployed by **GitHub Pages** from the `main` branch (repo root) on every push.
