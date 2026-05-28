(() => {
  const data = window.CHEMVAULT_DATA || {};
  const materialsData = window.CHEMVAULT_MATERIALS || {};
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };

  const $ = (selector) => document.querySelector(selector);
  const encode = (value) => encodeURIComponent((value || "").trim());
  const normalise = (value) => String(value || "").toLowerCase();

  const count = (items) => Array.isArray(items) ? items.length : 0;

  function initShell() {
    const header = $(".site-header");
    const navToggle = $(".menu-toggle");
    if (header && navToggle) {
      navToggle.addEventListener("click", () => {
        const expanded = header.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", String(expanded));
      });
    }

    const themeButton = $("[data-home-action='theme']");
    const savedTheme = localStorage.getItem("chemvault-theme");
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const initialTheme = savedTheme || (prefersLight ? "light" : "dark");
    document.body.classList.toggle("light-mode", initialTheme === "light");

    if (themeButton) {
      themeButton.textContent = initialTheme === "light" ? "Dark" : "Light";
      themeButton.addEventListener("click", () => {
        const current = document.body.classList.contains("light-mode") ? "dark" : "light";
        document.body.classList.toggle("light-mode", current === "light");
        localStorage.setItem("chemvault-theme", current);
        themeButton.textContent = current === "light" ? "Dark" : "Light";
      });
    }
  }

  function localIndex() {
    const rows = [];
    (data.reagents || []).forEach((item) => rows.push({
      type: "Reagent dossier",
      title: item.name,
      body: [item.category, item.use, item.mechanism].filter(Boolean).join(" | "),
      href: `pages/reagents.html?id=${item.id}`
    }));
    (data.compounds || []).forEach((item) => rows.push({
      type: "Compound record",
      title: item.name,
      body: [item.formula, item.family, item.summary, ...(item.synonyms || [])].filter(Boolean).join(" | "),
      href: `pages/search.html?q=${encode(item.name)}`
    }));
    (materialsData.materials || []).forEach((item) => rows.push({
      type: "Material profile",
      title: item.name,
      body: [item.family, item.summary, (item.applications || []).slice(0, 2).join(", ")].filter(Boolean).join(" | "),
      href: `pages/materials.html?id=${item.id}`
    }));
    (data.mechanisms || []).forEach((item) => rows.push({
      type: "Mechanism atlas",
      title: item.name,
      body: [item.summary, (item.tags || []).join(", ")].filter(Boolean).join(" | "),
      href: `pages/atlas.html?id=${item.id}`
    }));
    (data.concepts || []).forEach((item) => rows.push({
      type: "Concept note",
      title: item.term,
      body: item.definition,
      href: `pages/library.html?q=${encode(item.term)}`
    }));
    return rows;
  }

  function renderMetrics() {
    const metrics = {
      metricReagents: count(data.reagents),
      metricCompounds: count(data.compounds),
      metricMaterials: count(materialsData.materials),
      metricMechanisms: count(data.mechanisms),
      metricSources: count(external.sources)
    };
    Object.entries(metrics).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    });
  }

  function externalUrl(source, query) {
    const encoded = encode(query);
    if (!encoded) return source.baseUrl;
    return source.queryUrl.replace("{query}", encoded);
  }

  function renderGateway(query = "") {
    const gateway = $("#externalGateway");
    if (!gateway) return;
    gateway.innerHTML = external.sources.map((source) => `
      <a class="external-source-card" href="${externalUrl(source, query)}" target="_blank" rel="noreferrer">
        <span class="eyebrow">${source.owner}</span>
        <strong>${source.name}</strong>
        <span>${source.scope}</span>
      </a>
    `).join("");
  }

  function renderQuickLinks(query = "") {
    const panel = $("#homeQuickLinks");
    if (!panel) return;
    const term = normalise(query);
    if (!term) {
      panel.innerHTML = `
        <a href="pages/reagents.html">Browse reagent dossiers</a>
        <a href="pages/materials.html">Browse materials profiles</a>
        <a href="pages/search.html">Open academic search</a>
      `;
      return;
    }

    const hits = localIndex()
      .filter((item) => normalise(`${item.title} ${item.type} ${item.body}`).includes(term))
      .slice(0, 4);
    const localLinks = hits.map((item) => `<a href="${item.href}">${item.type}: ${item.title}</a>`).join("");
    panel.innerHTML = `
      ${localLinks || `<a href="pages/search.html?q=${encode(query)}">No local preview matches. Open academic search.</a>`}
      <a href="${externalUrl(external.sources[0], query)}" target="_blank" rel="noreferrer">Continue in PubMed</a>
      <a href="${externalUrl(external.sources[1], query)}" target="_blank" rel="noreferrer">Continue in PubChem</a>
    `;
  }

  function initSearch() {
    const form = $("#homeSearchForm");
    const input = $("#homeSearch");
    if (!form || !input) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("q")) {
      input.value = params.get("q");
      renderQuickLinks(input.value);
      renderGateway(input.value);
    } else {
      renderQuickLinks();
      renderGateway();
    }

    input.addEventListener("input", () => {
      renderQuickLinks(input.value);
      renderGateway(input.value);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim();
      window.location.href = query ? `pages/search.html?q=${encode(query)}` : "pages/search.html";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initShell();
    renderMetrics();
    initSearch();
  });
})();
