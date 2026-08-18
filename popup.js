/* Payload Vault — popup logic
   Views: 'all' | 'orphans' | 'folders' | 'folder' | 'recent'
   Storage shape (chrome.storage.local):
     payloads: [{ id, label, tags: string[], value, order, tagOrder: {tag:number} }]
     folders:  { [tagLower]: { order, explicit, displayName } }
     recents:  [{ type: 'folder'|'orphans', key, ts }]   (max 10, most recent first)
     settings: { shortcutTarget: 'recent'|'folders'|'orphans'|'all' }
     pendingView: { target, ts }   (set by background.js right before opening via shortcut)
*/

// ---------- DOM ----------
const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const emptyStateEl = document.getElementById("emptyState");
const toastEl = document.getElementById("toast");
const addFolderRowEl = document.getElementById("addFolderRow");
const breadcrumbEl = document.getElementById("breadcrumb");
const breadcrumbLabelEl = document.getElementById("breadcrumbLabel");

const overlayEl = document.getElementById("formOverlay");
const formTitleEl = document.getElementById("formTitle");
const formLabelEl = document.getElementById("formLabel");
const formValueEl = document.getElementById("formValue");
const tagChipsEl = document.getElementById("tagChips");
const tagInputEl = document.getElementById("tagInput");
const tagSuggestionsEl = document.getElementById("tagSuggestions");

const folderPromptOverlayEl = document.getElementById("folderPromptOverlay");
const folderPromptTitleEl = document.getElementById("folderPromptTitle");
const folderPromptSaveEl = document.getElementById("folderPromptSave");
const folderNameInputEl = document.getElementById("folderNameInput");

const confirmOverlayEl = document.getElementById("confirmOverlay");
const confirmTitleEl = document.getElementById("confirmTitle");
const confirmMessageEl = document.getElementById("confirmMessage");

const settingsOverlayEl = document.getElementById("settingsOverlay");
const shortcutTargetSelectEl = document.getElementById("shortcutTargetSelect");

// ---------- State ----------
let payloads = [];
let folders = {};
let recents = [];
let settings = { shortcutTarget: "recent" };

let view = "all";        // 'all' | 'orphans' | 'folders' | 'folder' | 'recent'
let currentFolder = null;
let editingId = null;
let editingTags = [];
let highlightedSuggestion = -1;
let renamingFolder = null; // null = "add" mode, else old folder name being renamed
let pendingConfirmAction = null;

// Drag state
let dragSrcId = null;
let dragOverId = null;
let dragKind = null; // 'payload' | 'folder'

// ---------- Helpers ----------
function normalize(str) {
  return (str || "").toLowerCase().trim().replace(/[\s_-]+/g, "");
}

function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2));
}

async function loadAll() {
  const data = await chrome.storage.local.get(["payloads", "folders", "recents", "settings", "pendingView"]);
  payloads = data.payloads || [];
  folders = data.folders || {};
  recents = data.recents || [];
  settings = data.settings || { shortcutTarget: "recent" };

  ensureFolderRegistryUpToDate();

  // If we were opened via the Alt+Shift+F command, jump to the configured view.
  if (data.pendingView && Date.now() - data.pendingView.ts < 4000) {
    await chrome.storage.local.remove("pendingView");
    applyTarget(data.pendingView.target);
  } else {
    render();
  }
}

function applyTarget(target) {
  if (target === "folders") setView("folders");
  else if (target === "orphans") setView("orphans");
  else if (target === "all") setView("all");
  else setView("recent");
}

function ensureFolderRegistryUpToDate() {
  let nextOrder = Object.keys(folders).length
    ? Math.max(...Object.values(folders).map(f => f.order || 0)) + 1
    : 0;
  let changed = false;
  for (const p of payloads) {
    for (const t of p.tags || []) {
      if (!folders[t]) {
        folders[t] = { order: nextOrder++, explicit: false, displayName: t };
        changed = true;
      }
    }
  }
  if (changed) saveFolders();
}

function saveAll() {
  return chrome.storage.local.set({ payloads });
}
function saveFolders() {
  return chrome.storage.local.set({ folders });
}
function saveRecents() {
  return chrome.storage.local.set({ recents });
}
function saveSettings() {
  return chrome.storage.local.set({ settings });
}

