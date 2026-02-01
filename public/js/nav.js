document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("components/bottom-nav.html");
  const html = await res.text();

  document.body.insertAdjacentHTML("beforeend", html);

  // active menu อัตโนมัติ
  const current = location.pathname.split("/").pop();
  document.querySelectorAll(".nav-item").forEach(link => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });
});
