// Fonctions partagées par toutes les pages
const params = new URLSearchParams(location.search);

// Fichiers ajoutés par les chefs de classe (Supabase). Silencieux si pas configuré ou hors ligne.
async function fetchRemoteLessons() {
  const c = window.ML_CONFIG || {};
  if (!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(
      c.SUPABASE_URL + "/rest/v1/lessons?select=level,semester,subject,type,title,file_url,created_at&order=created_at.desc&limit=1000",
      { headers: { apikey: c.SUPABASE_ANON_KEY } }
    );
    return res.ok ? await res.json() : [];
  } catch (e) { return []; }
}

async function loadData() {
  const res = await fetch("data/data.json");
  if (!res.ok) throw new Error("Impossible de charger les cours");
  const data = await res.json();
  const remote = await fetchRemoteLessons();
  remote.forEach(r => {
    const level = data.levels.find(l => l.id === r.level);
    const sem = level && level.semesters.find(s => s.id === r.semester);
    const sub = sem && sem.subjects.find(m => m.id === r.subject);
    if (sub) sub.lessons.push({
      title: r.title, type: r.type, file: r.file_url,
      added: r.created_at || "", remote: true
    });
  });
  return data;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  children.forEach(c => node.append(c));
  return node;
}

const TYPES = [
  ["cours", "Cours"],
  ["td", "TD"],
  ["tp", "TP"],
  ["examen", "Examens"]
];

// Un fichier est "Nouveau" pendant ce nombre de jours (change ce chiffre si besoin)
const NEW_DAYS = 1;
function isNew(dateStr) {
  if (!dateStr) return false;
  return (Date.now() - new Date(dateStr).getTime()) < NEW_DAYS * 24 * 3600 * 1000;
}

function showError(msg) {
  document.querySelector("main").append(el("p", { class: "empty" }, msg));
}

// ---------- Fichiers hors ligne ----------
const PDF_CACHE = "ml-pdfs";
const absUrl = file => new URL(file, location.href).href;

// Les PDF passent par le service worker (open-pdf) pour pouvoir s'ouvrir sans internet
function pdfHref(file) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return file;
  return "open-pdf?u=" + encodeURIComponent(absUrl(file));
}
async function isSaved(file) {
  try { return !!(await (await caches.open(PDF_CACHE)).match(absUrl(file))); }
  catch (e) { return false; }
}
async function savePdf(file) {
  const cache = await caches.open(PDF_CACHE);
  const res = await fetch(absUrl(file), { mode: "cors" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  await cache.put(absUrl(file), res);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
}
async function removePdf(file) {
  try { await (await caches.open(PDF_CACHE)).delete(absUrl(file)); } catch (e) {}
}

// Bandeau "hors ligne"
function offlineNote() {
  const main = document.querySelector("main");
  if (!main) return;
  let n = document.getElementById("offnote");
  if (!navigator.onLine) {
    if (!n) main.prepend(el("p", { id: "offnote", class: "empty" }, "Mode hors ligne : seuls les fichiers enregistrés peuvent s'ouvrir."));
  } else if (n) n.remove();
}
window.addEventListener("online", offlineNote);
window.addEventListener("offline", offlineNote);
document.addEventListener("DOMContentLoaded", offlineNote);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}