function pushRecent(type, key) {
  recents = recents.filter(r => !(r.type === type && r.key === key));
  recents.unshift({ type, key, ts: Date.now() });
  recents = recents.slice(0, 10);
  saveRecents();
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

function allFolderNames() {
  // Explicit folders first (so newly created empty ones surface), then any
  // tag currently in use, sorted by stored order.
  return Object.keys(folders).sort((a, b) => (folders[a].order || 0) - (folders[b].order || 0));
}

// ---------- View switching ----------
function setView(v, folderName) {
  view = v;
  currentFolder = folderName || null;
  closeAllSuggestions();
  searchEl.value = "";

  breadcrumbEl.hidden = view === "all";
  addFolderRowEl.hidden = view !== "folders";

  if (view === "folder") {
    breadcrumbLabelEl.textContent = "#" + currentFolder;
    pushRecent("folder", currentFolder);
  } else if (view === "orphans") {
    breadcrumbLabelEl.textContent = "Orphans";
    pushRecent("orphans", "orphans");
  } else if (view === "folders") {
    breadcrumbLabelEl.textContent = "Folders";
  } else if (view === "recent") {
    breadcrumbLabelEl.textContent = "Recent";
  }

  document.getElementById("foldersBtn").classList.toggle("active", view === "folders");
  document.getElementById("orphansBtn").classList.toggle("active", view === "orphans");

  render();
}

document.getElementById("foldersBtn").addEventListener("click", () => setView("folders"));
document.getElementById("orphansBtn").addEventListener("click", () => setView("orphans"));
document.getElementById("backBtn").addEventListener("click", () => {
  if (view === "folder") setView("folders");
  else setView("all");
});
document.getElementById("recentShortcutBtn").addEventListener("click", () => setView("recent"));

// ---------- Rendering ----------
function render() {
  if (view === "folders") return renderFolders();
  if (view === "recent") return renderRecent();
  return renderPayloadList();
}

function matchesQuery(p, query) {
  if (!query) return true;
  const nq = normalize(query);
  const rawq = query.toLowerCase();
  if (p.label.toLowerCase().includes(rawq)) return true;
  if (p.value.toLowerCase().includes(rawq)) return true;
  return (p.tags || []).some(t => normalize(t).includes(nq) || t.toLowerCase().includes(rawq));
}

function renderPayloadList() {
  const query = searchEl.value.trim();
  let items = payloads.filter(p => matchesQuery(p, query));

  let sortKey;
  if (view === "folder") {
    items = items.filter(p => (p.tags || []).includes(currentFolder));
    sortKey = p => (p.tagOrder && p.tagOrder[currentFolder] != null) ? p.tagOrder[currentFolder] : Infinity;
  } else if (view === "orphans") {
    items = items.filter(p => !p.tags || p.tags.length === 0);
    sortKey = p => (p.order != null ? p.order : Infinity);
  } else {
    sortKey = p => (p.order != null ? p.order : Infinity);
  }
  items.sort((a, b) => sortKey(a) - sortKey(b) || a.label.localeCompare(b.label));

  listEl.innerHTML = "";
  emptyStateEl.hidden = items.length !== 0;
  emptyStateEl.textContent = query
    ? "No payloads match your search."
    : (view === "orphans" ? "No untagged payloads. Nice and organized!" : "No payloads yet.");

  for (const p of items) {
    listEl.appendChild(buildPayloadCard(p));
  }
}

function buildPayloadCard(p) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = p.id;
  card.draggable = false;

  const handle = buildDragHandle();
  handle.addEventListener("mousedown", () => { card.draggable = true; });
  handle.addEventListener("mouseup", () => { card.draggable = false; });

  const body = document.createElement("div");
  body.className = "card-body";

  const top = document.createElement("div");
  top.className = "card-top";

  const label = document.createElement("span");
  label.className = "card-label";
  label.textContent = p.label;

  const tagsWrap = document.createElement("div");
  tagsWrap.className = "card-tags";
  if (p.tags && p.tags.length) {
    for (const t of p.tags) {
      const tag = document.createElement("span");
      tag.className = "card-tag";
      tag.textContent = "#" + t;
      tagsWrap.appendChild(tag);
    }
  } else {
    const tag = document.createElement("span");
    tag.className = "card-tag none";
    tag.textContent = "untagged";
    tagsWrap.appendChild(tag);
  }

  top.appendChild(label);
  top.appendChild(tagsWrap);

  const value = document.createElement("div");
  value.className = "card-value";
  value.textContent = p.value;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openForm(p);
  });

  const delBtn = document.createElement("button");
  delBtn.className = "del";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    payloads = payloads.filter(x => x.id !== p.id);
    await saveAll();
    render();
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  body.appendChild(top);
  body.appendChild(value);
  body.appendChild(actions);

  card.appendChild(handle);
  card.appendChild(body);

  card.addEventListener("click", () => copyToClipboard(p.value));
  attachDragEvents(card, "payload");

  return card;
}

