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
  const compact = (value) => normalise(value).replace(/[^a-z0-9.+-]/g, " ").replace(/\s+/g, " ").trim();
  const recordApi = () => window.CHEMVAULT_RECORDS;

  function externalUrl(source, query) {
    const encoded = encode(query);
    if (!encoded) return source.baseUrl;
    return source.queryUrl.replace("{query}", encoded);
  }

  function buildIndex() {
    const api = recordApi();
    if (api?.buildRecords) {
      return api.buildRecords({ includeImported: true }).map((record) => ({
        id: record.id,
        recordType: record.type,
        type: record.typeLabel || record.type,
        title: record.title,
        body: record.body || record.subtitle || "",
        tags: record.tags || [],
        href: record.external ? record.href : api.recordUrl(record.type, record.id),
        external: record.external,
        domain: record.domain || "",
        family: record.family || "",
        risk: record.risk || "",
        maturity: Number(record.maturity || 0),
        sourceKind: record.external ? "imported" : "curated",
        searchText: record.searchText || compact(`${record.title} ${record.body} ${(record.tags || []).join(" ")}`)
      }));
    }
    const rows = [];
    getImportedRecords().forEach((item) => rows.push(item));
    (data.reactionSystems || []).forEach((item) => rows.push({
      type: "Reaction",
      title: item.name,
      body: [item.className, item.domain, (item.conditions || []).join(", "), (item.readouts || []).join(", "), (item.limitations || []).join(", ")].filter(Boolean).join(" | "),
      tags: [item.domain, ...(item.substrates || []), ...(item.reagents || []), ...(item.mechanisms || [])].filter(Boolean),
      href: `workbench.html?id=${item.id}`
    }));
    (data.reactants || []).forEach((item) => rows.push({
      type: "Reactant",
      title: item.name,
      body: [item.className, (item.functionalGroups || []).join(", "), (item.compatibleMethods || []).join(", "), (item.constraints || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.functionalGroups || [],
      href: `workbench.html?q=${encode(item.name)}`
    }));
    (data.reagents || []).forEach((item) => rows.push({
      type: "Reagent",
      title: item.name,
      body: [item.category, item.use, item.mechanism, item.hazards, (item.conditions || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `reagents.html?id=${item.id}`
    }));
    (data.compounds || []).forEach((item) => rows.push({
      type: "Compound",
      title: item.name,
      body: [item.formula, item.family, item.summary, item.evidenceNote].filter(Boolean).join(" | "),
      tags: [item.formula, item.cas, ...(item.synonyms || []), ...(item.tags || [])].filter(Boolean),
      href: `search.html?q=${encode(item.name)}`
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
    const q = compact(query);
    const haystack = item.searchText || compact(`${item.title} ${item.type} ${item.body} ${(item.tags || []).join(" ")}`);
    if (!q) return 1;
    if (!haystack.includes(q)) return 0;
    let value = 10;
    if (compact(item.title).includes(q)) value += 12;
    if (compact(item.type).includes(q)) value += 5;
    return value;
  }

  function tokenScore(item, query) {
    const tokens = compact(query).split(" ").filter((token) => token.length > 2);
    if (!tokens.length) return 1;
    const haystack = item.searchText || compact(`${item.title} ${item.type} ${item.body} ${(item.tags || []).join(" ")}`);
    const matches = tokens.filter((token) => haystack.includes(token)).length;
    return matches ? matches + score(item, query) : 0;
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

  function readAdvancedFilters() {
    return {
      facet: $("#searchFacet")?.value || "all",
      tag: $("#searchTag")?.value || "all",
      source: $("#searchSource")?.value || "all",
      minMaturity: Number($("#searchEvidence")?.value || 0),
      sort: $("#searchSort")?.value || "relevance",
      exact: Boolean($("#searchExact")?.checked)
    };
  }

  function renderAdvancedOptions(index) {
    const facet = $("#searchFacet");
    const tag = $("#searchTag");
    if (!facet || !tag) return;
    const selectedFacet = facet.value || "all";
    const selectedTag = tag.value || "all";
    const facets = unique(index.flatMap((item) => [item.domain, item.family, item.risk]).filter(Boolean))
      .sort((a, b) => a.localeCompare(b));
    const tags = unique(index.flatMap((item) => item.tags || []).filter(Boolean))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 160);
    facet.innerHTML = `<option value="all">All domains / families</option>${facets.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join("")}`;
    tag.innerHTML = `<option value="all">All tags</option>${tags.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join("")}`;
    facet.value = facets.includes(selectedFacet) ? selectedFacet : "all";
    tag.value = tags.includes(selectedTag) ? selectedTag : "all";
  }

  function passesAdvanced(item, filters, query) {
    if (filters.source !== "all" && item.sourceKind !== filters.source) return false;
    if (filters.facet !== "all") {
      const facet = compact(filters.facet);
      const values = [item.domain, item.family, item.risk, item.type, ...(item.tags || [])].map(compact);
      if (!values.includes(facet)) return false;
    }
    if (filters.tag !== "all" && !(item.tags || []).map(compact).includes(compact(filters.tag))) return false;
    if (filters.minMaturity && Number(item.maturity || 0) < filters.minMaturity) return false;
    if (filters.exact && query && !(item.searchText || "").includes(compact(query))) return false;
    return true;
  }

  function sortRows(rows, sort) {
    if (sort === "title") return rows.sort((a, b) => a.item.title.localeCompare(b.item.title));
    if (sort === "type") return rows.sort((a, b) => a.item.type.localeCompare(b.item.type) || a.item.title.localeCompare(b.item.title));
    if (sort === "evidence") return rows.sort((a, b) => Number(b.item.maturity || 0) - Number(a.item.maturity || 0) || b.score - a.score);
    return rows.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  }

  function renderLocal(query, scope = "all", filters = readAdvancedFilters()) {
    const panel = $("#localSearchResults");
    const summary = $("#searchSummary");
    if (!panel) return;
    const index = buildIndex();
    renderAdvancedOptions(index);
    const rows = sortRows(index
      .filter((item) => scope === "all" || item.recordType === scope || item.type.toLowerCase() === scope || item.type.toLowerCase().includes(scope))
      .filter((item) => passesAdvanced(item, filters, query))
      .map((item) => ({ item, score: filters.exact ? score(item, query) : tokenScore(item, query) }))
      .filter((row) => query ? row.score > 0 : row.score > 0)
    , filters.sort)
      .slice(0, 24)
      .map((row) => row.item);

    if (summary) {
      const countText = rows.length === 1 ? "1 local match" : `${rows.length} local matches`;
      const filterText = [scope !== "all" ? scope : "", filters.facet !== "all" ? filters.facet : "", filters.tag !== "all" ? filters.tag : ""].filter(Boolean).join(" · ");
      summary.textContent = `${query ? `${countText} for "${query}"` : `${countText} across the local knowledge base`}${filterText ? ` · ${filterText}` : ""}`;
    }

    if (!rows.length) {
      panel.innerHTML = `
        <div class="empty-state">
          <span class="eyebrow">Local database boundary</span>
          <h3>No strong local match</h3>
          <p>The query is outside the current curated ChemVault index. NIH/PubChem imports are displayed in the panel beside this local result window.</p>
        </div>
      `;
      return 0;
    }

    panel.innerHTML = rows.map((item) => `
      <a class="local-result-card" href="${item.href}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
        <span class="eyebrow">${esc(item.type)}</span>
        <strong>${esc(item.title)}</strong>
        <span>${esc(item.body).slice(0, 260)}${item.body.length > 260 ? "..." : ""}</span>
        <small>${[item.domain || item.family, item.maturity ? `${item.maturity}% maturity` : "", (item.tags || []).slice(0, 3).join(", ")].filter(Boolean).map(esc).join(" · ")}</small>
      </a>
    `).join("");
    return rows.length;
  }

  function runSearch() {
    const input = $("#academicSearch");
    const scope = $("#searchScope");
    const query = input ? input.value.trim() : "";
    const filters = readAdvancedFilters();
    const localCount = renderLocal(query, scope ? scope.value : "all", filters);
    renderExternal(query);
    runLiveEnrichment(query, localCount);
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (scope && scope.value !== "all") url.searchParams.set("scope", scope.value);
    else url.searchParams.delete("scope");
    if (filters.facet !== "all") url.searchParams.set("facet", filters.facet);
    else url.searchParams.delete("facet");
    if (filters.tag !== "all") url.searchParams.set("tag", filters.tag);
    else url.searchParams.delete("tag");
    if (filters.source !== "all") url.searchParams.set("source", filters.source);
    else url.searchParams.delete("source");
    if (filters.minMaturity) url.searchParams.set("maturity", String(filters.minMaturity));
    else url.searchParams.delete("maturity");
    if (filters.sort !== "relevance") url.searchParams.set("sort", filters.sort);
    else url.searchParams.delete("sort");
    if (filters.exact) url.searchParams.set("exact", "1");
    else url.searchParams.delete("exact");
    window.history.replaceState({}, "", url);
  }

  async function runLiveEnrichment(query, localCount) {
    const status = $("#liveEnrichmentStatus");
    const panel = $("#liveEnrichmentResults");
    if (!status || !panel) return;

    if (liveController) liveController.abort();
    latestLiveCandidates = [];
    toggleImportAll(false);
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
    panel.innerHTML = fallbackCards(query, "Requesting PubChem compound data and PubMed article metadata...");

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
      panel.innerHTML = fallbackCards(query, "Live import is blocked or temporarily unavailable. Use these direct NIH/PubChem links.");
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
            <span class="eyebrow">NIH / NCBI PubChem import</span>
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
          <div class="source-action-row">
            <a class="secondary-button" href="${compound.href}" target="_blank" rel="noopener noreferrer">Open NIH PubChem</a>
            <button class="secondary-button" type="button" data-import-external="0">Save compound</button>
          </div>
        </article>
      `);
    }

    (result.literature || []).forEach((article) => {
      const index = latestLiveCandidates.push(toImportedArticle(article, query)) - 1;
      cards.push(`
        <article class="live-card">
          <div class="live-card-head">
            <span class="eyebrow">NIH / NLM PubMed metadata</span>
            <a href="${article.href}" target="_blank" rel="noreferrer">PMID ${esc(article.pmid)}</a>
          </div>
          <h3>${esc(article.title)}</h3>
          <p>${esc(article.journal)}${article.date ? ` · ${esc(article.date)}` : ""}</p>
          ${article.authors.length ? `<p><strong>Authors:</strong> ${esc(article.authors.join(", "))}</p>` : ""}
          ${article.doi ? `<p><strong>DOI:</strong> ${esc(article.doi)}</p>` : ""}
          <div class="source-action-row">
            <a class="secondary-button" href="${article.href}" target="_blank" rel="noopener noreferrer">Open NIH PubMed</a>
            <button class="secondary-button" type="button" data-import-external="${index}">Save article</button>
          </div>
        </article>
      `);
    });

    const count = cards.length;
    status.textContent = count
      ? `${count} external records rendered for "${query}". ${localCount ? "Use them to extend the local context." : "These records fill the local database gap for this query."}`
      : `No PubChem compound or PubMed article metadata returned for "${query}". Use the outbound database links below.`;
    panel.innerHTML = cards.length ? cards.join("") : fallbackCards(query, "No metadata was returned. Use direct NIH/PubChem search links.");
    toggleImportAll(Boolean(latestLiveCandidates.length));
    wireImportButtons();
    renderImportedRecords();
  }

  function property(label, value) {
    if (value === undefined || value === null || value === "") return "";
    return `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  function fallbackCards(query, message) {
    const q = encode(query);
    const links = [
      ["NIH PubChem", `https://pubchem.ncbi.nlm.nih.gov/#query=${q}`, "Compound identifiers, formulae, synonyms and property records."],
      ["NIH PubMed", `https://pubmed.ncbi.nlm.nih.gov/?term=${q}`, "Biomedical and chemical literature metadata."],
      ["PubMed Central", `https://pmc.ncbi.nlm.nih.gov/?term=${q}`, "Open-access full-text records where available."],
      ["NCBI Bookshelf", `https://www.ncbi.nlm.nih.gov/books/?term=${q}`, "Reference chapters and background material."]
    ];
    return `
      <div class="empty-state">${esc(message)}</div>
      <div class="fallback-source-grid">
        ${links.map(([title, href, body]) => `
          <a class="fallback-source-card" href="${href}" target="_blank" rel="noopener noreferrer">
            <span class="eyebrow">direct external link</span>
            <strong>${esc(title)}</strong>
            <span>${esc(body)}</span>
          </a>
        `).join("")}
      </div>
    `;
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

  function toggleImportAll(show) {
    const button = document.querySelector("[data-import-all]");
    if (!button) return;
    button.hidden = !show;
    button.disabled = !show;
    button.textContent = "Save all";
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

  function saveImportedRecords(items) {
    const records = getImportedRecords();
    const merged = [...items, ...records].filter((record, index, all) => {
      return all.findIndex((item) => item.id === record.id) === index;
    }).slice(0, 60);
    try {
      localStorage.setItem(importedStoreKey, JSON.stringify(merged));
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

  function unique(values) {
    return [...new Set((values || []).filter(Boolean).map(String))];
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("#academicSearchForm");
    const input = $("#academicSearch");
    const scope = $("#searchScope");
    const params = new URLSearchParams(window.location.search);
    if (input) input.value = params.get("q") || "";
    if (scope && params.get("scope")) scope.value = params.get("scope");
    renderAdvancedOptions(buildIndex());
    if ($("#searchFacet") && params.get("facet")) $("#searchFacet").value = params.get("facet");
    if ($("#searchTag") && params.get("tag")) $("#searchTag").value = params.get("tag");
    if ($("#searchSource") && params.get("source")) $("#searchSource").value = params.get("source");
    if ($("#searchEvidence") && params.get("maturity")) $("#searchEvidence").value = params.get("maturity");
    if ($("#searchSort") && params.get("sort")) $("#searchSort").value = params.get("sort");
    if ($("#searchExact")) $("#searchExact").checked = params.get("exact") === "1";

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        runSearch();
      });
    }
    if (scope) scope.addEventListener("change", runSearch);
    ["#searchFacet", "#searchTag", "#searchSource", "#searchEvidence", "#searchSort", "#searchExact"].forEach((selector) => {
      $(selector)?.addEventListener("change", runSearch);
    });
    document.addEventListener("click", (event) => {
      const importAll = event.target.closest("[data-import-all]");
      if (importAll) {
        saveImportedRecords(latestLiveCandidates);
        importAll.textContent = "Saved";
        return;
      }
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
