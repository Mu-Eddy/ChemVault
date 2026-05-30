(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;

  function FrameworkApp() {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [payload, setPayload] = React.useState(null);
    const [query, setQuery] = React.useState("");
    const [domain, setDomain] = React.useState("all");
    const [activeView, setActiveView] = React.useState("reaction-workbench");
    const [selectedRecord, setSelectedRecord] = React.useState(null);

    React.useEffect(() => {
      fetch("../data/chemvault-data.json?v=20260542")
        .then((response) => {
          if (!response.ok) throw new Error(`Dataset request failed with ${response.status}`);
          return response.json();
        })
        .then((json) => {
          setPayload(json);
          const params = new URLSearchParams(location.search);
          setQuery(params.get("q") || "");
          setDomain(params.get("domain") || "all");
          setActiveView(params.get("view") || "reaction-workbench");
        })
        .catch((err) => setError(err.message || "Unable to load JSON dataset."))
        .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => {
      if (!payload) return;
      const url = new URL(location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      if (domain !== "all") url.searchParams.set("domain", domain);
      else url.searchParams.delete("domain");
      if (activeView !== "reaction-workbench") url.searchParams.set("view", activeView);
      else url.searchParams.delete("view");
      history.replaceState(null, "", url);
    }, [query, domain, activeView, payload]);

    if (loading) return h("div", { className: "page-panel" }, "Loading JSON chemistry dataset...");
    if (error) return h("div", { className: "page-panel" }, error);
    if (!payload) return null;

    const domains = ["all", ...new Set((payload.chem?.reactionSystems || []).map((item) => item.domain).filter(Boolean))];
    const metrics = [
      { label: "Reaction systems", value: payload.chem?.reactionSystems?.length || 0, note: "dynamic systems" },
      { label: "Reactants", value: payload.chem?.reactants?.length || 0, note: "substrate classes" },
      { label: "Reagents", value: payload.chem?.reagents?.length || 0, note: "local records" },
      { label: "Compounds", value: payload.chem?.compounds?.length || 0, note: "molecule records" },
      { label: "Materials", value: payload.materials?.materials?.length || 0, note: "materials atlas" },
      { label: "Mechanisms", value: payload.chem?.mechanisms?.length || 0, note: "mechanism nodes" }
    ];
    const sourceLinks = (payload.external?.sources || []).slice(0, 5).map((source) => {
      const term = encodeURIComponent(query || "chemistry reaction mechanism");
      return {
        name: source.name,
        href: source.queryUrl ? source.queryUrl.replace("{query}", term) : source.baseUrl
      };
    });
    const views = [
      ["reaction-workbench", "Reaction Matrix"],
      ["research-desk", "Research Desk"],
      ["dossier-system", "Dossier System"],
      ["molecule-explorer", "Molecule Explorer"],
      ["panel-ui", "Panel UI"]
    ];
    const activeComponent = {
      "reaction-workbench": h(C.ReactionWorkbench, { payload, query, domain, onSelect: setSelectedRecord }),
      "research-desk": h(C.ResearchDesk, { payload, query, onSelect: setSelectedRecord }),
      "dossier-system": h(C.DossierSystem, { payload, query, onSelect: setSelectedRecord }),
      "molecule-explorer": h(C.MoleculeExplorer, { payload, query, onSelect: setSelectedRecord }),
      "panel-ui": h(C.PanelShowcase, { payload, query, selectedRecord })
    }[activeView];

    return h(React.Fragment, null, [
      h("section", { className: "framework-control-deck", key: "controls" }, [
        h("div", { className: "framework-search-panel", key: "search" }, [
          h("label", { htmlFor: "frameworkSearch", key: "label" }, "Dynamic Search"),
          h("div", { className: "framework-search-row", key: "row" }, [
            h("input", {
              id: "frameworkSearch",
              type: "search",
              placeholder: "photoredox, diazonium, graphene, aldehyde...",
              autoComplete: "off",
              value: query,
              onChange: (event) => setQuery(event.target.value),
              key: "input"
            }),
            h("select", {
              value: domain,
              "aria-label": "Research domain",
              onChange: (event) => setDomain(event.target.value),
              key: "domain"
            }, domains.map((item) => h("option", { key: item, value: item }, item === "all" ? "All domains" : item))),
            h("button", {
              className: "small-button",
              type: "button",
              onClick: () => {
                setQuery("");
                setDomain("all");
              },
              key: "reset"
            }, "Reset")
          ])
        ]),
        h(C.MetricStrip, { metrics, key: "metrics" })
      ]),
      h("section", { className: "framework-main-grid", key: "main" }, [
        h("aside", { className: "framework-nav-panel", key: "nav" }, [
          h("span", { className: "eyebrow", key: "eyebrow" }, "component routes"),
          ...views.map(([id, label]) => h("button", {
            type: "button",
            className: activeView === id ? "active" : "",
            onClick: () => setActiveView(id),
            key: id
          }, label)),
          h("section", { className: "react-data-panel", key: "json" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "json status"),
            h("h3", { key: "title" }, `JSON ${payload.version}`),
            h("p", { key: "body" }, "Data is fetched from data/chemvault-data.json.")
          ])
        ]),
        h(React.Fragment, { key: "active" }, activeComponent),
        h("aside", { className: "framework-inspector-panel", key: "inspector" }, [
          h(C.RecordInspector, { record: selectedRecord, key: "record" }),
          h("section", { className: "react-data-panel", key: "sources" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "source handoff"),
            h("h3", { key: "title" }, "Academic Links"),
            h("div", { className: "source-action-row", key: "links" }, sourceLinks.map((source) => h("a", {
              className: "secondary-button",
              href: source.href,
              target: "_blank",
              rel: "noreferrer",
              key: source.name
            }, source.name)))
          ])
        ])
      ])
    ]);
  }

  ReactDOM.createRoot(document.getElementById("frameworkApp")).render(h(FrameworkApp));
}());
