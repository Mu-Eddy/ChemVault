(() => {
  const api = window.CHEMVAULT_RECORDS;
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const $ = (selector) => document.querySelector(selector);
  const esc = api?.esc || ((value) => String(value || ""));
  const encode = api?.encode || encodeURIComponent;

  document.addEventListener("DOMContentLoaded", () => {
    if (!api) {
      renderMissing("Record utilities did not load.");
      return;
    }
    const params = new URLSearchParams(location.search);
    const records = api.buildRecords({ includeImported: true });
    const record = api.findRecord(params.get("type"), params.get("id"), records)
      || findByQuery(params.get("q"), records);

    if (!record) {
      renderMissing(params.get("q") || params.get("id") || "unknown record", records);
      return;
    }

    document.title = `ChemVault | ${record.title}`;
    renderRecord(record, records);
  });

  function findByQuery(query, records) {
    const term = api.compact(query || "");
    if (!term) return null;
    return records
      .map((record) => ({ record, score: record.searchText.includes(term) ? (record.title.toLowerCase().includes(term) ? 20 : 8) : 0 }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.record)[0] || null;
  }

  function renderRecord(record, records) {
    const related = api.relatedRecords(record, records, 10);
    const main = $("#recordMain");
    if (!main) return;
    main.innerHTML = `
      <section class="page-hero record-hero">
        <div class="container page-hero-grid">
          <div>
            <p class="eyebrow">${esc(record.typeLabel || record.type)} · ChemVault record</p>
            <h1>${esc(record.title)}</h1>
            ${record.subtitle ? `<p>${esc(record.subtitle)}</p>` : ""}
            <div class="hero-actions record-actions">
              ${record.sourceHref ? `<a class="primary-button" href="${record.sourceHref}">Open source page</a>` : ""}
              <a class="secondary-button" href="search.html?q=${encode(record.title)}">Search this topic</a>
              ${record.external && record.href ? `<a class="secondary-button" href="${record.href}" target="_blank" rel="noreferrer">Open external source</a>` : ""}
            </div>
          </div>
          <aside class="page-index-card record-index-card">
            <strong>Record status</strong>
            <div class="record-fact-grid">
              ${fact("Type", record.typeLabel)}
              ${fact("Domain", record.domain || record.family || record.category)}
              ${fact("Formula", record.formula)}
              ${fact("Maturity", record.maturity ? `${record.maturity}%` : "")}
              ${fact("Risk", record.risk)}
              ${fact("Version", api.version)}
            </div>
          </aside>
        </div>
      </section>

      <section class="section record-section">
        <div class="container record-layout">
          <article class="record-primary">
            <section class="record-panel">
              <div class="library-toolbar">
                <span class="label">Scholarly overview</span>
                <strong>${esc(record.typeLabel || "Record")}</strong>
              </div>
              <p class="record-lead">${esc(record.body || record.subtitle || "No summary text is available for this record.")}</p>
              ${record.tags?.length ? `<div class="tag-row">${record.tags.slice(0, 18).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>` : ""}
            </section>

            <div class="record-section-grid">
              ${(record.sections || []).filter((section) => section.items?.length).map((section) => `
                <section class="record-panel">
                  <h2>${esc(section.title)}</h2>
                  <ul class="detail-list">
                    ${section.items.map((item) => `<li>${esc(item)}</li>`).join("")}
                  </ul>
                </section>
              `).join("")}
            </div>
          </article>

          <aside class="record-secondary">
            <section class="record-panel">
              <div class="library-toolbar">
                <span class="label">Related records</span>
                <strong>${related.length} linked</strong>
              </div>
              <div class="related-record-grid">
                ${related.length ? related.map((item) => relatedCard(item)).join("") : `<div class="empty-state">No related records were scored for this item.</div>`}
              </div>
            </section>

            <section class="record-panel">
              <h2>External academic handoff</h2>
              <p class="muted">Use public scholarly databases to verify identifiers, provenance, primary literature and safety-critical claims.</p>
              <div class="source-action-row">
                ${(external.sources || []).slice(0, 6).map((source) => `
                  <a class="secondary-button" href="${externalUrl(source, record.title)}" target="_blank" rel="noreferrer">${esc(source.name)}</a>
                `).join("")}
              </div>
            </section>
          </aside>
        </div>
      </section>
    `;
  }

  function relatedCard(record) {
    return `
      <a class="related-record-card" href="${record.external ? record.href : api.recordUrl(record.type, record.id)}"${record.external ? ' target="_blank" rel="noreferrer"' : ""}>
        <span class="eyebrow">${esc(record.typeLabel || record.type)}</span>
        <strong>${esc(record.title)}</strong>
        <small>${esc(record.body || record.subtitle || "").slice(0, 150)}${(record.body || "").length > 150 ? "..." : ""}</small>
      </a>
    `;
  }

  function renderMissing(term, records = []) {
    const main = $("#recordMain");
    if (!main) return;
    const query = String(term || "").trim();
    const suggestions = query && api
      ? records
        .map((record) => ({ record, score: api.queryTokens(query).filter((token) => record.searchText.includes(token)).length }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((row) => row.record)
      : [];
    main.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-grid">
          <div>
            <p class="eyebrow">record boundary</p>
            <h1>Record not found</h1>
            <p>No exact ChemVault record was found for ${esc(query)}. Search the local index or open a related suggestion below.</p>
            <div class="hero-actions">
              <a class="primary-button" href="search.html?q=${encode(query)}">Search ChemVault</a>
              <a class="secondary-button" href="workbench.html?q=${encode(query)}">Open Workbench</a>
            </div>
          </div>
          <aside class="page-index-card">
            <strong>${suggestions.length} suggestions</strong>
            <ol>${suggestions.slice(0, 4).map((item) => `<li>${esc(item.title)}</li>`).join("") || "<li>No local suggestions</li>"}</ol>
          </aside>
        </div>
      </section>
      <section class="section">
        <div class="container related-record-grid">
          ${suggestions.map((item) => relatedCard(item)).join("")}
        </div>
      </section>
    `;
  }

  function fact(label, value) {
    return value ? `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>` : "";
  }

  function externalUrl(source, query) {
    const encoded = encode(query);
    return encoded && source.queryUrl ? source.queryUrl.replace("{query}", encoded) : source.baseUrl;
  }
})();
