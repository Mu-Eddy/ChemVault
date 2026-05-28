(() => {
  const data = window.CHEMVAULT_DATA || {};
  const research = window.CHEMVAULT_RESEARCH || {};
  const dossiers = window.CHEMVAULT_DOSSIERS || {};
  const methods = window.CHEMVAULT_METHODS || {};
  const spectroscopy = window.CHEMVAULT_SPECTROSCOPY || {};
  const materials = window.CHEMVAULT_MATERIALS || {};
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
  const encode = (value) => encodeURIComponent((value || "").trim());
  const normalise = (value) => String(value || "").toLowerCase();

  function externalUrl(source, query) {
    const encoded = encode(query);
    if (!encoded) return source.baseUrl;
    return source.queryUrl.replace("{query}", encoded);
  }

  function buildIndex() {
    const rows = [];
    (data.reagents || []).forEach((item) => rows.push({
      type: "Reagent",
      title: item.name,
      body: [item.category, item.use, item.mechanism, item.hazards, (item.conditions || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `reagents.html?id=${item.id}`
    }));
    (materials.materials || []).forEach((item) => rows.push({
      type: "Material",
      title: item.name,
      body: [item.family, item.summary, (item.applications || []).join(", "), (item.characterization || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `materials.html?id=${item.id}`
    }));
    (data.routes || []).forEach((item) => rows.push({
      type: "Route",
      title: `${item.start} to ${item.target}`,
      body: [item.note, (item.route || []).join(" -> ")].filter(Boolean).join(" | "),
      tags: item.route || [],
      href: `library.html?q=${encode(`${item.start} ${item.target}`)}`
    }));
    (data.mechanisms || []).forEach((item) => rows.push({
      type: "Mechanism",
      title: item.name,
      body: [item.summary, (item.steps || []).join(" "), (item.tags || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `atlas.html?id=${item.id}`
    }));
    (data.concepts || []).forEach((item) => rows.push({
      type: "Concept",
      title: item.term,
      body: item.definition,
      tags: item.tags || [],
      href: `library.html?q=${encode(item.term)}`
    }));
    (data.sources || []).forEach((item) => rows.push({
      type: "Source",
      title: item.short,
      body: [item.title, item.family, item.note].filter(Boolean).join(" | "),
      tags: [item.family].filter(Boolean),
      href: `library.html?q=${encode(item.short)}`
    }));
    (research.caseStudies || []).forEach((item) => rows.push({
      type: "Research case",
      title: item.title,
      body: [item.abstract, (item.techniques || []).join(", "), (item.reagents || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `research.html?case=${item.id}`
    }));
    (dossiers.dossiers || []).forEach((item) => rows.push({
      type: "Dossier",
      title: item.title,
      body: [item.summary, (item.highlights || []).join(" "), (item.references || []).join(" ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `dossiers.html?id=${item.id}`
    }));
    (methods.protocols || []).forEach((item) => rows.push({
      type: "Method",
      title: item.title,
      body: [item.summary, (item.workflow || []).join(" "), (item.qualityControls || []).join(" ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `methods.html?id=${item.id}`
    }));
    (spectroscopy.cases || []).forEach((item) => rows.push({
      type: "Spectroscopy",
      title: item.title,
      body: [item.summary, (item.signals || []).join(" "), (item.assignments || []).join(" ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `spectroscopy.html?id=${item.id}`
    }));
    return rows;
  }

  function score(item, query) {
    const q = normalise(query);
    const haystack = normalise(`${item.title} ${item.type} ${item.body} ${(item.tags || []).join(" ")}`);
    if (!q) return 1;
    if (!haystack.includes(q)) return 0;
    let value = 10;
    if (normalise(item.title).includes(q)) value += 12;
    if (normalise(item.type).includes(q)) value += 5;
    return value;
  }

  function renderExternal(query) {
    const panel = $("#externalSearchLinks");
    if (!panel) return;
    panel.innerHTML = external.sources.map((source) => `
      <a class="external-source-card" href="${externalUrl(source, query)}" target="_blank" rel="noreferrer">
        <span class="eyebrow">${esc(source.family)}</span>
        <strong>${esc(source.name)}</strong>
        <span>${esc(source.bestFor)}</span>
      </a>
    `).join("");
  }

  function renderLocal(query, scope = "all") {
    const panel = $("#localSearchResults");
    const summary = $("#searchSummary");
    if (!panel) return;
    const index = buildIndex();
    const rows = index
      .filter((item) => scope === "all" || item.type.toLowerCase() === scope)
      .map((item) => ({ item, score: score(item, query) }))
      .filter((row) => query ? row.score > 0 : row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .map((row) => row.item);

    if (summary) {
      const countText = rows.length === 1 ? "1 local match" : `${rows.length} local matches`;
      summary.textContent = query ? `${countText} for "${query}"` : `${countText} across the local knowledge base`;
    }

    if (!rows.length) {
      panel.innerHTML = `
        <div class="empty-state">
          <span class="eyebrow">Local database boundary</span>
          <h3>No strong local match</h3>
          <p>The query is outside the current curated ChemVault index. Use the external academic sources below for NIH/NCBI, NIST, terminology, and DOI-level discovery.</p>
        </div>
      `;
      return;
    }

    panel.innerHTML = rows.map((item) => `
      <a class="local-result-card" href="${item.href}">
        <span class="eyebrow">${esc(item.type)}</span>
        <strong>${esc(item.title)}</strong>
        <span>${esc(item.body).slice(0, 260)}${item.body.length > 260 ? "..." : ""}</span>
      </a>
    `).join("");
  }

  function runSearch() {
    const input = $("#academicSearch");
    const scope = $("#searchScope");
    const query = input ? input.value.trim() : "";
    renderLocal(query, scope ? scope.value : "all");
    renderExternal(query);
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (scope && scope.value !== "all") url.searchParams.set("scope", scope.value);
    else url.searchParams.delete("scope");
    window.history.replaceState({}, "", url);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("#academicSearchForm");
    const input = $("#academicSearch");
    const scope = $("#searchScope");
    const params = new URLSearchParams(window.location.search);
    if (input) input.value = params.get("q") || "";
    if (scope && params.get("scope")) scope.value = params.get("scope");

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        runSearch();
      });
    }
    if (scope) scope.addEventListener("change", runSearch);
    if (input) input.addEventListener("input", () => {
      window.clearTimeout(input._chemvaultTimer);
      input._chemvaultTimer = window.setTimeout(runSearch, 140);
    });
    runSearch();
  });
})();
