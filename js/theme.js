// Mode sombre : suit le téléphone par défaut, le bouton permet de choisir
(function () {
  var KEY = "ml_theme", root = document.documentElement;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function systemDark() { return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches; }
  function current() { return saved() || (systemDark() ? "dark" : "light"); }
  function apply(t) { root.setAttribute("data-theme", t); }
  apply(current());

  document.addEventListener("DOMContentLoaded", function () {
    var b = document.createElement("button");
    b.className = "theme-btn";
    function refresh() {
      var dark = current() === "dark";
      b.textContent = dark ? "\u2600" : "\u263E";
      b.setAttribute("aria-label", dark ? "Passer en mode clair" : "Passer en mode sombre");
    }
    b.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next); refresh();
    });
    refresh();
    document.body.appendChild(b);
  });
})();