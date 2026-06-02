(() => {
  function applyInitialTheme() {
    const saved = localStorage.getItem("chemvault-theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const mode = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
    const dark = mode === "dark";
    document.documentElement.classList.toggle("dark-mode", dark);
    document.documentElement.classList.toggle("light-mode", !dark);
    document.documentElement.style.colorScheme = mode;
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", dark ? "#101114" : "#f5f5f7");
  }

  function boot() {
    document.documentElement.classList.add("motion-boot");
    window.CHEMVAULT_BOOT_TIMEOUT = window.setTimeout(() => {
      document.documentElement.classList.add("motion-boot-timeout");
    }, 1800);
  }

  try {
    applyInitialTheme();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const suppress = sessionStorage.getItem("chemvault-suppress-next-boot") === "true";
    if (suppress) sessionStorage.removeItem("chemvault-suppress-next-boot");
    if (!reduce && !suppress) boot();
  } catch {
    boot();
  }
})();
