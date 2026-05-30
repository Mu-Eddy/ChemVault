(() => {
  const data = window.CHEMVAULT_DATA || (window.CHEMVAULT_DATA = {});
  const research = window.CHEMVAULT_RESEARCH || {};
  const dossiers = window.CHEMVAULT_DOSSIERS || {};
  const methods = window.CHEMVAULT_METHODS || {};
  const spectroscopy = window.CHEMVAULT_SPECTROSCOPY || {};
  const materials = window.CHEMVAULT_MATERIALS || {};

  data.compounds = data.compounds || [];
  dedupeSourceArrays();

  const TARGET_LOCAL_RECORDS = 2000;
  const before = countLocalRecords();
  const needed = Math.max(0, TARGET_LOCAL_RECORDS - before);

  const entries = [];
  const families = [
    {
      key: "alkane",
      label: "Alkane",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 2}`,
      family: "Saturated hydrocarbons",
      tags: ["hydrocarbon", "alkane", "homologous series"],
      hazard: "Combustible or flammable hydrocarbon entry; exact physical-form classification must be verified against the current SDS.",
      level: "Moderate",
      disposal: "Collect as combustible or flammable organic waste according to institutional solvent-waste rules."
    },
    {
      key: "alkene",
      label: "Terminal alkene",
      start: 2,
      end: 180,
      formula: (n) => `C${n}H${2 * n}`,
      family: "Unsaturated hydrocarbons",
      tags: ["hydrocarbon", "alkene", "pi bond"],
      hazard: "Flammable or combustible unsaturated hydrocarbon; polymerization and peroxide risks depend on structure and storage.",
      level: "Moderate",
      disposal: "Collect as flammable organic waste; keep away from oxidizers and ignition sources."
    },
    {
      key: "alkyne",
      label: "Terminal alkyne",
      start: 2,
      end: 180,
      formula: (n) => `C${n}H${2 * n - 2}`,
      family: "Unsaturated hydrocarbons",
      tags: ["hydrocarbon", "alkyne", "terminal alkyne"],
      hazard: "Flammable unsaturated hydrocarbon class; terminal alkynes can form hazardous metal acetylides under unsuitable conditions.",
      level: "High",
      disposal: "Collect as hazardous organic waste and keep away from heavy-metal salts unless an approved procedure applies."
    },
    {
      key: "cycloalkane",
      label: "Cycloalkane",
      start: 3,
      end: 160,
      formula: (n) => `C${n}H${2 * n}`,
      family: "Cyclic hydrocarbons",
      tags: ["hydrocarbon", "cycloalkane", "ring"],
      hazard: "Combustible or flammable cyclic hydrocarbon; volatility and aspiration risk vary by ring size and substitution.",
      level: "Moderate",
      disposal: "Collect as hydrocarbon organic waste; do not drain-dispose."
    },
    {
      key: "primary-alcohol",
      label: "Primary alcohol",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 2}O`,
      family: "Alcohols",
      tags: ["alcohol", "oxygenate", "solvent"],
      hazard: "Flammable or combustible alcohol entry; toxicity and skin absorption vary strongly with chain length and branching.",
      level: "Moderate",
      disposal: "Collect as flammable or combustible organic waste unless local aqueous-waste policy explicitly permits another route."
    },
    {
      key: "aldehyde",
      label: "Aldehyde",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n}O`,
      family: "Aldehydes",
      tags: ["aldehyde", "carbonyl", "oxidation state"],
      hazard: "Reactive carbonyl class; many aldehydes are irritants, sensitizers or flammable liquids depending on structure.",
      level: "High",
      disposal: "Collect as reactive organic waste; segregate from strong oxidizers and bases."
    },
    {
      key: "ketone",
      label: "Ketone",
      start: 3,
      end: 180,
      formula: (n) => `C${n}H${2 * n}O`,
      family: "Ketones",
      tags: ["ketone", "carbonyl", "solvent"],
      hazard: "Flammable or combustible ketone entry; irritation and narcotic effects vary by specific compound.",
      level: "Moderate",
      disposal: "Collect as flammable organic waste and keep away from strong oxidizers."
    },
    {
      key: "carboxylic-acid",
      label: "Carboxylic acid",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n}O2`,
      family: "Carboxylic acids",
      tags: ["carboxylic acid", "acid", "carbonyl"],
      hazard: "Acidic oxygenate class; corrosivity, odor and flammability vary by chain length and concentration.",
      level: "Moderate",
      disposal: "Collect as organic acid waste or neutralize only under an approved institutional procedure."
    },
    {
      key: "ester",
      label: "Ester",
      start: 2,
      end: 180,
      formula: (n) => `C${n}H${2 * n}O2`,
      family: "Esters",
      tags: ["ester", "solvent", "carbonyl"],
      hazard: "Flammable or combustible ester class; hydrolysis and irritation hazards depend on exact ester identity.",
      level: "Moderate",
      disposal: "Collect as organic solvent waste; keep away from strong bases and oxidizers."
    },
    {
      key: "primary-amine",
      label: "Primary amine",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 3}N`,
      family: "Amines",
      tags: ["amine", "base", "nitrogen compound"],
      hazard: "Basic nitrogen compound class; many amines are corrosive, irritant, toxic or malodorous.",
      level: "High",
      disposal: "Collect as corrosive or toxic organic base waste; segregate from acids and oxidizers."
    },
    {
      key: "alkyl-chloride",
      label: "Alkyl chloride",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 1}Cl`,
      family: "Alkyl halides",
      tags: ["alkyl halide", "chloride", "substitution"],
      hazard: "Halogenated organic class; toxicity, volatility and environmental persistence require SDS-specific review.",
      level: "High",
      disposal: "Collect as halogenated hazardous organic waste; do not mix with non-halogenated solvent waste unless EHS directs otherwise."
    },
    {
      key: "alkyl-bromide",
      label: "Alkyl bromide",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 1}Br`,
      family: "Alkyl halides",
      tags: ["alkyl halide", "bromide", "substitution"],
      hazard: "Halogenated organic class; many members are lachrymators, toxicants or alkylating reagents.",
      level: "High",
      disposal: "Collect as halogenated hazardous organic waste in a compatible labelled container."
    }
  ];

  for (const family of families) {
    for (let n = family.start; n <= family.end && entries.length < needed; n += 1) {
      const name = `${family.label} C${n} reference`;
      entries.push({
        id: `syscat-${family.key}-c${n}`,
        name,
        formula: family.formula(n),
        family: family.family,
        synonyms: [`C${n} ${family.label.toLowerCase()}`, family.label.toLowerCase()],
        summary: `${name} is a systematic local ChemVault catalog entry for search coverage, class comparison and database seeding.`,
        evidenceNote: "Systematic local catalog entry. Verify exact isomer, supplier grade, SDS and primary source identifiers before laboratory use or citation.",
        tags: ["local catalog", "systematic catalog", `C${n}`, ...family.tags],
        hazardStatements: [family.hazard],
        hazardLevel: family.level,
        signalWord: family.level === "High" ? "Danger" : "Warning",
        precautionaryStatements: ["Verify current SDS before handling, storage, transport or disposal."],
        disposalMethod: family.disposal,
        safetySource: "Local systematic safety summary"
      });
    }
    if (entries.length >= needed) break;
  }

  data.compounds.push(...entries);

  window.CHEMVAULT_LOCAL_CATALOG = {
    targetRecords: TARGET_LOCAL_RECORDS,
    recordsBeforeCatalog: before,
    generatedRecords: entries.length,
    projectedRecords: before + entries.length
  };

  function countLocalRecords() {
    const seen = new Set();
    addRecords(seen, "reaction", data.reactionSystems, (item) => item.id);
    addRecords(seen, "reactant", data.reactants, (item) => item.id);
    addRecords(seen, "reagent", data.reagents, (item) => item.id);
    addRecords(seen, "compound", data.compounds, (item) => item.id);
    addRecords(seen, "material", materials.materials, (item) => item.id);
    addRecords(seen, "route", data.routes, routeId);
    addRecords(seen, "mechanism", data.mechanisms, (item) => item.id);
    addRecords(seen, "concept", data.concepts, (item) => item.id || slug(item.term));
    addRecords(seen, "source", data.sources, (item) => item.id || slug(item.short));
    addRecords(seen, "research-case", research.caseStudies, (item) => item.id);
    addRecords(seen, "dossier", dossiers.dossiers, (item) => item.id);
    addRecords(seen, "method", methods.protocols, (item) => item.id);
    addRecords(seen, "spectroscopy", spectroscopy.cases, (item) => item.id);
    return seen.size;
  }

  function addRecords(seen, type, list, getId) {
    (Array.isArray(list) ? list : []).forEach((item) => {
      const id = getId(item);
      if (id) seen.add(`${type}:${id}`);
    });
  }

  function routeId(route) {
    return `route-${slug(route?.start)}-${slug(route?.target)}`;
  }

  function slug(value) {
    return String(value || "record").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function dedupeSourceArrays() {
    dedupeArray(data, "reactionSystems", (item) => item.id);
    dedupeArray(data, "reactants", (item) => item.id);
    dedupeArray(data, "reagents", (item) => item.id);
    dedupeArray(data, "compounds", (item) => item.id);
    dedupeArray(materials, "materials", (item) => item.id);
    dedupeArray(data, "routes", routeId);
    dedupeArray(data, "mechanisms", (item) => item.id);
    dedupeArray(data, "concepts", (item) => item.id || slug(item.term));
    dedupeArray(data, "sources", (item) => item.id || slug(item.short));
    dedupeArray(research, "caseStudies", (item) => item.id);
    dedupeArray(dossiers, "dossiers", (item) => item.id);
    dedupeArray(methods, "protocols", (item) => item.id);
    dedupeArray(spectroscopy, "cases", (item) => item.id);
  }

  function dedupeArray(owner, key, getId) {
    if (!Array.isArray(owner[key])) return;
    const seen = new Set();
    owner[key] = owner[key].filter((item) => {
      const id = getId(item);
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
})();
