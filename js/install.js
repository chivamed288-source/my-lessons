// Bouton "Installer l'application"
// Android / PC (Chrome, Edge) : installation en un clic.
// iPhone / iPad : Apple ne permet pas d'installer par code, on montre les 2 gestes à faire.
(function () {
  var KEY = "ml_install_hidden";
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (standalone) return;                       // déjà installée
  try {
    var t = Number(localStorage.getItem(KEY));
    if (t && Date.now() - t < 7 * 24 * 3600 * 1000) return;   // fermé récemment
  } catch (e) {}

  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var deferred = null, card = null;

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function hide(remember) {
    if (card) { card.remove(); card = null; }
    if (remember) { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  }

  function showGuide() {
    var overlay = make("div", "modal");
    var box = make("div", "modal-card");
    box.append(make("h3", "", "Ajouter à l'écran d'accueil"));
    var ol = make("ol");
    ["Touche le bouton Partager (le carré avec une flèche vers le haut), en bas de Safari.",
     "Fais défiler et choisis « Sur l'écran d'accueil ».",
     "Touche « Ajouter » en haut à droite."].forEach(function (s) { ol.append(make("li", "", s)); });
    box.append(ol);
    box.append(make("p", "hint", "Si tu es dans une autre application (WhatsApp...), ouvre d'abord le lien dans Safari."));
    var ok = make("button", "btn primary", "J'ai compris");
    ok.type = "button";
    ok.addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    box.append(ok);
    overlay.append(box);
    document.body.append(overlay);
  }

  function build() {
    if (card) return;
    var h1 = document.querySelector("main h1");
    if (!h1) return;
    card = make("div", "install-card");
    var txt = make("div");
    txt.append(make("b", "", "Installer l'application"));
    txt.append(make("small", "", "Ouvre-la en un clic et lis les cours hors ligne."));
    var go = make("button", "btn primary", "Installer");
    go.type = "button";
    go.addEventListener("click", function () {
      if (deferred) {
        deferred.prompt();
        deferred.userChoice.then(function () { deferred = null; hide(false); });
      } else if (isIOS) {
        showGuide();
      }
    });
    var x = make("button", "install-x", "\u00D7");
    x.type = "button";
    x.setAttribute("aria-label", "Fermer");
    x.addEventListener("click", function () { hide(true); });
    card.append(txt, go, x);
    h1.after(card);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    build();
  });
  window.addEventListener("appinstalled", function () { hide(false); });

  if (isIOS) build();
})();