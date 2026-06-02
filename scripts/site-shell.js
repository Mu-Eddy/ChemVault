(function () {
  document.addEventListener("DOMContentLoaded", () => {
    wireShellNav();
    wireShellTheme();
    wireShellSearch();
    markActivePage();
    adaptShellLayout();
    ensureDeveloperFooter();
  });

  function wireShellNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    toggle?.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function wireShellTheme() {
    const savedTheme = localStorage.getItem("chemvault-theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    applyTheme(savedTheme || (prefersDark ? "dark" : "light"));
    document.querySelectorAll("[data-shell-action='theme']").forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(document.body.classList.contains("dark-mode") ? "light" : "dark");
      });
    });
  }

  function wireShellSearch() {
    const input = document.querySelector("#shellSearch");
    const panel = document.querySelector("#shellSearchResults");
    if (!input || !panel) return;
    const shell = input.closest(".search-shell");
    const syncShell = () => {
      const hasValue = Boolean(input.value.trim());
      shell?.classList.toggle("has-value", hasValue);
      shell?.classList.toggle("is-expanded", hasValue || document.activeElement === input);
    };
    input.addEventListener("focus", syncShell);
    input.addEventListener("blur", () => {
      window.setTimeout(syncShell, 120);
    });
    input.addEventListener("input", () => {
      syncShell();
      const rawQuery = input.value.trim();
      const query = normalise(rawQuery);
      if (!query) {
        panel.classList.remove("active");
        panel.innerHTML = "";
        return;
      }
      const data = window.CHEMVAULT_DATA;
      const research = window.CHEMVAULT_RESEARCH;
      const dossiers = window.CHEMVAULT_DOSSIERS;
      const methods = window.CHEMVAULT_METHODS;
      const spectroscopy = window.CHEMVAULT_SPECTROSCOPY;
      const materials = window.CHEMVAULT_MATERIALS;
      const external = window.CHEMVAULT_EXTERNAL;
      const records = window.CHEMVAULT_RECORDS;
      const localHits = [
        ...(records?.buildRecords ? records.buildRecords({ includeImported: true }).map((item) => ({
          type: item.typeLabel || item.type,
          title: item.title,
          body: item.body || item.subtitle || "",
          href: item.external ? item.href : records.recordUrl(item.type, item.id),
          external: item.external,
          imageUrl: item.imageUrl || item.raw?.imageUrl || "",
          text: item.searchText
        })) : [
          ...(data?.reactionSystems || []).map((item) => ({ type: "Reaction", title: item.name, body: item.className, href: `workbench.html?id=${encodeURIComponent(item.id)}`, text: [item.name, item.className, item.domain, ...(item.conditions || []), ...(item.readouts || []), ...(item.limitations || [])].join(" ") })),
          ...(data?.reactants || []).map((item) => ({ type: "Reactant", title: item.name, body: item.className, href: `workbench.html?q=${encodeURIComponent(item.name)}`, text: [item.name, item.className, ...(item.functionalGroups || []), ...(item.compatibleMethods || []), ...(item.constraints || [])].join(" ") })),
          ...(data?.reagents || []).map((item) => ({ type: "Reagent", title: `${item.formula} · ${item.name}`, body: item.focus, href: `reagents.html?id=${encodeURIComponent(item.id)}`, text: [item.formula, item.name, item.focus, item.category, ...item.tags].join(" ") })),
          ...(data?.compounds || []).map((item) => ({ type: "Compound", title: `${item.formula} · ${item.name}`, body: item.summary, href: `search.html?q=${encodeURIComponent(item.name)}`, text: [item.formula, item.name, item.family, item.cas, item.summary, ...(item.synonyms || []), ...(item.tags || [])].join(" ") })),
          ...(research?.caseStudies || []).map((item) => ({ type: "Case", title: item.title, body: item.question, href: `research.html?case=${encodeURIComponent(item.id)}`, text: [item.title, item.discipline, item.question, item.thesis].join(" ") })),
          ...(dossiers?.dossiers || []).map((item) => ({ type: "Dossier", title: item.title, body: item.abstract, href: `dossiers.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.field, item.status, item.abstract, ...item.keywords, ...item.claims].join(" ") })),
          ...(methods?.protocols || []).map((item) => ({ type: "Method", title: item.title, body: item.summary, href: `methods.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.domain, item.level, item.summary, ...item.inputs, ...item.outputs].join(" ") })),
          ...(spectroscopy?.cases || []).map((item) => ({ type: "Spectroscopy", title: item.title, body: item.question, href: `spectroscopy.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.family, item.question, item.conclusion, ...item.signals.flatMap((signal) => [signal.technique, signal.signal, signal.interpretation])].join(" ") })),
          ...(materials?.materials || []).map((item) => ({ type: "Material", title: item.name, body: item.synthesis, href: `materials.html?id=${encodeURIComponent(item.id)}`, text: [item.name, item.family, item.formula, item.synthesis, ...item.applications, ...item.properties, ...item.characterization].join(" ") })),
          ...(data?.routes || []).map((item) => ({ type: "Route", title: `${item.start} to ${item.target}`, body: item.note, href: `library.html?q=${encodeURIComponent(`${item.start} ${item.target}`)}`, text: [item.start, item.target, item.note, ...item.route].join(" ") })),
          ...(data?.mechanisms || []).map((item) => ({ type: "Mechanism", title: item.name, body: item.summary, href: `atlas.html?id=${encodeURIComponent(item.id)}`, text: [item.name, item.className, item.summary, ...item.bestFor].join(" ") })),
          ...(data?.concepts || []).map((item) => ({ type: "Concept", title: item.term, body: item.definition, href: `library.html?q=${encodeURIComponent(item.term)}`, text: [item.term, item.family, item.definition, item.equation].join(" ") })),
          ...(data?.sources || []).map((item) => ({ type: "Source", title: item.short, body: item.note, href: `library.html?q=${encodeURIComponent(item.short)}`, text: [item.title, item.short, item.family, item.note].join(" ") }))
        ])
      ].filter((item) => normalise(item.text).includes(query)).slice(0, 6);
      const externalHits = (external?.sources || []).slice(0, 4).map((source) => ({
        type: "External",
        title: `Search ${source.name}`,
        body: source.bestFor,
        href: source.queryUrl.replace("{query}", encodeURIComponent(rawQuery)),
        external: true,
        imageUrl: placeholderImage("External", source.name, source.family)
      }));
      const hits = [...localHits, ...externalHits].slice(0, 8);
      panel.classList.add("active");
      panel.innerHTML = hits.length ? hits.map((hit) => `
        <a class="search-hit" href="${hit.href}"${hit.external ? ' target="_blank" rel="noreferrer"' : ""}>
          <img src="${escapeHTML(thumbnailFor(hit))}" data-fallback-src="${escapeHTML(placeholderImage(hit.type, hit.title, hit.formula || hit.family || hit.domain || ""))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          <span>${escapeHTML(hit.type)}</span>
          <strong>${escapeHTML(hit.title)}</strong>
          <small>${escapeHTML(hit.body)}</small>
        </a>
      `).join("") : `<div class="empty-state">No matching academic record.</div>`;
      wireImageFallbacks(panel);
    });
    syncShell();
  }

  function markActivePage() {
    const current = normalisePath(location.pathname);
    document.querySelectorAll(".site-nav a").forEach((link) => {
      const target = normalisePath(new URL(link.getAttribute("href") || "", location.href).pathname);
      if (target === current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function applyTheme(theme) {
    const mode = theme === "dark" ? "dark" : "light";
    const dark = mode === "dark";
    document.documentElement.classList.toggle("dark-mode", dark);
    document.documentElement.classList.toggle("light-mode", !dark);
    document.documentElement.style.colorScheme = mode;
    document.body.classList.toggle("dark-mode", dark);
    document.body.classList.toggle("light-mode", !dark);
    localStorage.setItem("chemvault-theme", mode);
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", dark ? "#101114" : "#f5f5f7");
    document.querySelectorAll("[data-shell-action='theme']").forEach((button) => {
      button.dataset.themeState = mode;
      button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      button.setAttribute("title", dark ? "Light theme" : "Dark theme");
    });
  }

  function normalisePath(pathname) {
    let path = String(pathname || "").replace(/\/+$/, "");
    if (!path || path === "/") return "index";
    const file = path.split("/").pop() || "index";
    return file.replace(/\.html$/i, "") || "index";
  }

  function ensureDeveloperFooter() {
    if (document.querySelector(".site-footer")) return;
    const version = document.querySelector(".site-version");
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container footer-grid developer-footer-grid">
        <div class="footer-brand-block">
          <a class="footer-brand" href="/index.html">
            <span class="footer-brand-mark" aria-hidden="true"><img src="/assets/chemvault-logo-mark.png" alt="" /></span>
            <span><strong>ChemVault</strong><small>Academic chemistry knowledge portal</small></span>
          </a>
          <p>ChemVault is for educational purposes only. Data may contain errors and double-checking is required.</p>
        </div>
        <div class="footer-column">
          <span class="footer-heading">Contact</span>
          <a href="mailto:contact@chemvault.science">contact@chemvault.science</a>
          <span>Created and maintained by Ziwen M.</span>
        </div>
        <div class="footer-column footer-legal">
          <span class="footer-heading">Legal</span>
          <span>© 2026 ChemVault</span>
          <span>All rights reserved.</span>
        </div>
      </div>
    `;
    if (version) version.before(footer);
    else document.body.appendChild(footer);
  }

  function adaptShellLayout() {
    const header = document.querySelector(".site-header");
    const shell = header?.querySelector(".nav-shell");
    const brand = shell?.querySelector(".brand");
    const nav = shell?.querySelector(".site-nav");
    const actions = shell?.querySelector(".header-actions");
    if (!header || !shell || !brand || !nav || !actions) return;

    let queued = false;
    const measure = () => {
      queued = false;
      if (window.matchMedia("(max-width: 1320px)").matches) {
        header.classList.remove("nav-stacked");
        return;
      }

      const gap = parseFloat(getComputedStyle(shell).columnGap) || 0;
      const navGap = parseFloat(getComputedStyle(nav).columnGap) || 0;
      const navWidth = [...nav.querySelectorAll("a")].reduce((total, link, index) => (
        total + link.scrollWidth + (index ? navGap : 0)
      ), 0);
      const requiredWidth = brand.scrollWidth + navWidth + actions.scrollWidth + (gap * 2) + 28;
      header.classList.toggle("nav-stacked", requiredWidth > shell.clientWidth);
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("load", schedule, { once: true });
    window.addEventListener("resize", schedule);
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(schedule);
      observer.observe(shell);
      observer.observe(nav);
      observer.observe(actions);
    }
  }

  function normalise(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9.+-]/g, "");
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function thumbnailFor(hit) {
    if (hit.imageUrl) return hit.imageUrl;
    const cid = pubChemCidFrom(hit);
    if (cid && canUsePubChemName(hit.title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/PNG?record_type=2d&image_size=small`;
    }
    const type = String(hit.type || "").toLowerCase();
    if ((type.includes("compound") || type.includes("reagent")) && canUsePubChemName(hit.title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(hit.title.replace(/^.*·\s*/, ""))}/PNG?record_type=2d&image_size=small`;
    }
    return placeholderImage(hit.type, hit.title, hit.formula || hit.family || hit.domain || "");
  }

  function canUsePubChemName(title) {
    const text = String(title || "").trim();
    return Boolean(text)
      && !/\breference\b/i.test(text)
      && !/\b(panel|system|class|mixture|solution|buffer|assay|test|screen|candidate|reaction)\b/i.test(text)
      && !/^syscat-/i.test(text);
  }

  function pubChemCidFrom(hit = {}) {
    const raw = hit.raw || {};
    const cid = hit.cid || raw.cid || raw.CID;
    if (cid) return cid;
    const href = String(hit.sourceHref || raw.sourceHref || raw.href || raw.url || "");
    const match = href.match(/pubchem\.ncbi\.nlm\.nih\.gov\/compound\/(\d+)/i);
    return match?.[1] || "";
  }

  function placeholderImage(type, title, subtitle = "") {
    const palette = imagePalette(type);
    const formula = imageFormula(subtitle);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240" role="img" aria-label="${svgEsc(title)}"><rect width="360" height="240" fill="${palette.bg}"/><rect x="16" y="16" width="328" height="208" rx="18" fill="#fff" stroke="${palette.border}"/><text x="30" y="45" fill="${palette.accent}" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="800">${svgEsc(type).slice(0, 24)}</text><g transform="translate(45 68)" fill="none" stroke="${palette.line}" stroke-linecap="round" stroke-linejoin="round"><path d="M52 0 92 23v46l-40 23-40-23V23Z" stroke-width="6" opacity=".74"/><path d="M92 23h46M92 69h46M12 23l-30-18M12 69l-30 18" stroke-width="5" opacity=".46"/><circle cx="52" cy="0" r="10" fill="${palette.accent}" stroke="none"/><circle cx="92" cy="69" r="10" fill="${palette.accent2}" stroke="none"/></g><text x="210" y="100" fill="${palette.text}" font-family="SFMono-Regular,Menlo,Consolas,monospace" font-size="19" font-weight="800">${svgEsc(formula || "Chem").slice(0, 10)}</text><text x="30" y="198" fill="${palette.text}" font-family="Inter,Arial,sans-serif" font-size="21" font-weight="850">${svgEsc(title).slice(0, 24)}</text><text x="30" y="217" fill="${palette.muted}" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="650">${svgEsc(subtitle).slice(0, 32)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function imagePalette(type) {
    const key = String(type || "").toLowerCase();
    if (key.includes("material")) return { bg: "#f5f5f7", border: "#d2d2d7", line: "#64748b", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
    if (key.includes("external") || key.includes("source") || key.includes("article")) return { bg: "#f5f5f7", border: "#d2d2d7", line: "#52525b", accent: "#0071e3", accent2: "#f59e0b", text: "#1d1d1f", muted: "#6e6e73" };
    return { bg: "#f5f5f7", border: "#d2d2d7", line: "#1d1d1f", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
  }

  function imageFormula(subtitle) {
    const value = String(subtitle || "").split("·")[0].trim();
    if (!value || value.length > 18) return "";
    return /[A-Z][A-Za-z0-9()[\].+\-/ ]/.test(value) ? value : "";
  }

  function svgEsc(value) {
    return String(value || "").replace(/[&<>"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;"
    }[char]));
  }

  function wireImageFallbacks(root) {
    root.querySelectorAll("img[data-fallback-src]").forEach((image) => {
      const applyFallback = () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = "true";
        image.src = image.dataset.fallbackSrc;
      };
      image.addEventListener("error", applyFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) applyFallback();
    });
  }
}());
