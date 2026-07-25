const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const roadmapForm = document.querySelector("[data-roadmap-form]");
const formMessage = document.querySelector("[data-form-message]");
const newsletterForm = document.querySelector("[data-newsletter-form]");

const updateHeader = () => {
  header.classList.toggle("is-fixed", window.scrollY > 28);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("is-open", !open);
  document.body.classList.toggle("menu-open", !open);
});

nav.addEventListener("click", (event) => {
  if (!event.target.matches("a")) return;
  menuToggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
});

roadmapForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const market = new FormData(roadmapForm).get("market");
  formMessage.textContent = `Your ${market} market-entry roadmap is ready to begin.`;
});

newsletterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = newsletterForm.querySelector("button");
  button.textContent = "✓";
  newsletterForm.reset();
});
