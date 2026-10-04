(() => {
  const root = document.documentElement;
  const saved = localStorage.getItem("xd-theme");
  if (saved) root.dataset.theme = saved;

  document.querySelectorAll(".theme-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      localStorage.setItem("xd-theme", next);
    });
  });

  const reveal = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  };
  if ("IntersectionObserver" in window) reveal();
  else document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
})();