function buildDragHandle() {
  const handle = document.createElement("div");
  handle.className = "drag-handle";
  handle.title = "Drag to reorder";
  handle.innerHTML = '<svg viewBox="0 0 6 20" fill="currentColor"><circle cx="1.5" cy="2" r="1.5"/><circle cx="4.5" cy="2" r="1.5"/><circle cx="1.5" cy="10" r="1.5"/><circle cx="4.5" cy="10" r="1.5"/><circle cx="1.5" cy="18" r="1.5"/><circle cx="4.5" cy="18" r="1.5"/></svg>';
  return handle;
}

function renderFolders() {
  const query = searchEl.value.trim();
  const nq = normalize(query);
  let names = allFolderNames();
  if (query) names = names.filter(n => normalize(n).includes(nq));

  listEl.innerHTML = "";
  emptyStateEl.hidden = names.length !== 0;
  emptyStateEl.textContent = query ? "No folders match your search." : "No folders yet. Create one, or tag a payload.";

  for (const name of names) {
    const count = payloads.filter(p => (p.tags || []).includes(name)).length;

    const card = document.createElement("div");
    card.className = "folder-card";
    card.dataset.id = name;
    card.draggable = false;

    const handle = buildDragHandle();
    handle.addEventListener("mousedown", () => { card.draggable = true; });
    handle.addEventListener("mouseup", () => { card.draggable = false; });

    const icon = document.createElement("div");
    icon.className = "folder-icon";
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';

    const nameEl = document.createElement("span");
    nameEl.className = "folder-name";
    nameEl.textContent = "#" + name;

    const countEl = document.createElement("span");
    countEl.className = "folder-count";
    countEl.textContent = count;

    const actions = document.createElement("div");
    actions.className = "folder-actions";

    const editBtn = document.createElement("button");
    editBtn.title = "Rename folder";
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openFolderPrompt(name);
    });

    const delBtn = document.createElement("button");
    delBtn.className = "folder-del";
    delBtn.title = "Delete folder";
    delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmDeleteFolder(name, count);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(handle);
    card.appendChild(icon);
    card.appendChild(nameEl);
    card.appendChild(countEl);
    card.appendChild(actions);

    card.addEventListener("click", () => setView("folder", name));
    attachDragEvents(card, "folder");

    listEl.appendChild(card);
  }
}

function renderRecent() {
  listEl.innerHTML = "";
  emptyStateEl.hidden = recents.length !== 0;
  emptyStateEl.textContent = "Nothing viewed yet. Open a folder or Orphans to see it here.";

  for (const r of recents) {
    const item = document.createElement("div");
    item.className = "recent-item";

    const type = document.createElement("span");
    type.className = "rtype";
    type.textContent = r.type === "folder" ? "folder" : "orphans";

    const name = document.createElement("span");
    name.className = "rname";
    name.textContent = r.type === "folder" ? "#" + r.key : "Orphans";

    const when = document.createElement("span");
    when.className = "rwhen";
    when.textContent = timeAgo(r.ts);

    item.appendChild(type);
    item.appendChild(name);
    item.appendChild(when);

    item.addEventListener("click", () => {
      if (r.type === "folder") setView("folder", r.key);
      else setView("orphans");
    });

    listEl.appendChild(item);
  }
}

