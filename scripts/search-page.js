(() => {
  const data = window.CHEMVAULT_DATA || {};
  const research = window.CHEMVAULT_RESEARCH || {};
  const dossiers = window.CHEMVAULT_DOSSIERS || {};
  const methods = window.CHEMVAULT_METHODS || {};
  const spectroscopy = window.CHEMVAULT_SPECTROSCOPY || {};
  const materials = window.CHEMVAULT_MATERIALS || {};
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const importedStoreKey = "chemvault-imported-records";
  const liveCache = new Map();
  let liveController = null;
  let latestLiveCandidates = [];
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
    getImportedRecords().forEach((item) => rows.push(item));
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
      return 0;
    }

    panel.innerHTML = rows.map((item) => `
      <a class="local-result-card" href="${item.href}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
        <span class="eyebrow">${esc(item.type)}</span>
        <strong>${esc(item.title)}</strong>
        <span>${esc(item.body).slice(0, 260)}${item.body.length > 260 ? "..." : ""}</span>
      </a>
    `).join("");
    return rows.length;
  }

  function runSearch() {
    const input = $("#academicSearch");
    const scope = $("#searchScope");
    const query = input ? input.value.trim() : "";
    const localCount = renderLocal(query, scope ? scope.value : "all");
    renderExternal(query);
    runLiveEnrichment(query, localCount);
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (scope && scope.value !== "all") url.searchParams.set("scope", scope.value);
    else url.searchParams.delete("scope");
    window.history.replaceState({}, "", url);
  }

  async function runLiveEnrichment(query, localCount) {
    const status = $("#liveEnrichmentStatus");
    const panel = $("#liveEnrichmentResults");
    if (!status || !panel) return;

    if (liveController) liveController.abort();
    latestLiveCandidates = [];
    if (!query || query.length < 3) {
      status.textContent = "Enter at least three characters to request NIH and PubChem enrichment.";
      panel.innerHTML = "";
      renderImportedRecords();
      return;
    }

    const cacheKey = normalise(query);
    if (liveCache.has(cacheKey)) {
      renderLiveResults(query, localCount, liveCache.get(cacheKey));
      return;
    }

    liveController = new AbortController();
    status.textContent = localCount
      ? "Local records found. Fetching external metadata for stronger scholarly context..."
      : "No strong local record. Searching NIH/NLM and PubChem public metadata...";
    panel.innerHTML = `<div class="empty-state">Requesting PubChem compound data and PubMed article metadata...</div>`;

    try {
      const [compoundResult, literatureResult] = await Promise.allSettled([
        fetchPubChem(query, liveController.signal),
        fetchPubMed(query, liveController.signal)
      ]);
      if (compoundResult.status === "rejected" && literatureResult.status === "rejected") {
        throw compoundResult.reason;
      }
      const compound = compoundResult.status === "fulfilled" ? compoundResult.value : null;
      const literature = literatureResult.status === "fulfilled" ? literatureResult.value : [];
      const result = { compound, literature };
      liveCache.set(cacheKey, result);
      renderLiveResults(query, localCount, result);
    } catch (error) {
      if (error.name === "AbortError") return;
      status.textContent = "External enrichment is temporarily unavailable.";
      panel.innerHTML = `<div class="empty-state">The local page remains usable. Continue with the source links below if NIH/PubChem rate limits or network policy block live retrieval.</div>`;
    }
  }

  async function fetchPubChem(query, signal) {
    const propertyList = [
      "Title",
      "MolecularFormula",
      "MolecularWeight",
      "IUPACName",
      "CanonicalSMILES",
      "ConnectivitySMILES",
      "IsomericSMILES",
      "InChIKey",
      "XLogP",
      "TPSA",
      "HBondDonorCount",
      "HBondAcceptorCount",
      "RotatableBondCount",
      "ExactMass"
    ].join(",");
    const name = encodeURIComponent(query);
    const propertiesUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/${propertyList}/JSON`;
    const properties = await fetchJSON(propertiesUrl, signal, true);
    const compound = properties?.PropertyTable?.Properties?.[0];
    if (!compound?.CID) return null;

    const [descriptionResult, synonymResult] = await Promise.allSettled([
      fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.CID}/description/JSON`, signal, true),
      fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.CID}/synonyms/JSON`, signal, true)
    ]);

    const description = descriptionResult.status === "fulfilled"
      ? descriptionResult.value?.InformationList?.Information?.[0]?.Description
      : "";
    const synonyms = synonymResult.status === "fulfilled"
      ? synonymResult.value?.InformationList?.Information?.[0]?.Synonym?.slice(0, 8) || []
      : [];

    return {
      source: "PubChem",
      cid: compound.CID,
      title: compound.Title || query,
      formula: compound.MolecularFormula,
      weight: compound.MolecularWeight,
      iupac: compound.IUPACName,
      smiles: compound.CanonicalSMILES || compound.ConnectivitySMILES || compound.IsomericSMILES || compound.SMILES,
      inchikey: compound.InChIKey,
      exactMass: compound.ExactMass,
      xlogp: compound.XLogP,
      tpsa: compound.TPSA,
      donors: compound.HBondDonorCount,
      acceptors: compound.HBondAcceptorCount,
      rotatable: compound.RotatableBondCount,
      description,
      synonyms,
      href: `https://pubchem.ncbi.nlm.nih.gov/compound/${compound.CID}`
    };
  }

  async function fetchPubMed(query, signal) {
    const term = encode(query);
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmode=json&retmax=5&sort=relevance&tool=ChemVault`;
    const search = await fetchJSON(searchUrl, signal, false);
    const ids = search?.esearchresult?.idlist || [];
    if (!ids.length) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json&tool=ChemVault`;
    const summary = await fetchJSON(summaryUrl, signal, false);
    return ids.map((id) => {
      const item = summary?.result?.[id] || {};
      const doi = (item.articleids || []).find((articleId) => articleId.idtype === "doi")?.value;
      return {
        source: "PubMed",
        pmid: id,
        title: item.title || `PubMed record ${id}`,
        journal: item.fulljournalname || item.source || "PubMed",
        date: item.pubdate || item.epubdate || "",
        authors: (item.authors || []).slice(0, 4).map((author) => author.name).filter(Boolean),
        doi,
        href: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    });
  }

  async function fetchJSON(url, signal, allowNotFound) {
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      if (allowNotFound && response.status === 404) return null;
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  }

  function renderLiveResults(query, localCount, result) {
    const status = $("#liveEnrichmentStatus");
    const panel = $("#liveEnrichmentResults");
    const cards = [];
    latestLiveCandidates = [];

    if (result.compound) {
      const compound = result.compound;
      latestLiveCandidates.push(toImportedCompound(compound, query));
      cards.push(`
        <article class="live-card live-card-wide">
          <div class="live-card-head">
            <span class="eyebrow">PubChem compound import</span>
            <a href="${compound.href}" target="_blank" rel="noreferrer">CID ${esc(compound.cid)}</a>
          </div>
          <h3>${esc(compound.title)}</h3>
          <div class="compound-property-grid">
            ${property("Formula", compound.formula)}
            ${property("Molecular weight", compound.weight)}
            ${property("Exact mass", compound.exactMass)}
            ${property("XLogP", compound.xlogp)}
            ${property("TPSA", compound.tpsa)}
            ${property("H donors", compound.donors)}
            ${property("H acceptors", compound.acceptors)}
            ${property("Rotatable bonds", compound.rotatable)}
          </div>
          ${compound.iupac ? `<p><strong>IUPAC:</strong> ${esc(compound.iupac)}</p>` : ""}
          ${compound.smiles ? `<p><strong>Canonical SMILES:</strong> <code>${esc(compound.smiles)}</code></p>` : ""}
          ${compound.description ? `<p>${esc(compound.description).slice(0, 420)}${compound.description.length > 420 ? "..." : ""}</p>` : ""}
          ${compound.synonyms.length ? `<div class="tag-row">${compound.synonyms.map((item) => `<span class="tag">${esc(item)}</span>`).join("")}</div>` : ""}
          <button class="secondary-button" type="button" data-import-external="0">Save compound to local session</button>
        </article>
      `);
    }

    (result.literature || []).forEach((article) => {
      const index = latestLiveCandidates.push(toImportedArticle(article, query)) - 1;
      cards.push(`
        <article class="live-card">
          <div class="live-card-head">
            <span class="eyebrow">PubMed article metadata</span>
            <a href="${article.href}" target="_blank" rel="noreferrer">PMID ${esc(article.pmid)}</a>
          </div>
          <h3>${esc(article.title)}</h3>
          <p>${esc(article.journal)}${article.date ? ` · ${esc(article.date)}` : ""}</p>
          ${article.authors.length ? `<p><strong>Authors:</strong> ${esc(article.authors.join(", "))}</p>` : ""}
          ${article.doi ? `<p><strong>DOI:</strong> ${esc(article.doi)}</p>` : ""}
          <button class="secondary-button" type="button" data-import-external="${index}">Save article to local session</button>
        </article>
      `);
    });

    const count = cards.length;
    status.textContent = count
      ? `${count} external records rendered for "${query}". ${localCount ? "Use them to extend the local context." : "These records fill the local database gap for this query."}`
      : `No PubChem compound or PubMed article metadata returned for "${query}". Use the outbound database links below.`;
    panel.innerHTML = cards.length ? cards.join("") : `<div class="empty-state">No external metadata was returned for this query.</div>`;
    wireImportButtons();
    renderImportedRecords();
  }

  function property(label, value) {
    if (value === undefined || value === null || value === "") return "";
    return `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  function toImportedCompound(compound, query) {
    return {
      id: `pubchem-${compound.cid}`,
      type: "Imported compound",
      title: compound.title,
      body: [
        "PubChem",
        compound.formula,
        compound.weight ? `${compound.weight} g/mol` : "",
        compound.iupac,
        compound.description
      ].filter(Boolean).join(" | "),
      tags: [query, "PubChem", compound.formula, compound.inchikey].filter(Boolean),
      href: compound.href,
      external: true,
      importedAt: new Date().toISOString()
    };
  }

  function toImportedArticle(article, query) {
    return {
      id: `pubmed-${article.pmid}`,
      type: "Imported article",
      title: article.title,
      body: [
        "PubMed",
        article.journal,
        article.date,
        article.authors.join(", "),
        article.doi ? `DOI ${article.doi}` : ""
      ].filter(Boolean).join(" | "),
      tags: [query, "PubMed", article.pmid, article.doi].filter(Boolean),
      href: article.href,
      external: true,
      importedAt: new Date().toISOString()
    };
  }

  function wireImportButtons() {
    document.querySelectorAll("[data-import-external]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = latestLiveCandidates[Number(button.dataset.importExternal)];
        if (!item) return;
        saveImportedRecord(item);
        button.textContent = "Saved to local session";
      });
    });
  }

  function getImportedRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(importedStoreKey) || "[]");
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
  }

  function saveImportedRecord(item) {
    const records = getImportedRecords();
    const next = [item, ...records.filter((record) => record.id !== item.id)].slice(0, 40);
    try {
      localStorage.setItem(importedStoreKey, JSON.stringify(next));
    } catch {
      return;
    }
    renderImportedRecords();
    renderLocal($("#academicSearch")?.value.trim() || "", $("#searchScope")?.value || "all");
  }

  function renderImportedRecords() {
    const panel = $("#savedExternalRecords");
    if (!panel) return;
    const records = getImportedRecords();
    if (!records.length) {
      panel.innerHTML = "";
      return;
    }
    panel.innerHTML = `
      <div class="library-toolbar">
        <span class="label">Session imports</span>
        <strong>${records.length} saved</strong>
      </div>
      <button class="small-button" type="button" data-clear-imports>Clear session imports</button>
      <div class="imported-record-list">
        ${records.slice(0, 8).map((record) => `
          <a href="${record.href}" target="_blank" rel="noreferrer">
            <span>${esc(record.type)}</span>
            <strong>${esc(record.title)}</strong>
          </a>
        `).join("")}
      </div>
    `;
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
    document.addEventListener("click", (event) => {
      const clearButton = event.target.closest("[data-clear-imports]");
      if (!clearButton) return;
      localStorage.removeItem(importedStoreKey);
      renderImportedRecords();
      runSearch();
    });

    if (input) input.addEventListener("input", () => {
      window.clearTimeout(input._chemvaultTimer);
      input._chemvaultTimer = window.setTimeout(runSearch, 750);
    });
    runSearch();
  });
})();
