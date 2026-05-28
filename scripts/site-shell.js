(function () {
  document.addEventListener("DOMContentLoaded", () => {
    wireShellNav();
    wireShellTheme();
    wireShellSearch();
    markActivePage();
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
    if (localStorage.getItem("chemvault-theme") === "light") {
      document.body.classList.add("light-mode");
    }
    document.querySelector("[data-shell-action='theme']")?.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
      localStorage.setItem("chemvault-theme", document.body.classList.contains("light-mode") ? "light" : "dark");
    });
  }

  function wireShellSearch() {
    const input = document.querySelector("#shellSearch");
    const panel = document.querySelector("#shellSearchResults");
    if (!input || !panel) return;
    input.addEventListener("input", () => {
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
      const localHits = [
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
      ].filter((item) => normalise(item.text).includes(query)).slice(0, 6);
      const externalHits = (external?.sources || []).slice(0, 4).map((source) => ({
        type: "External",
        title: `Search ${source.name}`,
        body: source.bestFor,
        href: source.queryUrl.replace("{query}", encodeURIComponent(rawQuery)),
        external: true
      }));
      const hits = [...localHits, ...externalHits].slice(0, 8);
      panel.classList.add("active");
      panel.innerHTML = hits.length ? hits.map((hit) => `
        <a class="search-hit" href="${hit.href}"${hit.external ? ' target="_blank" rel="noreferrer"' : ""}>
          <span>${escapeHTML(hit.type)}</span>
          <strong>${escapeHTML(hit.title)}</strong>
          <small>${escapeHTML(hit.body)}</small>
        </a>
      `).join("") : `<div class="empty-state">No matching academic record.</div>`;
    });
  }

  function markActivePage() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.toggleAttribute("aria-current", href.endsWith(current));
    });
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
}());
