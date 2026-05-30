(() => {
  const data = window.CHEMVAULT_DATA || {};
  const materialsData = window.CHEMVAULT_MATERIALS || {};
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };

  const $ = (selector) => document.querySelector(selector);
  const encode = (value) => encodeURIComponent((value || "").trim());
  const normalise = (value) => String(value || "").toLowerCase();

  const count = (items) => Array.isArray(items) ? items.length : 0;
  const typeKey = (record, index) => `${record.type || record.typeLabel || "record"}:${record.id || record.title || index}`;
  const compoundCategoryPatterns = {
    reactants: /\b(reactant|substrate|alkane|alkene|alkyne|cycloalkane|alcohol|aldehyde|ketone|carboxylic acid|ester|amine|alkyl halide|carbonyl|hydrocarbon|oxygenate|nitrogen compound)\b/,
    reagents: /\b(reagent|solvent|acid|base|oxidizer|catalyst|halogen|alcohol|aldehyde|ketone|ester|amine|alkyl halide|chloride|bromide|iodide|fluoride)\b/,
    materials: /\b(material|polymer|nanomaterial|oxide|salt|metal|inorganic|graphene|silica|alumina|zeolite|hydrogel|mof|alloy|ceramic)\b/,
    mechanisms: /\b(mechanism|substitution|elimination|addition|oxidation|reduction|hydrolysis|polymerization|carbonyl|alkene|alkyne|acid|base|amine|ester|halide|pi bond)\b/
  };

  function initShell() {
    const header = $(".site-header");
    const navToggle = $(".menu-toggle");
    if (header && navToggle) {
      navToggle.addEventListener("click", () => {
        const expanded = header.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", String(expanded));
      });
    }

    const themeButton = $("[data-shell-action='theme'], [data-home-action='theme']");
    document.body.classList.add("light-mode");
    localStorage.setItem("chemvault-theme", "light");

    if (themeButton) {
      themeButton.addEventListener("click", () => {
        document.body.classList.add("light-mode");
        localStorage.setItem("chemvault-theme", "light");
      });
    }

    document.querySelectorAll(".site-nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.toggleAttribute("aria-current", href.endsWith("index.html"));
    });
    adaptShellLayout();
  }

  function adaptShellLayout() {
    const header = $(".site-header");
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

  function localIndex() {
    const records = window.CHEMVAULT_RECORDS;
    if (records?.buildRecords) {
      return records.buildRecords({ includeImported: true }).map((item) => ({
        type: item.typeLabel || item.type,
        title: item.title,
        body: item.body || item.subtitle || "",
        href: item.external ? item.href : records.recordUrl(item.type, item.id),
        external: item.external,
        imageUrl: item.imageUrl || item.raw?.imageUrl || ""
      }));
    }
    const rows = [];
    (data.reagents || []).forEach((item) => rows.push({
      type: "Reagent dossier",
      title: item.name,
      body: [item.category, item.use, item.mechanism].filter(Boolean).join(" | "),
      href: `pages/reagents.html?id=${item.id}`
    }));
    (data.reactionSystems || []).forEach((item) => rows.push({
      type: "Reaction system",
      title: item.name,
      body: [item.className, item.domain, ...(item.conditions || []), ...(item.readouts || [])].filter(Boolean).join(" | "),
      href: `pages/workbench.html?id=${item.id}`
    }));
    (data.reactants || []).forEach((item) => rows.push({
      type: "Reactant class",
      title: item.name,
      body: [item.className, ...(item.functionalGroups || []), ...(item.compatibleMethods || [])].filter(Boolean).join(" | "),
      href: `pages/workbench.html?q=${encode(item.name)}`
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
    const metrics = classifiedMetrics();
    Object.entries(metrics).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    });
  }

  function rawMetrics() {
    return {
      metricSystems: count(data.reactionSystems),
      metricReactants: count(data.reactants),
      metricReagents: count(data.reagents),
      metricCompounds: count(data.compounds),
      metricMaterials: count(materialsData.materials),
      metricMechanisms: count(data.mechanisms),
      metricSources: count(external.sources)
    };
  }

  function classifiedMetrics() {
    const records = metricRecords();
    if (!records.length) return rawMetrics();

    const buckets = {
      metricSystems: new Set(),
      metricReactants: new Set(),
      metricReagents: new Set(),
      metricCompounds: new Set(),
      metricMaterials: new Set(),
      metricMechanisms: new Set()
    };

    records.forEach((record, index) => {
      const type = normalise(record.type);
      const key = typeKey(record, index);
      const text = metricText(record);
      const compound = type === "compound";

      if (type === "reaction") buckets.metricSystems.add(key);
      if (type === "reactant" || (compound && compoundCategoryPatterns.reactants.test(text))) buckets.metricReactants.add(key);
      if (type === "reagent" || (compound && compoundCategoryPatterns.reagents.test(text))) buckets.metricReagents.add(key);
      if (compound) buckets.metricCompounds.add(key);
      if (type === "material" || (compound && compoundCategoryPatterns.materials.test(text))) buckets.metricMaterials.add(key);
      if (type === "mechanism" || (compound && compoundCategoryPatterns.mechanisms.test(text))) buckets.metricMechanisms.add(key);
    });

    const fallback = rawMetrics();
    return {
      metricSystems: buckets.metricSystems.size || fallback.metricSystems,
      metricReactants: buckets.metricReactants.size || fallback.metricReactants,
      metricReagents: buckets.metricReagents.size || fallback.metricReagents,
      metricCompounds: buckets.metricCompounds.size || fallback.metricCompounds,
      metricMaterials: buckets.metricMaterials.size || fallback.metricMaterials,
      metricMechanisms: buckets.metricMechanisms.size || fallback.metricMechanisms,
      metricSources: fallback.metricSources
    };
  }

  function metricRecords() {
    const records = window.CHEMVAULT_RECORDS;
    if (!records?.buildRecords) return [];
    try {
      return records.buildRecords({ includeImported: false });
    } catch {
      return [];
    }
  }

  function metricText(record) {
    const raw = record.raw || {};
    return normalise([
      record.type,
      record.typeLabel,
      record.title,
      record.subtitle,
      record.body,
      record.domain,
      record.family,
      record.category,
      record.formula,
      record.risk,
      ...(record.tags || []),
      raw.family,
      raw.category,
      raw.summary,
      raw.evidenceNote,
      ...(raw.tags || []),
      ...(raw.synonyms || [])
    ].filter(Boolean).join(" "));
  }

  async function renderBackendStatus() {
    const label = $("#backendStatusLabel");
    const mode = $("#backendStatusMode");
    const list = $("#backendStatusList");
    const setStatus = (items, code = "local fallback") => {
      if (label) label.textContent = items[0] || "fallback local data";
      if (mode) mode.textContent = code;
      if (list) list.innerHTML = items.map((item) => `<span>${escapeHTML(item)}</span>`).join("");
    };

    setStatus(["fallback local data"], "API pending");
    try {
      const health = await window.CHEMVAULT_API?.health?.();
      if (!health) {
        setStatus(["fallback local data"], "API unavailable");
        return;
      }
      const items = [];
      if (health.backend === "d1" || health.features?.d1) items.push("D1 connected");
      else items.push("fallback local data");
      if (health.features?.academicEnrichment) items.push("academic enrichment available");
      setStatus(items, health.backend === "d1" ? "D1" : "fallback");
    } catch {
      setStatus(["fallback local data"], "API unavailable");
    }
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
    const localLinks = hits.map((item) => `
      <a class="home-quick-card" href="${item.href}">
        <img src="${escapeHTML(thumbnailFor(item))}" data-fallback-src="${escapeHTML(placeholderImage(item.type, item.title))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
        <span>${escapeHTML(item.type)}</span>
        <strong>${escapeHTML(item.title)}</strong>
      </a>
    `).join("");
    panel.innerHTML = `
      ${localLinks || `<a href="pages/search.html?q=${encode(query)}">No local preview matches. Open academic search.</a>`}
      <a href="${externalUrl(external.sources[0], query)}" target="_blank" rel="noreferrer">Continue in PubMed</a>
      <a href="${externalUrl(external.sources[1], query)}" target="_blank" rel="noreferrer">Continue in PubChem</a>
    `;
    wireImageFallbacks(panel);
  }

  function wireTopbarSearch() {
    const input = $("#shellSearch");
    const panel = $("#shellSearchResults");
    if (!input || !panel) return;
    input.addEventListener("input", () => {
      const rawQuery = input.value.trim();
      const term = normalise(rawQuery);
      if (!term) {
        panel.classList.remove("active");
        panel.innerHTML = "";
        return;
      }

      const localHits = localIndex()
        .filter((item) => normalise(`${item.title} ${item.type} ${item.body}`).includes(term))
        .slice(0, 6)
        .map((item) => ({ ...item, external: false }));
      const externalHits = (external.sources || []).slice(0, 4).map((source) => ({
        type: "External",
        title: `Search ${source.name}`,
        body: source.bestFor,
        href: externalUrl(source, rawQuery),
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
    renderBackendStatus();
    initSearch();
    wireTopbarSearch();
  });

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function thumbnailFor(item) {
    if (item.imageUrl) return item.imageUrl;
    if (/reagent|compound/i.test(item.type || "") && item.title) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(item.title.replace(/^.*·\s*/, ""))}/PNG?record_type=2d&image_size=small`;
    }
    return placeholderImage(item.type, item.title);
  }

  function placeholderImage(type, title, subtitle = "") {
    const palette = /material/i.test(type || "")
      ? ["#f5f5f7", "#86868b", "#0071e3"]
      : /external|source/i.test(type || "")
        ? ["#f5f5f7", "#0071e3", "#86868b"]
        : ["#f5f5f7", "#1d1d1f", "#0071e3"];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240"><rect width="360" height="240" fill="${palette[0]}"/><path d="M44 158 104 54l60 104H44Zm180-84h84v84h-84V74Zm-96 32h132" fill="none" stroke="${palette[1]}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".34"/><circle cx="104" cy="54" r="12" fill="${palette[2]}"/><circle cx="164" cy="158" r="12" fill="${palette[2]}"/><text x="24" y="34" fill="#1d1d1f" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="17" font-weight="700">${svgEsc(type).slice(0, 24)}</text><text x="24" y="208" fill="#1d1d1f" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="22" font-weight="800">${svgEsc(title).slice(0, 24)}</text><text x="24" y="228" fill="#6e6e73" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="13" font-weight="600">${svgEsc(subtitle).slice(0, 32)}</text></svg>`;
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
})();