// ---------- Drag & drop reorder ----------
function attachDragEvents(el, kind) {
  el.addEventListener("dragstart", (e) => {
    dragSrcId = el.dataset.id;
    dragKind = kind;
    el.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  el.addEventListener("dragend", () => {
    el.classList.remove("dragging");
    el.draggable = false;
    clearDragOverStyles();
    dragSrcId = null;
    dragOverId = null;
  });
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!dragSrcId || el.dataset.id === dragSrcId) return;
    clearDragOverStyles();
    el.classList.add("drag-over");
    dragOverId = el.dataset.id;
  });
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!dragSrcId || !dragOverId || dragSrcId === dragOverId) return;
    if (kind === "payload") reorderPayloads(dragSrcId, dragOverId);
    else reorderFolders(dragSrcId, dragOverId);
  });
}

function clearDragOverStyles() {
  listEl.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
}

async function reorderPayloads(srcId, targetId) {
  // Build the currently-displayed id order, move src to just before target,
  // then persist sequential indices for the active context.
  const cards = [...listEl.querySelectorAll(".card")].map(c => c.dataset.id);
  const withoutSrc = cards.filter(id => id !== srcId);
  const targetIdx = withoutSrc.indexOf(targetId);
  withoutSrc.splice(targetIdx, 0, srcId);

  withoutSrc.forEach((id, idx) => {
    const p = payloads.find(x => x.id === id);
    if (!p) return;
    if (view === "folder") {
      p.tagOrder = p.tagOrder || {};
      p.tagOrder[currentFolder] = idx;
    } else {
      p.order = idx;
    }
  });

  await saveAll();
  render();
}

async function reorderFolders(srcName, targetName) {
  const cards = [...listEl.querySelectorAll(".folder-card")].map(c => c.dataset.id);
  const withoutSrc = cards.filter(n => n !== srcName);
  const targetIdx = withoutSrc.indexOf(targetName);
  withoutSrc.splice(targetIdx, 0, srcName);

  withoutSrc.forEach((name, idx) => {
    if (folders[name]) folders[name].order = idx;
  });

  await saveFolders();
  render();
}

// ---------- Copy to clipboard ----------
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast();
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast();
  }
}

let toastTimer = null;
function showToast() {
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 1200);
}

// ---------- Add / Edit payload form + tag input ----------
function openForm(existing) {
  editingId = existing ? existing.id : null;
  editingTags = existing ? [...(existing.tags || [])] : [];
  formTitleEl.textContent = existing ? "Edit Payload" : "Add Payload";
  formLabelEl.value = existing ? existing.label : "";
  formValueEl.value = existing ? existing.value : "";
  tagInputEl.value = "";
  renderTagChips();
  closeAllSuggestions();
  overlayEl.hidden = false;
  formLabelEl.focus();
}

function closeForm() {
  overlayEl.hidden = true;
  editingId = null;
  editingTags = [];
}

function renderTagChips() {
  tagChipsEl.innerHTML = "";
  for (const t of editingTags) {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = "#" + t;

    const rm = document.createElement("button");
    rm.textContent = "×";
    rm.title = "Remove tag";
    rm.addEventListener("click", () => {
      editingTags = editingTags.filter(x => x !== t);
      renderTagChips();
    });

    chip.appendChild(rm);
    tagChipsEl.appendChild(chip);
  }
}

function addTagFromInput(raw) {
  const parts = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  for (const t of parts) {
    if (!editingTags.includes(t)) editingTags.push(t);
  }
  tagInputEl.value = "";
  renderTagChips();
  closeAllSuggestions();
}

function closeAllSuggestions() {
  tagSuggestionsEl.hidden = true;
  tagSuggestionsEl.innerHTML = "";
  highlightedSuggestion = -1;
}

