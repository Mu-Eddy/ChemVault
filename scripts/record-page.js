(() => {
  const api = window.CHEMVAULT_RECORDS;
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const focusStoreKey = "chemvault-focus-record";
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
    const focusRecord = readFocusRecord(params.get("focus"));
    const record = focusRecord
      || api.findRecord(params.get("type"), params.get("id"), records)
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
    const image = record.imageUrl || api.recordImage(record.typeLabel || record.type, record.title, record.subtitle || record.family || record.domain || record.formula || "");
    const sourceHref = record.sourceHref || record.raw?.href || record.href || "";
    main.innerHTML = `
      <section class="page-hero record-hero">
        <div class="container page-hero-grid">
          <div>
            <p class="eyebrow">${esc(record.typeLabel || record.type)} · ${esc(sourceLabel(record))}</p>
            <h1>${esc(record.title)}</h1>
            ${record.subtitle ? `<p>${esc(record.subtitle)}</p>` : ""}
            <div class="hero-actions record-actions">
              ${sourceHref ? `<a class="primary-button" href="${esc(sourceHref)}"${/^https?:\/\//i.test(sourceHref) ? ' target="_blank" rel="noreferrer"' : ""}>Open source page</a>` : ""}
              <a class="secondary-button" href="search.html?q=${encode(record.title)}">Search this topic</a>
              ${record.external && record.href ? `<a class="secondary-button" href="${record.href}" target="_blank" rel="noreferrer">Open external source</a>` : ""}
            </div>
          </div>
          <aside class="page-index-card record-index-card">
            <img class="record-focus-image" src="${esc(image)}" data-fallback-src="${esc(api.recordImage(record.typeLabel || record.type, record.title, record.subtitle || ""))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
            <strong>Record status</strong>
            <div class="record-fact-grid">
              ${fact("Type", record.typeLabel)}
              ${fact("Source", sourceLabel(record))}
              ${fact("Domain", record.domain || record.family || record.category)}
              ${fact("Formula", record.formula)}
              ${fact("Hazard", record.hazardLevel)}
              ${fact("Signal", record.signalWord)}
              ${fact("Maturity", record.maturity ? `${record.maturity}%` : "")}
              ${fact("Risk", record.risk)}
              ${fact("Check status", record.checkStatus)}
              ${fact("Checked at", record.checkedAt)}
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

            <section class="record-panel">
              <div class="library-toolbar">
                <span class="label">Focused fields</span>
                <strong>${esc(sourceLabel(record))}</strong>
              </div>
              <div class="record-field-grid">
                ${field("title", record.title)}
                ${field("subtitle", record.subtitle)}
                ${field("type", record.typeLabel || record.type)}
                ${field("formula", record.formula)}
                ${field("tags", (record.tags || []).join(", "))}
                ${field("body", record.body)}
                ${field("hazardStatements", (record.hazardStatements || []).join(" | "))}
                ${field("hazardLevel", record.hazardLevel)}
                ${field("signalWord", record.signalWord)}
                ${field("disposalMethod", record.disposalMethod)}
                ${field("safetySource", record.safetySource)}
                ${imageField(image)}
                ${field("sourceHref", sourceHref, true)}
                ${field("checkStatus", record.checkStatus)}
                ${field("checkedAt", record.checkedAt)}
              </div>
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
    wireRecordImages(main);
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

  function readFocusRecord(focusKey) {
    if (!focusKey) return null;
    const payload = readStoredFocus(sessionStorage) || readStoredFocus(localStorage);
    if (!payload || payload.key !== focusKey || !payload.record) return null;
    return normaliseFocusRecord(payload.record);
  }

  function readStoredFocus(store) {
    try {
      return JSON.parse(store.getItem(focusStoreKey) || "null");
    } catch {
      return null;
    }
  }

  function normaliseFocusRecord(record) {
    const raw = record.raw || {};
    const type = record.recordType || record.type || "search-result";
    const typeLabel = record.typeLabel || record.type || "Search result";
    const sourceHref = record.sourceHref || raw.href || record.href || "";
    return {
      ...record,
      id: record.id || "focused-record",
      type,
      typeLabel,
      title: record.title || "Focused record",
      subtitle: record.subtitle || "",
      body: record.body || record.subtitle || "",
      tags: record.tags || [],
      formula: record.formula || raw.formula || "",
      hazardStatements: record.hazardStatements || raw.hazardStatements || [],
      hazardLevel: record.hazardLevel || raw.hazardLevel || "",
      signalWord: record.signalWord || raw.signalWord || "",
      precautionaryStatements: record.precautionaryStatements || raw.precautionaryStatements || [],
      disposalMethod: record.disposalMethod || raw.disposalMethod || "",
      safetySource: record.safetySource || raw.safetySource || "",
      sourceHref,
      href: record.href || sourceHref,
      external: /^https?:\/\//i.test(record.href || sourceHref),
      imageUrl: record.imageUrl || raw.imageUrl || "",
      dataSource: record.dataSource || raw.source || raw.raw?.source || "Session import",
      checkStatus: record.checkStatus || raw.checkStatus || (raw.source || raw.raw?.source ? "accepted" : "Not available"),
      checkedAt: record.checkedAt || raw.checkedAt || "Not available",
      sections: [
        { title: "Tags", items: record.tags || [] },
        { title: "Safety", items: [record.hazardLevel || raw.hazardLevel, ...(record.hazardStatements || raw.hazardStatements || []), record.disposalMethod || raw.disposalMethod].filter(Boolean) },
        { title: "Source metadata", items: [raw.cid || raw.raw?.cid ? `CID ${raw.cid || raw.raw?.cid}` : "", raw.pmid ? `PMID ${raw.pmid}` : "", raw.doi ? `DOI ${raw.doi}` : ""].filter(Boolean) }
      ],
      raw
    };
  }

  function sourceLabel(record) {
    return record.dataSource || record.raw?.source || record.raw?.raw?.source || (record.external ? "Session import" : "Curated");
  }

  function fact(label, value) {
    return value ? `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>` : "";
  }

  function field(label, value, link = false) {
    const text = String(value || "").trim() || "Not available";
    const content = link && /^https?:\/\//i.test(text)
      ? `<a href="${esc(text)}" target="_blank" rel="noreferrer">${esc(text)}</a>`
      : `<span>${esc(text)}</span>`;
    return `<div><strong>${esc(label)}</strong>${content}</div>`;
  }

  function imageField(value) {
    const text = String(value || "").trim();
    if (!text) return field("image", "");
    if (/^data:image\//i.test(text)) {
      return `<div><strong>image</strong><span>Generated ChemVault preview</span></div>`;
    }
    if (/^https?:\/\//i.test(text)) {
      return `<div><strong>image</strong><a href="${esc(text)}" target="_blank" rel="noreferrer">Open image source</a></div>`;
    }
    return `<div><strong>image</strong><span>${esc(text)}</span></div>`;
  }

  function wireRecordImages(root) {
    root.querySelectorAll("img[data-fallback-src]").forEach((image) => {
      image.addEventListener("error", () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = "true";
        image.src = image.dataset.fallbackSrc;
      }, { once: true });
    });
  }

  function externalUrl(source, query) {
    const encoded = encode(query);
    return encoded && source.queryUrl ? source.queryUrl.replace("{query}", encoded) : source.baseUrl;
  }
})();
