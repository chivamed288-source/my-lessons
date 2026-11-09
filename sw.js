// Change ce numéro à chaque mise à jour du site pour forcer le rafraîchissement
const VERSION = "v11";
const SHELL = `ml-shell-${VERSION}`;
const PDFS = "ml-pdfs";
const FILES = [
  "./", "index.html", "niveau.html", "matiere.html",
  "css/style.css", "js/app.js", "js/theme.js", "js/config.js", "admin.html", "manifest.json",
  "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith("ml-shell-") && k !== SHELL).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Liste des fichiers ajoutés par les chefs de classe : réseau d'abord, cache si hors ligne
  if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/v1/lessons")) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open("ml-api").then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  if (url.origin !== location.origin) return;

  // Ouverture d'un PDF (local ou Supabase) : cache d'abord, puis réseau, et on garde une copie
  if (url.pathname.endsWith("/open-pdf")) {
    let t;
    try { t = new URL(url.searchParams.get("u") || ""); } catch (err) { return; }
    const okLocal = t.origin === location.origin && t.pathname.endsWith(".pdf");
    const okRemote = t.hostname.endsWith(".supabase.co") && t.pathname.includes("/storage/v1/object/public/pdfs/");
    if (!okLocal && !okRemote) return;
    e.respondWith(
      caches.open(PDFS).then(async cache => {
        const hit = await cache.match(t.href);
        if (hit) return hit;
        try {
          const res = await fetch(t.href, { mode: "cors" });
          if (res.ok) cache.put(t.href, res.clone());
          return res;
        } catch (err) {
          return Response.redirect(t.href, 302);
        }
      })
    );
    return;
  }

  // PDF : on garde en cache après la première ouverture (utilisable hors ligne)
  if (url.pathname.endsWith(".pdf")) {
    e.respondWith(
      caches.open(PDFS).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Pages, scripts, styles, données : réseau d'abord (toujours la dernière version),
  // cache seulement si pas de connexion
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});