const NAV = [
  { href: "index.html", key: "home", fr: "Accueil", en: "Home" },
  { href: "david.html", key: "david", fr: "David", en: "David" },
  { href: "projects.html", key: "projects", fr: "Projets", en: "Projects" },
  { href: "news.html", key: "news", fr: "Actualités", en: "News" },
  { href: "lab.html", key: "lab", fr: "Environnement", en: "Lab environment" },
  { href: "tools.html", key: "tools", fr: "Nos outils", en: "Our Tools" },
  { href: "collaborations.html", key: "collaborations", fr: "Collaborations", en: "Collaborations" },
];

const UI = {
  fr: {
    tagline: "Neurosciences · Imagerie cérébrale · Comportement animal",
    menu: "Menu",
    footerContact: "Contact",
    footerAddress: "UMR 7247 CNRS/INRAE/Université de Tours, site INRAE de Nouzilly, 37380 Nouzilly.",
    rights: "Chargé de Recherche CNRS",
  },
  en: {
    tagline: "Neuroscience · Brain imaging · Animal behaviour",
    menu: "Menu",
    footerContact: "Contact",
    footerAddress: "UMR 7247 CNRS/INRAE/University of Tours, INRAE site of Nouzilly, 37380 Nouzilly, France.",
    rights: "CNRS Research Scientist",
  },
};

export function getSiteLang(defaultLang) {
  return localStorage.getItem("site_lang") || defaultLang || "fr";
}

function setSiteLang(lang) {
  localStorage.setItem("site_lang", lang);
}

function applyLangToDom(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-lang-block]").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-lang-block") === lang);
  });
  document.querySelectorAll(".lang-toggle button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (UI[lang] && UI[lang][key]) el.textContent = UI[lang][key];
  });
}

export function initSiteChrome({ active, defaultLang } = {}) {
  const lang = getSiteLang(defaultLang);

  const headerHost = document.getElementById("site-header");
  if (headerHost) {
    const navHtml = NAV.map(
      (item) =>
        `<a href="${item.href}"${item.key === active ? ' class="active"' : ""}>${item.fr === item.en ? item.fr : `<span data-lang-block="fr" class="${lang === "fr" ? "active" : ""}">${item.fr}</span><span data-lang-block="en" class="${lang === "en" ? "active" : ""}">${item.en}</span>`}</a>`
    ).join("");

    headerHost.innerHTML = `
      <div class="site-header-inner">
        <a class="site-brand" href="index.html">
          <img src="assets/img/cnrs.svg" alt="CNRS" />
          <span class="site-brand-text">
            <strong>David A. Barrière</strong>
            <span data-i18n="tagline"></span>
          </span>
        </a>
        <nav class="site-nav" id="site-nav">${navHtml}</nav>
        <button class="site-nav-toggle" id="site-nav-toggle" aria-label="Menu" data-i18n="menu"></button>
        <div class="lang-toggle">
          <button data-lang="fr" type="button">FR</button>
          <button data-lang="en" type="button">EN</button>
        </div>
      </div>
    `;

    headerHost.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.addEventListener("click", () => {
        setSiteLang(btn.dataset.lang);
        applyLangToDom(btn.dataset.lang);
      });
    });

    const navToggle = document.getElementById("site-nav-toggle");
    const navEl = document.getElementById("site-nav");
    if (navToggle && navEl) {
      navToggle.addEventListener("click", () => navEl.classList.toggle("open"));
    }
  }

  const footerHost = document.getElementById("site-footer");
  if (footerHost) {
    footerHost.innerHTML = `
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <h4 data-i18n="footerContact"></h4>
            <p data-i18n="footerAddress"></p>
            <p>Tél. +33 (0)2 47 42 75 11</p>
            <p><a href="mailto:david.barriere@cnrs.fr">david.barriere@cnrs.fr</a></p>
          </div>
        </div>
      </div>
    `;
  }

  applyLangToDom(lang);
}

export function initCarousel(rootSelector) {
  const root = document.querySelector(rootSelector);
  if (!root) return;
  const slides = [...root.querySelectorAll(".carousel-slide")];
  const dotsWrap = root.querySelector(".carousel-dots");
  if (!slides.length) return;

  let index = 0;
  let timer = null;

  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.addEventListener("click", () => go(i));
    dotsWrap.appendChild(b);
    return b;
  });

  function go(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, si) => s.classList.toggle("active", si === index));
    dots.forEach((d, di) => d.classList.toggle("active", di === index));
  }

  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  root.querySelector(".carousel-arrow.next")?.addEventListener("click", () => { next(); restart(); });
  root.querySelector(".carousel-arrow.prev")?.addEventListener("click", () => { prev(); restart(); });

  function restart() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 5500);
  }

  root.addEventListener("mouseenter", () => timer && clearInterval(timer));
  root.addEventListener("mouseleave", restart);

  go(0);
  restart();
}
