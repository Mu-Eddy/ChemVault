(function () {
  const defaultBase = "/api";
  const fallbackRecords = [
    {
      id: "nabh4",
      type: "reagent",
      typeLabel: "Reagent",
      title: "Sodium borohydride",
      subtitle: "NaBH4 · Carbonyl reduction",
      body: "Mild hydride donor for reducing aldehydes and ketones to alcohols in teaching-lab contexts.",
      domain: "Reduction",
      family: "Carbonyl reduction",
      risk: "standard",
      formula: "NaBH4",
      tags: ["hydride", "carbonyl", "selective", "alcohol"],
      href: "/pages/record.html?type=reagent&id=nabh4",
      sourceHref: "/pages/reagents.html?id=nabh4",
      imageUrl: placeholderImage("Reagent", "NaBH4", "Reduction")
    },
    {
      id: "graphene-oxide",
      type: "material",
      typeLabel: "Material",
      title: "Graphene oxide",
      subtitle: "oxidized graphene sheet · Carbon nanomaterial",
      body: "Oxidized graphite-derived material with oxygenated groups; evidence claims need composition and reduction history.",
      family: "Carbon nanomaterial",
      maturity: 82,
      tags: ["graphene oxide", "carbon", "dispersion", "surface chemistry"],
      href: "/pages/record.html?type=material&id=graphene-oxide",
      sourceHref: "/pages/materials.html?id=graphene-oxide",
      imageUrl: placeholderImage("Material", "Graphene oxide", "Surface chemistry")
    }
  ];
  const state = {
    records: null,
    meta: null,
    preloadPromise: null
  };

  async function request(path, options = {}) {
    const url = new URL(`${apiBase()}${path}`, window.location.origin);
    Object.entries(options.query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    const hasBody = options.body !== undefined;
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal
    });
    if (!response.ok) {
      throw new Error(`ChemVault API request failed: ${response.status}`);
    }
    return response.json();
  }

  async function health(options = {}) {
    try {
      return await request("/health", options);
    } catch (error) {
      return {
        ok: true,
        service: "chemvault-api",
        backend: "browser-fallback",
        status: "fallback local data",
        features: {
          d1: false,
          fallbackLocalData: true,
          academicEnrichment: false
        },
        warning: error.message
      };
    }
  }

  async function listRecords(params = {}, options = {}) {
    try {
      const payload = await request("/records", { ...options, query: params });
      remember(payload);
      return payload;
    } catch (error) {
      const payload = browserFallback(params, error);
      remember(payload);
      return payload;
    }
  }

  async function getRecord(type, id, options = {}) {
    try {
      return await request(`/records/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, options);
    } catch (error) {
      const record = localRecords().find((item) => item.type === type && String(item.id) === String(id)) || null;
      return {
        source: "browser-fallback",
        record,
        meta: {
          warning: error.message
        }
      };
    }
  }

  async function facets(options = {}) {
    try {
      return await request("/facets", options);
    } catch (error) {
      const tags = new Map();
      const types = new Map();
      localRecords().forEach((record) => {
        const type = record.type || "record";
        const label = record.typeLabel || type;
        const key = `${type}::${label}`;
        types.set(key, (types.get(key) || 0) + 1);
        (record.tags || []).forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1));
      });
      return {
        source: "browser-fallback",
        facets: {
          types: [...types].map(([key, count]) => {
            const [type, label] = key.split("::");
            return { type, label, count };
          }),
          tags: [...tags].map(([value, count]) => ({ value, count }))
        },
        meta: {
          warning: error.message
        }
      };
    }
  }

  async function enrichRecords(params = {}, options = {}) {
    const query = typeof params === "string" ? params : params.q || params.query || "";
    try {
      const payload = await request("/enrich", {
        ...options,
        method: "POST",
        body: {
          ...(typeof params === "object" ? params : {}),
          q: query
        }
      });
      remember(payload);
      return payload;
    } catch (error) {
      const payload = browserFallback({ q: query, limit: params.limit || 8 }, error);
      remember(payload);
      return {
        ...payload,
        meta: {
          ...payload.meta,
          status: "browser-fallback",
          stored: 0
        }
      };
    }
  }

  function preloadRecords(params = {}) {
    state.preloadPromise = state.preloadPromise || listRecords(params);
    return state.preloadPromise;
  }

  function remember(payload) {
    state.records = Array.isArray(payload.records) ? payload.records : [];
    state.meta = payload.meta || {};
    window.dispatchEvent(new CustomEvent("chemvault:api-records", { detail: payload }));
  }

  function browserFallback(params = {}, error) {
    const query = normalise(params.q || params.query || "");
    const type = String(params.type || "").trim().toLowerCase();
    const limit = clamp(Number(params.limit || 24), 1, 100);
    const offset = Math.max(0, Number(params.offset || 0));
    const rows = localRecords().filter((record) => {
      if (type && record.type !== type) return false;
      if (!query) return true;
      return normalise([
        record.type,
        record.typeLabel,
        record.title,
        record.subtitle,
        record.body,
        record.domain,
        record.family,
        record.hazardLevel,
        record.signalWord,
        ...(record.hazardStatements || []),
        record.disposalMethod,
        ...(record.tags || [])
      ].join(" ")).includes(query);
    });
    return {
      source: "browser-fallback",
      records: rows.slice(offset, offset + limit),
      meta: {
        count: rows.length,
        limit,
        offset,
        query,
        type,
        warning: error?.message || null
      }
    };
  }

  function localRecords() {
    const records = window.CHEMVAULT_RECORDS;
    if (records?.buildRecords) {
      return records.buildRecords({ includeImported: true }).map((record) => {
        const rawSource = record.raw?.source || record.raw?.raw?.source;
        return ({
          id: record.id,
          type: record.type,
          typeLabel: record.typeLabel || record.type,
          title: record.title,
          subtitle: record.subtitle || "",
          body: record.body || "",
          domain: record.domain || "",
          family: record.family || "",
          risk: record.risk || "",
          maturity: Number(record.maturity || 0),
          formula: record.formula || "",
          tags: record.tags || [],
          href: record.external ? record.href : records.recordUrl(record.type, record.id),
          sourceHref: record.sourceHref || "",
          imageUrl: record.imageUrl || record.raw?.imageUrl || placeholderImage(record.typeLabel || record.type, record.title, record.family || record.domain),
          hazardStatements: record.hazardStatements || record.raw?.hazardStatements || [],
          hazardLevel: record.hazardLevel || record.raw?.hazardLevel || "",
          signalWord: record.signalWord || record.raw?.signalWord || "",
          precautionaryStatements: record.precautionaryStatements || record.raw?.precautionaryStatements || [],
          disposalMethod: record.disposalMethod || record.raw?.disposalMethod || "",
          safetySource: record.safetySource || record.raw?.safetySource || "",
          checkStatus: record.checkStatus || record.raw?.checkStatus || (rawSource ? "accepted" : "curated"),
          checkedAt: record.checkedAt || record.raw?.checkedAt || "",
          raw: record.raw || {},
          searchText: record.searchText || ""
        });
      });
    }
    return fallbackRecords;
  }

  function apiBase() {
    return window.CHEMVAULT_API_BASE || defaultBase;
  }

  function getCachedRecords() {
    return state.records || [];
  }

  function getLastMeta() {
    return state.meta || {};
  }

  function normalise(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9.+-]/g, " ").replace(/\s+/g, " ").trim();
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, Math.trunc(value)));
  }

  function placeholderImage(type, title, subtitle = "") {
    const palette = String(type || "").toLowerCase().includes("material")
      ? ["#f5f5f7", "#86868b", "#0071e3"]
      : String(type || "").toLowerCase().includes("source")
        ? ["#f5f5f7", "#0071e3", "#86868b"]
        : ["#f5f5f7", "#1d1d1f", "#0071e3"];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="${palette[0]}"/><path d="M84 278 190 96l106 182H84Zm260-152h170v170H344V126Zm-174 44h276" fill="none" stroke="${palette[1]}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".42"/><circle cx="190" cy="96" r="20" fill="${palette[2]}"/><circle cx="296" cy="278" r="20" fill="${palette[2]}"/><circle cx="514" cy="126" r="18" fill="${palette[2]}"/><text x="42" y="58" fill="#1d1d1f" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="800">${svgEsc(type).slice(0, 34)}</text><text x="42" y="355" fill="#1d1d1f" font-family="Inter,Arial,sans-serif" font-size="36" font-weight="900">${svgEsc(title).slice(0, 28)}</text><text x="42" y="388" fill="#6e6e73" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="700">${svgEsc(subtitle).slice(0, 42)}</text></svg>`;
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

  window.CHEMVAULT_API = {
    request,
    health,
    listRecords,
    searchRecords: listRecords,
    getRecord,
    facets,
    enrichRecords,
    enrich: enrichRecords,
    preloadRecords,
    getCachedRecords,
    getLastMeta
  };
}());
