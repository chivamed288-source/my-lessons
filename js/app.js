// Fonctions partagées par toutes les pages
const params = new URLSearchParams(location.search);

async function loadData() {
  const res = await fetch("data/data.json");
  if (!res.ok) throw new Error("Impossible de charger les cours");
  return res.json();
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

function isNew(dateStr) {
  if (!dateStr) return false;
  return (Date.now() - new Date(dateStr).getTime()) < 14 * 24 * 3600 * 1000;
}

function showError(msg) {
  document.querySelector("main").append(el("p", { class: "empty" }, msg));
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}