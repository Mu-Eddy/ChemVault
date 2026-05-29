(function () {
  document.addEventListener("DOMContentLoaded", () => {
    wireShellNav();
    wireShellTheme();
    wireShellSearch();
    markActivePage();
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
    document.body.classList.add("light-mode");
    localStorage.setItem("chemvault-theme", "light");
    document.querySelector("[data-shell-action='theme']")?.addEventListener("click", () => {
      document.body.classList.add("light-mode");
      localStorage.setItem("chemvault-theme", "light");
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
          <img src="${escapeHTML(thumbnailFor(hit))}" data-fallback-src="${escapeHTML(placeholderImage(hit.type, hit.title))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          <span>${escapeHTML(hit.type)}</span>
          <strong>${escapeHTML(hit.title)}</strong>
          <small>${escapeHTML(hit.body)}</small>
        </a>
      `).join("") : `<div class="empty-state">No matching academic record.</div>`;
      wireImageFallbacks(panel);
    });
  }

  function markActivePage() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const file = href.split("/").pop() || "index.html";
      link.toggleAttribute("aria-current", file === current);
    });
  }

  function ensureDeveloperFooter() {
    if (document.querySelector(".site-footer")) return;
    const version = document.querySelector(".site-version");
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container footer-grid developer-footer-grid">
        <div>
          <strong>© 2026 ChemVault. Developed by Edward Mu.</strong>
          <p>ChemVault is an independent academic chemistry portal built for local-first chemical records, research workflows, and verified academic source enrichment. Data is loaded from curated local records, Cloudflare D1, and trusted scientific sources where available.</p>
          <p>Built with HTML, CSS, JavaScript, Cloudflare Pages, Cloudflare Functions, and Cloudflare D1.</p>
        </div>
      </div>
    `;
    if (version) version.before(footer);
    else document.body.appendChild(footer);
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
    const type = String(hit.type || "").toLowerCase();
    if ((type.includes("compound") || type.includes("reagent")) && hit.title) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(hit.title.replace(/^.*·\s*/, ""))}/PNG?record_type=2d&image_size=small`;
    }
    return placeholderImage(hit.type, hit.title);
  }

  function placeholderImage(type, title, subtitle = "") {
    const palette = String(type || "").toLowerCase().includes("material")
      ? ["#f5f5f7", "#86868b", "#0071e3"]
      : String(type || "").toLowerCase().includes("external") || String(type || "").toLowerCase().includes("source")
        ? ["#f5f5f7", "#0071e3", "#86868b"]
        : ["#f5f5f7", "#1d1d1f", "#0071e3"];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240"><rect width="360" height="240" fill="${palette[0]}"/><path d="M44 158 104 54l60 104H44Zm180-84h84v84h-84V74Zm-96 32h132" fill="none" stroke="${palette[1]}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".42"/><circle cx="104" cy="54" r="12" fill="${palette[2]}"/><circle cx="164" cy="158" r="12" fill="${palette[2]}"/><text x="24" y="34" fill="#1d1d1f" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="800">${svgEsc(type).slice(0, 24)}</text><text x="24" y="208" fill="#1d1d1f" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="900">${svgEsc(title).slice(0, 24)}</text><text x="24" y="228" fill="#6e6e73" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700">${svgEsc(subtitle).slice(0, 32)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
      image.addEventListener("error", () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = "true";
        image.src = image.dataset.fallbackSrc;
      }, { once: true });
    });
  }
}());
