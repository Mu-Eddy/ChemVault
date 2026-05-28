(function () {
  const data = window.CHEMVAULT_DATA;
  const state = { selected: null };

  document.addEventListener("DOMContentLoaded", () => {
    if (!data) return;
    populateFilters();
    wireControls();
    renderReagentList();
    selectReagent(new URLSearchParams(location.search).get("id") || data.reagents[0].id);
  });

  function populateFilters() {
    const categories = [...new Set(data.reagents.map((item) => item.category))].sort();
    $("#reagentPageCategory").innerHTML = `<option value="all">All categories</option>${categories.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
  }

  function wireControls() {
    $("#reagentPageSearch").addEventListener("input", renderReagentList);
    $("#reagentPageCategory").addEventListener("change", renderReagentList);
    $("#reagentPageSort").addEventListener("change", renderReagentList);
  }

  function filteredReagents() {
    const query = normalise($("#reagentPageSearch").value);
    const category = $("#reagentPageCategory").value;
    const sort = $("#reagentPageSort").value;
    const items = data.reagents.filter((item) => {
      const text = normalise([item.name, item.formula, item.category, item.focus, item.scope, item.mechanism, ...item.tags, ...item.transformations].join(" "));
      return (!query || text.includes(query)) && (category === "all" || item.category === category);
    });
    return items.sort((a, b) => {
      if (sort === "risk") return a.risk.localeCompare(b.risk);
      if (sort === "category") return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });
  }

  function renderReagentList() {
    const items = filteredReagents();
    $("#reagentPageCount").textContent = `${items.length} records`;
    $("#reagentPageList").innerHTML = items.map((item) => `
      <button class="list-button${item.id === state.selected ? " active" : ""}" type="button" data-id="${item.id}">
        <span>${escapeHTML(item.category)}</span>
        <strong>${escapeHTML(item.formula)} · ${escapeHTML(item.name)}</strong>
      </button>
    `).join("");
    document.querySelectorAll("#reagentPageList [data-id]").forEach((button) => {
      button.addEventListener("click", () => selectReagent(button.dataset.id));
    });
  }

  function selectReagent(id) {
    const item = data.reagents.find((reagent) => reagent.id === id);
    if (!item) return;
    state.selected = id;
    updateQueryParam("id", id);
    $("#reagentPageDetail").innerHTML = `
      <section class="data-window">
        <span class="formula">${escapeHTML(item.formula)}</span>
        <h2>${escapeHTML(item.name)}</h2>
        <p>${escapeHTML(item.scope)}</p>
        <div class="tag-row">${item.tags.map(tag).join("")}</div>
      </section>
      <section class="data-window">
        <h3>Transformations</h3>
        <ul class="detail-list">${item.transformations.map(li).join("")}</ul>
        <h3>Conditions</h3>
        <ul class="detail-list">${item.conditions.map(li).join("")}</ul>
      </section>
      <section class="data-window">
        <h3>Mechanistic claim</h3>
        <p>${escapeHTML(item.mechanism)}</p>
        <h3>Limitations and traps</h3>
        <ul class="detail-list">${item.traps.map(li).join("")}</ul>
      </section>
      <section class="data-window">
        <h3>Academic audit</h3>
        <div class="micro-table">
          <div class="micro-row"><span>Handling profile</span><strong>${escapeHTML(item.risk)}</strong></div>
          <div class="micro-row"><span>Evidence level</span><strong>D: teaching heuristic unless procedure-specific source is added</strong></div>
          <div class="micro-row"><span>Safety note</span><strong>${escapeHTML(item.safety)}</strong></div>
        </div>
      </section>
    `;
    renderRouteNetwork(item);
    renderReagentList();
  }

  function renderRouteNetwork(item) {
    const hits = data.routes.filter((route) => route.route.join(" ").toLowerCase().includes(item.formula.toLowerCase()) || route.route.join(" ").toLowerCase().includes(item.name.toLowerCase().split(" ")[0]));
    $("#routeNetwork").innerHTML = hits.length ? hits.map((route) => `
      <article>
        <strong>${escapeHTML(route.start)} -> ${escapeHTML(route.target)}</strong>
        <p>${escapeHTML(route.route.join(" | "))}</p>
        <span>${escapeHTML(route.note)}</span>
      </article>
    `).join("") : `<div class="empty-state">No direct route map currently references this reagent.</div>`;
  }

  function tag(value) {
    return `<span class="tag">${escapeHTML(value)}</span>`;
  }

  function li(value) {
    return `<li>${escapeHTML(value)}</li>`;
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

  function $(selector) {
    return document.querySelector(selector);
  }

  function updateQueryParam(key, value) {
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    history.replaceState(null, "", url);
  }
}());
