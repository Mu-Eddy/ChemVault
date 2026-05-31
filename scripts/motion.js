(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealSelector = [
    ".page-hero",
    ".home-hero-copy",
    ".home-search-card",
    ".home-status-panel",
    ".section-heading",
    ".portal-card",
    ".page-panel",
    ".page-index-card",
    ".data-window",
    ".detail-card",
    ".compare-card",
    ".table-card",
    ".calculator-shell",
    ".quiz-card",
    ".notes-panel",
    ".safety-section",
    ".local-result-card",
    ".external-source-card",
    ".gateway-card",
    ".list-button",
    ".search-hit",
    ".metric-strip > div",
    ".home-metric-grid > div",
    ".command-grid > div"
  ].join(",");
  const rippleSelector = [
    "button",
    ".primary-button",
    ".secondary-button",
    ".small-button",
    ".text-button",
    ".icon-button",
    ".portal-card",
    ".list-button",
    ".search-hit",
    ".local-result-card",
    ".external-source-card",
    ".gateway-card"
  ].join(",");

  let overlay;
  let revealObserver;
  let mutationObserver;
  let isNavigating = false;

  window.CHEMVAULT_MOTION = {
    showNavigation,
    hideNavigation,
    navigate,
    refresh: () => prepareReveal(document)
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.add("motion-available");
    ensureOverlay();
    wireNavigation();
    wireRipples();
    wireReveal();
    requestAnimationFrame(() => {
      document.body.classList.add("page-ready");
      hideNavigation();
    });
  });

  window.addEventListener("pageshow", () => {
    isNavigating = false;
    document.body.classList.remove("page-is-leaving");
    hideNavigation();
  });

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "page-transition";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="page-transition__panel" role="status" aria-live="polite">
        <span class="page-transition__mark" aria-hidden="true"></span>
        <span class="page-transition__copy">Loading workspace</span>
        <span class="page-transition__rail" aria-hidden="true"></span>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function wireNavigation() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest("a[href]");
      if (!link || !shouldTransition(link, event)) return;

      event.preventDefault();
      const label = link.textContent?.trim() || "Loading workspace";
      navigate(link.href, label);
    });
  }

  function shouldTransition(link, event) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download") || link.dataset.noTransition === "true") return false;

    const rawHref = link.getAttribute("href") || "";
    if (!rawHref || rawHref.startsWith("#")) return false;
    if (/^(mailto|tel|javascript):/i.test(rawHref)) return false;

    const url = new URL(rawHref, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;
    return true;
  }

  function navigate(href, label = "Loading workspace") {
    if (isNavigating) return;
    isNavigating = true;
    showNavigation(label);

    const go = () => {
      window.location.href = href;
    };

    if (reduceMotion.matches) {
      go();
      return;
    }

    window.setTimeout(go, 220);
  }

  function showNavigation(label = "Loading workspace") {
    ensureOverlay();
    const copy = overlay.querySelector(".page-transition__copy");
    if (copy && label) copy.textContent = label.length > 34 ? "Loading workspace" : label;
    document.body.classList.add("page-is-leaving");
    overlay.classList.add("is-active");
  }

  function hideNavigation() {
    overlay?.classList.remove("is-active");
  }

  function wireReveal() {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08
    });

    prepareReveal(document);
    mutationObserver = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.addedNodes.length)) return;
      window.requestAnimationFrame(() => prepareReveal(document));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function prepareReveal(root) {
    if (reduceMotion.matches || !revealObserver) return;
    const nodes = root.querySelectorAll(revealSelector);
    nodes.forEach((node, index) => {
      if (node.dataset.motionBound === "true") return;
      if (node.closest(".page-transition")) return;
      node.dataset.motionBound = "true";
      node.style.setProperty("--motion-order", String(index % 8));
      revealObserver.observe(node);
    });
  }

  function wireRipples() {
    if (reduceMotion.matches) return;

    document.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest(rippleSelector);
      if (!control || control.closest(".page-transition")) return;
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) return;

      const rect = control.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.8;
      const ripple = document.createElement("span");
      ripple.className = "motion-ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      control.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    });
  }
})();
