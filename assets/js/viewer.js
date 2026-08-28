import { Niivue } from "https://esm.sh/@niivue/niivue@0.69.0";

const STR = {
  en: {
    searchPlaceholder: "Search a structure…",
    viewMultiplanar: "Multiplanar",
    viewAxial: "Axial",
    viewCoronal: "Coronal",
    viewSagittal: "Sagittal",
    view3D: "3D",
    atlasOpacity: "Navigate the atlas",
    showAtlas: "Show atlas",
    showAll: "Show all",
    hideAll: "Hide all",
    infoPlaceholder: "Click a structure in the brain view, or pick one from the list, to see its description.",
    left: "Left",
    right: "Right",
    sourcesLabel: "Sources",
    pendingNotice: "A literature-sourced description has not been written yet for this structure.",
    searchPubmed: "Search on PubMed →",
    isolate: "Isolate this region",
    resetView: "Show all regions",
    loading: "Loading brain volumes…",
    noResults: "No matching structure.",
    documented: "Documented",
    pending: "Pending",
    atlasSource: "Atlas",
    settings: "Display settings",
    sectionTemplate: "Template",
    sectionViewer: "Viewer",
    sectionAtlas: "Atlas",
    colormap: "Colormap",
    contrast: "Contrast (min / max)",
    crosshair: "Crosshair",
    multiplanarLayout: "Multiplanar layout",
    layoutAuto: "Auto",
    layoutGrid: "Grid",
    layoutRow: "Row",
    layoutColumn: "Column",
    regionBorders: "Region borders",
    sectionInfo: "About this atlas",
    articleLink: "Read the article →",
    downloadLink: "Download the atlas →",
    referencesLabel: "References",
    backToSite: "Back to site",
    hideToolsPanel: "Hide tools panel",
    showToolsPanel: "Show tools panel",
    toggleAboutAtlas: "About this atlas",
  },
  fr: {
    searchPlaceholder: "Rechercher une structure…",
    viewMultiplanar: "Multiplan",
    viewAxial: "Axiale",
    viewCoronal: "Coronale",
    viewSagittal: "Sagittale",
    view3D: "3D",
    atlasOpacity: "Naviguer dans l'atlas",
    showAtlas: "Afficher l'atlas",
    showAll: "Tout afficher",
    hideAll: "Tout masquer",
    infoPlaceholder: "Cliquez sur une structure dans la vue du cerveau, ou choisissez-la dans la liste, pour afficher sa description.",
    left: "Gauche",
    right: "Droite",
    sourcesLabel: "Sources",
    pendingNotice: "La description sourcée n'a pas encore été rédigée pour cette structure.",
    searchPubmed: "Chercher sur PubMed →",
    isolate: "Isoler cette région",
    resetView: "Tout réafficher",
    loading: "Chargement des volumes cérébraux…",
    noResults: "Aucune structure trouvée.",
    documented: "Documenté",
    pending: "En attente",
    atlasSource: "Atlas",
    settings: "Réglages d'affichage",
    sectionTemplate: "Template",
    sectionViewer: "Visualisation",
    sectionAtlas: "Atlas",
    colormap: "Palette de couleurs",
    contrast: "Contraste (min / max)",
    crosshair: "Curseur",
    multiplanarLayout: "Disposition multiplan",
    layoutAuto: "Auto",
    layoutGrid: "Grille",
    layoutRow: "Ligne",
    layoutColumn: "Colonne",
    regionBorders: "Bordures des régions",
    sectionInfo: "À propos de cet atlas",
    articleLink: "Lire l'article →",
    downloadLink: "Télécharger l'atlas →",
    referencesLabel: "Références",
    backToSite: "Retour au site",
    hideToolsPanel: "Masquer le panneau d'outils",
    showToolsPanel: "Afficher le panneau d'outils",
    toggleAboutAtlas: "À propos de cet atlas",
  },
};

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export async function initBrainViewer(config) {
  let lang = localStorage.getItem("site_lang") || config.defaultLang || "en";

  const root = document.getElementById(config.rootId || "app");
  root.innerHTML = "";

  // ---------- header ----------
  const header = el("header", "site-header");
  let siteBackLabel = null;
  if (config.siteHomeUrl) {
    const siteBack = el("a", "site-back");
    siteBack.href = config.siteHomeUrl;
    if (config.cnrsLogoUrl) {
      const cnrsImg = document.createElement("img");
      cnrsImg.src = config.cnrsLogoUrl;
      cnrsImg.alt = "CNRS";
      cnrsImg.className = "site-back-logo";
      siteBack.appendChild(cnrsImg);
    }
    siteBackLabel = el("span", "site-back-label", "");
    siteBack.appendChild(siteBackLabel);
    header.appendChild(siteBack);
  }
  const brand = el("div", "brand");
  const logo = el("div", "brand-logo");
  if (config.logoUrl) {
    const img = document.createElement("img");
    img.src = config.logoUrl;
    img.alt = config.labName || "logo";
    logo.appendChild(img);
  } else {
    logo.textContent = (config.labInitials || "DAB");
  }
  const brandText = el("div", "brand-text");
  const labName = el("div", "lab-name", config.labName || "");
  const speciesTitle = el("div", "species-title");
  brandText.appendChild(labName);
  brandText.appendChild(speciesTitle);
  brand.appendChild(logo);
  brand.appendChild(brandText);

  const headerActions = el("div", "header-actions");
  const langToggle = el("div", "lang-toggle");
  const btnEn = el("button", "", "EN");
  const btnFr = el("button", "", "FR");
  langToggle.appendChild(btnFr);
  langToggle.appendChild(btnEn);

  const focusModeBtn = el("button", "icon-btn");
  focusModeBtn.title = "Hide tools panel";
  focusModeBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="14" y1="4" x2="14" y2="20"></line></svg>';

  const settingsBtn = el("button", "icon-btn active");
  settingsBtn.title = "Settings";
  settingsBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
  // Settings live inline in the sidebar (below) rather than as a floating
  // dropdown, so opening them pushes the region list down instead of
  // covering it.
  const settingsDropdown = el("div", "settings-dropdown");

  headerActions.appendChild(langToggle);
  headerActions.appendChild(focusModeBtn);
  headerActions.appendChild(settingsBtn);

  header.appendChild(brand);
  header.appendChild(headerActions);

  // ---------- layout ----------
  const layout = el("main", "layout");

  const viewerPane = el("div", "viewer-pane");
  const canvas = document.createElement("canvas");
  canvas.id = "gl-canvas";
  // A <canvas> isn't keyboard-focusable by default, so NiiVue's keyboard
  // shortcuts (e.g. hold "z" + scroll to zoom a 2D slice) never reach it
  // unless it explicitly accepts focus and gets it on interaction.
  canvas.tabIndex = 0;
  canvas.addEventListener("mouseenter", () => canvas.focus());
  canvas.addEventListener("click", () => canvas.focus());
  const loadingOverlay = el("div", "viewer-loading");
  const spinner = el("div", "spinner");
  const loadingText = el("div", "", "");
  loadingOverlay.appendChild(spinner);
  loadingOverlay.appendChild(loadingText);

  const viewToolbar = el("div", "view-toolbar");
  const viewButtons = {};
  ["multiplanar", "axial", "coronal", "sagittal", "render"].forEach((key) => {
    const b = el("button", "", "");
    b.dataset.view = key;
    viewButtons[key] = b;
    viewToolbar.appendChild(b);
  });
  viewButtons.multiplanar.classList.add("active");

  const hoverTooltip = el("div", "hover-tooltip hidden");
  viewerPane.appendChild(canvas);
  viewerPane.appendChild(loadingOverlay);
  viewerPane.appendChild(viewToolbar);
  viewerPane.appendChild(hoverTooltip);

  // ---------- sidebar ----------
  const sidebar = el("aside", "sidebar");

  const viewBlock = el("div", "panel-block"); // atlas controls
  const opacityLabel = el("span", "control-label", "");
  const opacityRow = el("div", "row");
  const opacitySlider = document.createElement("input");
  opacitySlider.type = "range";
  opacitySlider.min = "0";
  opacitySlider.max = "100";
  opacitySlider.value = String((config.defaultAtlasOpacity ?? 0.5) * 100);
  opacityRow.appendChild(opacitySlider);
  viewBlock.appendChild(opacityLabel);
  viewBlock.appendChild(opacityRow);

  const toggleRow = el("div", "row");
  toggleRow.style.marginTop = "10px";
  const showAtlasLabel = el("label", "checkbox-row");
  const showAtlasCheckbox = document.createElement("input");
  showAtlasCheckbox.type = "checkbox";
  showAtlasCheckbox.checked = true;
  const showAtlasText = el("span", "", "");
  showAtlasLabel.appendChild(showAtlasCheckbox);
  showAtlasLabel.appendChild(showAtlasText);
  const btnGroup = el("div", "row");
  const showAllBtn = el("button", "mini-btn", "");
  const hideAllBtn = el("button", "mini-btn", "");
  btnGroup.style.gap = "6px";
  btnGroup.appendChild(showAllBtn);
  btnGroup.appendChild(hideAllBtn);
  toggleRow.appendChild(showAtlasLabel);
  toggleRow.appendChild(btnGroup);
  viewBlock.appendChild(toggleRow);

  const searchBlock = el("div", "panel-block");
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "search-box";
  searchBlock.appendChild(searchInput);

  const listWrap = el("div", "region-list-wrap");
  const listEl = el("ul", "region-list");
  listWrap.appendChild(listEl);

  const infoPanel = el("div", "info-panel");
  const infoPlaceholder = el("div", "info-placeholder", "");
  infoPanel.appendChild(infoPlaceholder);

  sidebar.appendChild(settingsDropdown);
  sidebar.appendChild(viewBlock);
  sidebar.appendChild(searchBlock);
  sidebar.appendChild(listWrap);
  sidebar.appendChild(infoPanel);

  layout.appendChild(viewerPane);
  layout.appendChild(sidebar);

  root.appendChild(header);
  root.appendChild(layout);

  // ---------- data ----------
  const [lut, regions, descriptions] = await Promise.all([
    fetch(config.lutUrl).then((r) => r.json()),
    fetch(config.regionsUrl).then((r) => r.json()),
    fetch(config.descriptionsUrl).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
  ]);

  const workingLut = {
    I: lut.I.slice(),
    R: lut.R.slice(),
    G: lut.G.slice(),
    B: lut.B.slice(),
    A: lut.A.slice(),
    labels: lut.labels.slice(),
  };
  const idIndex = new Map(workingLut.I.map((id, i) => [id, i]));

  // Each volume's setColormapLabel() must get its own independent object —
  // sharing one reference across two volumes risks one call's internal
  // handling corrupting the other's already-applied colormap.
  function cloneLut(src) {
    return {
      I: src.I.slice(),
      R: src.R.slice(),
      G: src.G.slice(),
      B: src.B.slice(),
      A: src.A.slice(),
      labels: src.labels.slice(),
    };
  }

  const realRegions = regions.filter(
    (r) => r.base.toLowerCase() !== "background" && r.base.toLowerCase() !== "clear label"
  );

  const parentMap = new Map(); // parentName -> { color, ids: [], children: [] }
  for (const r of realRegions) {
    if (!parentMap.has(r.parent)) {
      parentMap.set(r.parent, { color: r.color, ids: [], children: [] });
    }
    const p = parentMap.get(r.parent);
    p.ids.push(r.id);
    p.children.push(r);
  }
  const parentNames = Array.from(parentMap.keys()).sort((a, b) => a.localeCompare(b));

  const visibility = new Map(parentNames.map((p) => [p, true]));

  // ---------- niivue ----------
  const nv = new Niivue({
    show3Dcrosshair: true,
    isResizeCanvas: true,
    backColor: [0.03, 0.03, 0.04, 1],
    onLocationChange: handleLocationChange,
  });
  await nv.attachToCanvas(canvas);

  const templateVolumeOpts = { url: config.templateUrl, colormap: "gray" };
  if (config.templateCalMin !== undefined) templateVolumeOpts.cal_min = config.templateCalMin;
  if (config.templateCalMax !== undefined) templateVolumeOpts.cal_max = config.templateCalMax;

  // Region borders are pre-baked into a second atlas volume rather than
  // computed/blended live: atlasWithBordersUrl is the same label volume with
  // every boundary voxel set to the atlas's own transparent sentinel (9999),
  // so it reuses the exact same, already-proven-correct atlas_lut.json and
  // rendering path — no separate LUT, no opacity-blending quirks. Toggling
  // "region borders" just swaps opacity between this volume and the plain
  // atlas; both stay loaded so the switch is instant.
  const atlasIdx = 1;
  const atlasBorderedIdx = config.atlasWithBordersUrl ? 2 : -1;
  const volumesToLoad = [templateVolumeOpts, { url: config.atlasUrl }];
  if (config.atlasWithBordersUrl) {
    volumesToLoad.push({ url: config.atlasWithBordersUrl });
  }

  let bordersOn = atlasBorderedIdx > 0;

  console.log("[diag] workingLut entries:", workingLut.I.length, "sample:", workingLut.I.slice(0, 3), workingLut.R.slice(0, 3), workingLut.A.slice(0, 3));
  await nv.loadVolumes(volumesToLoad);
  console.log("[diag] nv.volumes.length:", nv.volumes.length, nv.volumes.map(v => ({ id: v.id, url: v.url, colormap: v.colormap, dims: v.hdr && v.hdr.dims })));
  try {
    nv.volumes[atlasIdx].setColormapLabel(cloneLut(workingLut));
    console.log("[diag] setColormapLabel OK for atlasIdx", atlasIdx);
  } catch (e) {
    console.error("[diag] setColormapLabel FAILED for atlasIdx", atlasIdx, e);
  }
  nv.setOpacity(atlasIdx, bordersOn ? 0 : (config.defaultAtlasOpacity ?? 0.5));
  console.log("[diag] opacity atlasIdx set to", bordersOn ? 0 : (config.defaultAtlasOpacity ?? 0.5), "bordersOn:", bordersOn);
  if (atlasBorderedIdx > 0) {
    try {
      nv.volumes[atlasBorderedIdx].setColormapLabel(cloneLut(workingLut));
      console.log("[diag] setColormapLabel OK for atlasBorderedIdx", atlasBorderedIdx);
    } catch (e) {
      console.error("[diag] setColormapLabel FAILED for atlasBorderedIdx", atlasBorderedIdx, e);
    }
    nv.setOpacity(atlasBorderedIdx, bordersOn ? (config.defaultAtlasOpacity ?? 0.5) : 0);
    console.log("[diag] opacity atlasBorderedIdx set to", bordersOn ? (config.defaultAtlasOpacity ?? 0.5) : 0);
  }
  console.log("[diag] gl context:", nv.gl ? "present" : "MISSING", nv.gl && nv.gl.getParameter ? nv.gl.getParameter(nv.gl.VERSION) : "n/a");
  // Multiplanar's default "auto" render pane visibility hides the 3D view
  // whenever it judges the canvas too small/narrow for it — which made the
  // 3D pane disappear on almost any window resize. Force it always-on.
  nv.opts.multiplanarShowRender = 1; // SHOW_RENDER.ALWAYS
  nv.updateGLVolume();
  nv.drawScene();

  function activeAtlasIdx() {
    return bordersOn && atlasBorderedIdx > 0 ? atlasBorderedIdx : atlasIdx;
  }

  // ---------- hover tooltip ----------
  // Same coordinate pipeline NiiVue's own atlas-hover demo uses: canvas
  // pixel -> fractional volume position -> mm -> voxel -> raw label value.
  // Distinct from onLocationChange (which only fires on click/drag), so a
  // passive hover can show a name without moving the crosshair.
  let hoverIdVal = null;
  canvas.addEventListener("mousemove", (e) => {
    const pos = nv.getNoPaddingNoBorderCanvasRelativeMousePosition(e, nv.gl.canvas);
    const dpr = nv.uiData?.dpr || window.devicePixelRatio || 1;
    const frac = nv.canvasPos2frac([pos.x * dpr, pos.y * dpr]);
    if (!frac || frac[0] < 0) {
      hoverTooltip.classList.add("hidden");
      hoverIdVal = null;
      return;
    }
    const mm = nv.frac2mm(frac);
    const vol = nv.volumes[activeAtlasIdx()];
    const vox = vol.mm2vox(mm);
    const value = vol.getValue(vox[0], vox[1], vox[2]);
    if (!value) {
      hoverTooltip.classList.add("hidden");
      hoverIdVal = null;
      return;
    }
    if (value !== hoverIdVal) {
      hoverIdVal = value;
      const region = realRegions.find((r) => r.id === value);
      hoverTooltip.textContent = region ? region.parent : "";
    }
    if (hoverTooltip.textContent) {
      hoverTooltip.classList.remove("hidden");
      hoverTooltip.style.left = `${e.clientX - viewerPane.getBoundingClientRect().left + 14}px`;
      hoverTooltip.style.top = `${e.clientY - viewerPane.getBoundingClientRect().top + 14}px`;
    }
  });
  canvas.addEventListener("mouseleave", () => {
    hoverTooltip.classList.add("hidden");
    hoverIdVal = null;
  });

  loadingOverlay.classList.add("hidden");

  // ---------- settings panel ----------
  const templateVol = nv.volumes[0];
  const dataMax = Math.round((config.templateCalMax ?? templateVol.cal_max ?? 30000) * 1.2) || 32767;
  let availableColormaps = [];
  try {
    availableColormaps = nv.colormaps();
  } catch {
    availableColormaps = ["gray", "hot", "cool", "viridis", "inferno", "plasma", "bone"];
  }

  function settingsSection(titleKey) {
    const section = el("div", "settings-section");
    const h = document.createElement("h4");
    h.dataset.i18n = titleKey;
    section.appendChild(h);
    return section;
  }

  function settingsRow(labelKey, controlEl) {
    const row = el("div", "settings-row");
    const label = el("span", "settings-label");
    label.dataset.i18n = labelKey;
    row.appendChild(label);
    row.appendChild(controlEl);
    return row;
  }

  function makeSwitch(checked, onChange) {
    const wrap = el("label", "switch");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    const track = el("span", "track");
    input.addEventListener("change", () => onChange(input.checked));
    wrap.appendChild(input);
    wrap.appendChild(track);
    return wrap;
  }

  // Info / attribution section
  let atlasSpecsEl = null;
  let atlasDescEl = null;
  const infoSection = (config.atlasName || config.atlasInfo) ? settingsSection("sectionInfo") : null;
  if (infoSection) {
    if (config.atlasName) infoSection.appendChild(el("div", "atlas-name", config.atlasName));
    if (config.atlasSpecs) {
      atlasSpecsEl = el("div", "atlas-specs");
      infoSection.appendChild(atlasSpecsEl);
    }
    atlasDescEl = el("p", "atlas-desc", "");
    infoSection.appendChild(atlasDescEl);
    if (config.atlasReferences && config.atlasReferences.length) {
      const refsHeading = el("div", "atlas-references-heading");
      refsHeading.dataset.i18n = "referencesLabel";
      infoSection.appendChild(refsHeading);
      const refsList = el("div", "atlas-references");
      config.atlasReferences.forEach((ref) => {
        if (ref.url) {
          const a = document.createElement("a");
          a.href = ref.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = ref.text;
          refsList.appendChild(a);
        } else {
          refsList.appendChild(el("span", "atlas-reference-plain", ref.text));
        }
      });
      infoSection.appendChild(refsList);
    }
    if (config.atlasDownloadUrl) {
      const linksRow = el("div", "atlas-links");
      const a = document.createElement("a");
      a.href = config.atlasDownloadUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.dataset.i18n = "downloadLink";
      linksRow.appendChild(a);
      infoSection.appendChild(linksRow);
    }
  }

  // Template section
  const templateSection = settingsSection("sectionTemplate");
  const colormapSelect = document.createElement("select");
  availableColormaps.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (name === "gray") opt.selected = true;
    colormapSelect.appendChild(opt);
  });
  colormapSelect.addEventListener("change", () => {
    nv.setColormap(templateVol.id, colormapSelect.value);
    nv.updateGLVolume();
    nv.drawScene();
  });
  templateSection.appendChild(settingsRow("colormap", colormapSelect));

  const contrastField = el("div", "range-field");
  const contrastLabelRow = el("div", "range-label-row");
  contrastLabelRow.dataset.i18n = "contrast";
  const minSlider = document.createElement("input");
  minSlider.type = "range";
  minSlider.min = "0";
  minSlider.max = String(dataMax);
  minSlider.value = String(config.templateCalMin ?? 0);
  const maxSlider = document.createElement("input");
  maxSlider.type = "range";
  maxSlider.min = "0";
  maxSlider.max = String(dataMax);
  maxSlider.value = String(config.templateCalMax ?? dataMax);
  function applyContrast() {
    templateVol.cal_min = Number(minSlider.value);
    templateVol.cal_max = Number(maxSlider.value);
    nv.updateGLVolume();
  }
  minSlider.addEventListener("input", applyContrast);
  maxSlider.addEventListener("input", applyContrast);
  contrastField.appendChild(contrastLabelRow);
  contrastField.appendChild(minSlider);
  contrastField.appendChild(maxSlider);
  templateSection.appendChild(contrastField);

  // Atlas section
  const atlasSection = settingsSection("sectionAtlas");
  const layoutSelect = document.createElement("select");
  [
    ["0", "layoutAuto"],
    ["2", "layoutGrid"],
    ["3", "layoutRow"],
    ["1", "layoutColumn"],
  ].forEach(([value, key]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.dataset.i18n = key;
    layoutSelect.appendChild(opt);
  });
  layoutSelect.addEventListener("change", () => {
    nv.setMultiplanarLayout(Number(layoutSelect.value));
  });
  atlasSection.appendChild(settingsRow("multiplanarLayout", layoutSelect));

  if (atlasBorderedIdx > 0) {
    const borderSwitch = makeSwitch(bordersOn, (checked) => {
      bordersOn = checked;
      nv.setOpacity(atlasIdx, bordersOn ? 0 : Number(opacitySlider.value) / 100);
      nv.setOpacity(atlasBorderedIdx, bordersOn ? Number(opacitySlider.value) / 100 : 0);
      nv.updateGLVolume();
      nv.drawScene();
    });
    atlasSection.appendChild(settingsRow("regionBorders", borderSwitch));
  }

  // Viewer section
  const viewerSection = settingsSection("sectionViewer");
  const crosshairSwitch = makeSwitch(true, (checked) => {
    nv.opts.crosshairWidth = checked ? 1 : 0;
    nv.drawScene();
  });
  viewerSection.appendChild(settingsRow("crosshair", crosshairSwitch));

  if (infoSection) {
    const aboutAtlasSwitch = makeSwitch(true, (checked) => {
      infoSection.style.display = checked ? "" : "none";
    });
    viewerSection.appendChild(settingsRow("toggleAboutAtlas", aboutAtlasSwitch));
  }

  if (infoSection) settingsDropdown.appendChild(infoSection);
  settingsDropdown.appendChild(templateSection);
  settingsDropdown.appendChild(atlasSection);
  settingsDropdown.appendChild(viewerSection);

  settingsBtn.addEventListener("click", () => {
    settingsDropdown.classList.toggle("hidden");
    settingsBtn.classList.toggle("active");
  });

  let toolsPanelHidden = false;
  focusModeBtn.addEventListener("click", () => {
    toolsPanelHidden = !toolsPanelHidden;
    layout.classList.toggle("sidebar-hidden", toolsPanelHidden);
    focusModeBtn.classList.toggle("active", toolsPanelHidden);
    focusModeBtn.title = toolsPanelHidden ? STR[lang].showToolsPanel : STR[lang].hideToolsPanel;
    window.dispatchEvent(new Event("resize"));
  });

  function applyVisibility() {
    for (let i = 0; i < workingLut.I.length; i++) workingLut.A[i] = 0;
    for (const [name, visible] of visibility.entries()) {
      if (!visible) continue;
      for (const id of parentMap.get(name).ids) {
        const idx = idIndex.get(id);
        if (idx !== undefined) workingLut.A[idx] = 255;
      }
    }
    nv.volumes[atlasIdx].setColormapLabel(cloneLut(workingLut));
    if (atlasBorderedIdx > 0) nv.volumes[atlasBorderedIdx].setColormapLabel(cloneLut(workingLut));
    nv.updateGLVolume();
    nv.drawScene();
  }

  function setAllVisibility(value) {
    for (const name of parentNames) visibility.set(name, value);
    for (const cb of listEl.querySelectorAll("input.vis-toggle")) cb.checked = value;
    applyVisibility();
  }

  // ---------- region list rendering ----------
  const rowByName = new Map();

  function renderList(filterText) {
    listEl.innerHTML = "";
    rowByName.clear();
    const q = (filterText || "").trim().toLowerCase();
    const filtered = q ? parentNames.filter((n) => n.toLowerCase().includes(q)) : parentNames;

    if (filtered.length === 0) {
      listEl.appendChild(el("li", "no-results", STR[lang].noResults));
      return;
    }

    let lastLetter = null;
    for (const name of filtered) {
      const letter = name[0].toUpperCase();
      if (!q && letter !== lastLetter) {
        listEl.appendChild(el("li", "letter-heading", letter));
        lastLetter = letter;
      }
      const row = el("li", "region-row");
      const swatch = el("span", "swatch");
      const color = parentMap.get(name).color;
      swatch.style.background = `rgb(${color[0]},${color[1]},${color[2]})`;
      const nameSpan = el("span", "name", name);
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "vis-toggle";
      cb.checked = visibility.get(name);
      cb.addEventListener("click", (e) => e.stopPropagation());
      cb.addEventListener("change", () => {
        visibility.set(name, cb.checked);
        applyVisibility();
      });
      row.appendChild(swatch);
      row.appendChild(nameSpan);
      row.appendChild(cb);
      row.addEventListener("click", () => selectRegion(name));
      if (name === selectedName) row.classList.add("selected");
      listEl.appendChild(row);
      rowByName.set(name, row);
    }
  }

  // ---------- info panel ----------
  let selectedName = null;

  function selectRegion(name) {
    selectedName = name;
    for (const [n, r] of rowByName.entries()) r.classList.toggle("selected", n === name);
    const active = rowByName.get(name);
    if (active) active.scrollIntoView({ block: "nearest" });
    renderInfo(name);
  }

  function renderInfo(name) {
    infoPanel.innerHTML = "";
    const desc = descriptions[name];

    const headerRow = el("div", "info-header");
    headerRow.appendChild(el("div", "info-title", name));
    const badge = el("span", `badge ${desc && desc.status === "documented" ? "documented" : "pending"}`,
      desc && desc.status === "documented" ? STR[lang].documented : STR[lang].pending);
    headerRow.appendChild(badge);
    infoPanel.appendChild(headerRow);

    const childCount = parentMap.get(name).children.length;
    infoPanel.appendChild(el("div", "info-sub", `${childCount} label${childCount > 1 ? "s" : ""}`));

    if (desc && desc.status === "documented") {
      infoPanel.appendChild(el("div", "info-desc", desc[lang] || desc.en || ""));
      if (desc.sources && desc.sources.length) {
        const srcBlock = el("div", "info-sources");
        srcBlock.appendChild(el("span", "label", STR[lang].sourcesLabel));
        const ol = document.createElement("ol");
        for (const s of desc.sources) {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = s.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = s.title;
          li.appendChild(a);
          ol.appendChild(li);
        }
        srcBlock.appendChild(ol);
        infoPanel.appendChild(srcBlock);
      }
    } else {
      infoPanel.appendChild(el("div", "info-desc", STR[lang].pendingNotice));
      const a = document.createElement("a");
      a.href = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(name + " " + (config.pubmedContext || ""))}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = STR[lang].searchPubmed;
      a.style.color = "var(--accent)";
      a.style.fontSize = "12.5px";
      infoPanel.appendChild(a);
    }

    const actions = el("div", "info-actions");
    const isolateBtn = el("button", "mini-btn", STR[lang].isolate);
    isolateBtn.addEventListener("click", () => {
      for (const n of parentNames) visibility.set(n, n === name);
      for (const cb of listEl.querySelectorAll("input.vis-toggle")) cb.checked = false;
      const row = rowByName.get(name);
      if (row) row.querySelector("input.vis-toggle").checked = true;
      applyVisibility();
    });
    const resetBtn = el("button", "mini-btn", STR[lang].resetView);
    resetBtn.addEventListener("click", () => setAllVisibility(true));
    actions.appendChild(isolateBtn);
    actions.appendChild(resetBtn);
    infoPanel.appendChild(actions);
  }

  function handleLocationChange(data) {
    if (!data || !data.values || !data.values[atlasIdx]) return;
    const atlasVal = data.values[atlasIdx];
    if (!atlasVal.value) return;
    const region = realRegions.find((r) => r.id === atlasVal.value);
    if (!region) return;
    selectRegion(region.parent);
  }

  // ---------- wiring ----------
  searchInput.addEventListener("input", () => renderList(searchInput.value));

  opacitySlider.addEventListener("input", () => {
    nv.setOpacity(activeAtlasIdx(), Number(opacitySlider.value) / 100);
    nv.updateGLVolume();
    nv.drawScene();
  });

  showAtlasCheckbox.addEventListener("change", () => {
    nv.setOpacity(activeAtlasIdx(), showAtlasCheckbox.checked ? Number(opacitySlider.value) / 100 : 0);
    nv.updateGLVolume();
    nv.drawScene();
  });

  showAllBtn.addEventListener("click", () => setAllVisibility(true));
  hideAllBtn.addEventListener("click", () => setAllVisibility(false));

  Object.entries(viewButtons).forEach(([key, btn]) => {
    btn.addEventListener("click", () => {
      Object.values(viewButtons).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const map = {
        multiplanar: nv.sliceTypeMultiplanar,
        axial: nv.sliceTypeAxial,
        coronal: nv.sliceTypeCoronal,
        sagittal: nv.sliceTypeSagittal,
        render: nv.sliceTypeRender,
      };
      nv.setSliceType(map[key]);
    });
  });

  function setLang(newLang) {
    lang = newLang;
    localStorage.setItem("site_lang", lang);
    btnEn.classList.toggle("active", lang === "en");
    btnFr.classList.toggle("active", lang === "fr");
    applyStrings();
    renderList(searchInput.value);
    if (selectedName) renderInfo(selectedName);
  }
  btnEn.addEventListener("click", () => setLang("en"));
  btnFr.addEventListener("click", () => setLang("fr"));

  function applyStrings() {
    const s = STR[lang];
    speciesTitle.innerHTML = "";
    speciesTitle.appendChild(document.createTextNode((config.commonName && config.commonName[lang]) || ""));
    if (config.latinName) {
      speciesTitle.appendChild(document.createTextNode(" — "));
      const em = document.createElement("em");
      em.textContent = config.latinName;
      speciesTitle.appendChild(em);
    }
    document.title = `${(config.commonName && config.commonName[lang]) || ""} — ${config.latinName || ""}`;

    if (siteBackLabel) siteBackLabel.textContent = s.backToSite;
    if (atlasSpecsEl) {
      atlasSpecsEl.innerHTML = "";
      const specsText = (config.atlasSpecs && config.atlasSpecs[lang]) || "";
      specsText.split("\n\n").forEach((chunk) => {
        if (chunk.trim()) atlasSpecsEl.appendChild(el("p", "", chunk.trim()));
      });
    }
    if (atlasDescEl) atlasDescEl.textContent = (config.atlasInfo && config.atlasInfo[lang]) || "";

    opacityLabel.textContent = s.atlasOpacity;
    showAtlasText.textContent = s.showAtlas;
    showAllBtn.textContent = s.showAll;
    hideAllBtn.textContent = s.hideAll;
    searchInput.placeholder = s.searchPlaceholder;
    infoPlaceholder.textContent = s.infoPlaceholder;
    loadingText.textContent = s.loading;
    viewButtons.multiplanar.textContent = s.viewMultiplanar;
    viewButtons.axial.textContent = s.viewAxial;
    viewButtons.coronal.textContent = s.viewCoronal;
    viewButtons.sagittal.textContent = s.viewSagittal;
    viewButtons.render.textContent = s.view3D;
    settingsBtn.title = s.settings;
    focusModeBtn.title = toolsPanelHidden ? s.showToolsPanel : s.hideToolsPanel;

    root.querySelectorAll("[data-i18n]").forEach((elm) => {
      const key = elm.dataset.i18n;
      if (s[key] !== undefined) elm.textContent = s[key];
    });
  }

  btnEn.classList.toggle("active", lang === "en");
  btnFr.classList.toggle("active", lang === "fr");
  applyStrings();
  renderList("");

  // Some layouts (long sidebar list, scrollbars) settle after the volumes are
  // already loaded; force NiiVue to re-measure the canvas once things are stable.
  // The resize handler is debounced: firing drawScene() on every intermediate
  // frame while the window is actively being dragged is what made the
  // multiplanar layout visibly lag/stutter behind the real canvas size.
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (typeof nv.resizeListener === "function") nv.resizeListener();
      nv.drawScene();
    }, 60);
  });
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
  });
}
