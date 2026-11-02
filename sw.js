// Change ce numéro à chaque mise à jour du site pour forcer le rafraîchissement
const VERSION = "v4";
const SHELL = `ml-shell-${VERSION}`;
const PDFS = "ml-pdfs";
const FILES = [
  "./", "index.html", "niveau.html", "matiere.html",
  "css/style.css", "js/app.js", "js/theme.js", "js/config.js", "admin.html", "manifest.json",
  "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)));
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

  // Liste des cours : réseau d'abord (pour voir les nouveautés), cache si hors ligne
  if (url.pathname.endsWith("data.json")) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Reste du site : cache d'abord
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});