(() => {
  function boot() {
    document.documentElement.classList.add("motion-boot");
    window.CHEMVAULT_BOOT_TIMEOUT = window.setTimeout(() => {
      document.documentElement.classList.add("motion-boot-timeout");
    }, 1800);
  }

  try {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const suppress = sessionStorage.getItem("chemvault-suppress-next-boot") === "true";
    if (suppress) sessionStorage.removeItem("chemvault-suppress-next-boot");
    if (!reduce && !suppress) boot();
  } catch {
    boot();
  }
})();