function updateTagSuggestions() {
  const raw = tagInputEl.value.trim();
  if (!raw) { closeAllSuggestions(); return; }
  const nq = normalize(raw);
  const candidates = allFolderNames()
    .filter(n => !editingTags.includes(n))
    .filter(n => normalize(n).includes(nq))
    .slice(0, 6);

  if (!candidates.length) { closeAllSuggestions(); return; }

  tagSuggestionsEl.innerHTML = "";
  highlightedSuggestion = -1;
  candidates.forEach((name, idx) => {
    const item = document.createElement("div");
    item.className = "tag-suggestion";
    item.textContent = "#" + name;
    item.addEventListener("click", () => addTagFromInput(name));
    tagSuggestionsEl.appendChild(item);
  });
  tagSuggestionsEl.hidden = false;
}

tagInputEl.addEventListener("input", updateTagSuggestions);

tagInputEl.addEventListener("keydown", (e) => {
  const suggestions = [...tagSuggestionsEl.children];
  if (e.key === "ArrowDown" && suggestions.length) {
    e.preventDefault();
    highlightedSuggestion = Math.min(highlightedSuggestion + 1, suggestions.length - 1);
    suggestions.forEach((el, i) => el.classList.toggle("highlighted", i === highlightedSuggestion));
  } else if (e.key === "ArrowUp" && suggestions.length) {
    e.preventDefault();
    highlightedSuggestion = Math.max(highlightedSuggestion - 1, 0);
    suggestions.forEach((el, i) => el.classList.toggle("highlighted", i === highlightedSuggestion));
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (highlightedSuggestion >= 0 && suggestions[highlightedSuggestion]) {
      addTagFromInput(suggestions[highlightedSuggestion].textContent.replace(/^#/, ""));
    } else if (tagInputEl.value.trim()) {
      addTagFromInput(tagInputEl.value);
    }
  } else if (e.key === "Escape") {
    closeAllSuggestions();
  } else if (e.key === "Backspace" && !tagInputEl.value && editingTags.length) {
    editingTags.pop();
    renderTagChips();
  }
});

document.addEventListener("click", (e) => {
  if (!document.getElementById("tagInputBox").contains(e.target)) closeAllSuggestions();
});

document.getElementById("addBtn").addEventListener("click", () => openForm(null));
document.getElementById("formCancel").addEventListener("click", closeForm);

document.getElementById("formSave").addEventListener("click", async () => {
  const label = formLabelEl.value.trim();
  const value = formValueEl.value;
  if (tagInputEl.value.trim()) addTagFromInput(tagInputEl.value); // catch un-submitted text

  if (!label || !value) {
    formLabelEl.focus();
    return;
  }

  if (editingId) {
    const idx = payloads.findIndex(p => p.id === editingId);
    if (idx !== -1) {
      payloads[idx] = { ...payloads[idx], label, value, tags: [...editingTags] };
    }
  } else {
    payloads.push({
      id: uid(),
      label,
      value,
      tags: [...editingTags],
      order: payloads.length,
      tagOrder: {}
    });
  }

  ensureFolderRegistryUpToDate();
  await saveAll();
  closeForm();
  render();
});

overlayEl.addEventListener("click", (e) => {
  if (e.target === overlayEl) closeForm();
});

// ---------- Add / rename folder prompt ----------
function openFolderPrompt(existingName) {
  renamingFolder = existingName || null;
  folderPromptTitleEl.textContent = existingName ? "Rename Folder" : "New Folder";
  folderPromptSaveEl.textContent = existingName ? "Rename" : "Create";
  folderNameInputEl.value = existingName || "";
  folderPromptOverlayEl.hidden = false;
  folderNameInputEl.focus();
  folderNameInputEl.select();
}

document.getElementById("addFolderBtn").addEventListener("click", () => openFolderPrompt(null));

document.getElementById("folderPromptCancel").addEventListener("click", () => {
  folderPromptOverlayEl.hidden = true;
  renamingFolder = null;
});
folderPromptOverlayEl.addEventListener("click", (e) => {
  if (e.target === folderPromptOverlayEl) { folderPromptOverlayEl.hidden = true; renamingFolder = null; }
});

document.getElementById("folderPromptSave").addEventListener("click", async () => {
  const raw = folderNameInputEl.value.trim().toLowerCase();
  if (!raw) { folderNameInputEl.focus(); return; }

  if (renamingFolder) {
    await renameFolder(renamingFolder, raw);
  } else {
    if (!folders[raw]) {
      const nextOrder = Object.keys(folders).length
        ? Math.max(...Object.values(folders).map(f => f.order || 0)) + 1
        : 0;
      folders[raw] = { order: nextOrder, explicit: true, displayName: raw };
    } else {
      folders[raw].explicit = true;
    }
    await saveFolders();
  }

  folderPromptOverlayEl.hidden = true;
  renamingFolder = null;
  render();
});

async function renameFolder(oldName, newName) {
  if (oldName === newName) return;

  const targetExists = !!folders[newName];
  const targetOrder = targetExists ? folders[newName].order : (folders[oldName] ? folders[oldName].order : 0);

  // Update every payload's tags[] and tagOrder{} to point at the new name.
  for (const p of payloads) {
    if (p.tags && p.tags.includes(oldName)) {
      p.tags = p.tags.filter(t => t !== newName); // avoid dupes if merging into an existing tag
      p.tags = p.tags.map(t => (t === oldName ? newName : t));
      if (p.tagOrder && oldName in p.tagOrder) {
        const ord = p.tagOrder[oldName];
        delete p.tagOrder[oldName];
        if (!(newName in p.tagOrder)) p.tagOrder[newName] = ord;
      }
    }
  }

  delete folders[oldName];
  folders[newName] = { order: targetOrder, explicit: true, displayName: newName };

  await saveAll();
  await saveFolders();

  // Keep "recent" entries pointing at the right name.
  recents = recents.map(r => (r.type === "folder" && r.key === oldName ? { ...r, key: newName } : r));
  await saveRecents();

  if (view === "folder" && currentFolder === oldName) currentFolder = newName;
}

// ---------- Delete folder (generic confirm dialog) ----------
function confirmDeleteFolder(name, count) {
  confirmTitleEl.textContent = "Delete #" + name + "?";
  confirmMessageEl.textContent = count
    ? `This removes the "${name}" tag from ${count} payload${count === 1 ? "" : "s"}. The payloads themselves are kept — they'll just lose this tag (and may become Orphans if it was their only one).`
    : "This folder has no payloads in it and will simply be removed.";
  pendingConfirmAction = async () => {
    for (const p of payloads) {
      if (p.tags && p.tags.includes(name)) {
        p.tags = p.tags.filter(t => t !== name);
      }
      if (p.tagOrder && name in p.tagOrder) delete p.tagOrder[name];
    }
    delete folders[name];
    await saveAll();
    await saveFolders();
    recents = recents.filter(r => !(r.type === "folder" && r.key === name));
    await saveRecents();
    if (view === "folder" && currentFolder === name) setView("folders");
    else render();
  };
  confirmOverlayEl.hidden = false;
}

document.getElementById("confirmCancel").addEventListener("click", () => {
  confirmOverlayEl.hidden = true;
  pendingConfirmAction = null;
});
confirmOverlayEl.addEventListener("click", (e) => {
  if (e.target === confirmOverlayEl) { confirmOverlayEl.hidden = true; pendingConfirmAction = null; }
});
document.getElementById("confirmOk").addEventListener("click", async () => {
  const action = pendingConfirmAction;
  pendingConfirmAction = null;
  confirmOverlayEl.hidden = true;
  if (action) await action();
});

// ---------- Settings ----------
document.getElementById("settingsBtn").addEventListener("click", () => {
  shortcutTargetSelectEl.value = settings.shortcutTarget || "recent";
  settingsOverlayEl.hidden = false;
});
document.getElementById("settingsClose").addEventListener("click", async () => {
  settings.shortcutTarget = shortcutTargetSelectEl.value;
  await saveSettings();
  settingsOverlayEl.hidden = true;
});
settingsOverlayEl.addEventListener("click", (e) => {
  if (e.target === settingsOverlayEl) settingsOverlayEl.hidden = true;
});
document.getElementById("openShortcutsPageBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

// ---------- Search ----------
searchEl.addEventListener("input", render);

// ---------- Init ----------
loadAll();
