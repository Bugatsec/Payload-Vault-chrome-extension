\# 🗂️ Payload Vault



\*\*Your go-to security payloads, one click away, no digging through notes, Burp history, or old bug reports.\*\*



<p>

&#x20; <img alt="Manifest V3" src="https://img.shields.io/badge/manifest-v3-5af0a0?style=flat-square" />

&#x20; <img alt="Chrome / Edge / Brave" src="https://img.shields.io/badge/browser-chrome%20%7C%20edge%20%7C%20brave-4285F4?style=flat-square" />

&#x20; <img alt="Vanilla JS" src="https://img.shields.io/badge/stack-vanilla%20JS-f0db4f?style=flat-square" />

&#x20; <img alt="Zero dependencies" src="https://img.shields.io/badge/dependencies-0-success?style=flat-square" />

&#x20; <img alt="Network requests" src="https://img.shields.io/badge/network%20requests-0-success?style=flat-square" />

&#x20; <img alt="Storage" src="https://img.shields.io/badge/storage-local%20only-blue?style=flat-square" />

&#x20; <img alt="Footprint" src="https://img.shields.io/badge/footprint-lightweight-brightgreen?style=flat-square" />

&#x20; <img alt="Version" src="https://img.shields.io/badge/version-1.1.0-informational?style=flat-square" />

</p>



\---



\## Why this exists



Every pentest / bug bounty session hits the same friction: you know the

payload you need: `<img src=x onerror=alert(1)>`, a polyglot, a specific

SVG upload trick, but it's buried in a notes app, an old Burp project, or a

Discord message from six months ago. Tab-switching to find it, retyping it,

or re-Googling "XSS cheat sheet" mid-flow breaks concentration and wastes

time across dozens of targets a week.



Payload Vault keeps a personal, organized, instantly-searchable library of

your payloads \*\*in the browser toolbar itself\*\*, one click to copy, zero

context-switching. It's a snippet manager built specifically for the shape

of security-testing workflows: tag-based organization instead of rigid

folders, everything reachable in under two seconds, and nothing sent

anywhere over the network.



\## Features



\- \*\*📋 One-click copy\*\*: click any payload card, it's on your clipboard.

\- \*\*🏷️ Tag-based organization\*\*: tag payloads (`xss`, `openredirect`, `ssrf`,

&#x20; whatever you use) instead of filing them into one rigid folder. A payload

&#x20; can belong to as many tags as make sense.

\- \*\*⌨️ Tag autocomplete\*\*: start typing a tag and matching existing tags

&#x20; suggest instantly, so you're not retyping `openredirect` slightly

&#x20; differently every time and fragmenting your library.

\- \*\*🔍 Fuzzy tag search\*\*: search ignores spacing/casing, so `open redirect`

&#x20; finds payloads tagged `openredirect`.

\- \*\*📁 Folders view\*\*: every tag doubles as a browsable folder. A payload

&#x20; tagged `xss` + `openredirect` shows up in both: no duplication, no

&#x20; manual filing.

\- \*\*🚫 Orphans view\*\*: instantly see which payloads you forgot to tag.

\- \*\*➕ Pre-create empty folders\*\*: set up your taxonomy (`sqli`, `ssti`,

&#x20; `idor`...) before you've added a single payload to them.

\- \*\*✎ Rename / 🗑 delete folders\*\*: rename updates the tag across every

&#x20; payload that uses it (merges automatically if the new name already

&#x20; exists); delete just strips the tag off affected payloads: your

&#x20; payloads are never deleted along with a folder.

\- \*\*⠿ Drag-to-reorder\*\*: grab the six-dot handle on any payload or folder

&#x20; to pin your most-used ones to the top. Order inside a folder is

&#x20; independent from the main list and other folders.

\- \*\*⏱️ Recent view\*\*: `Alt+Shift+F` jumps straight to the folders/Orphans

&#x20; you looked at most recently.

\- \*\*⚙️ Configurable shortcut target\*\*: decide whether `Alt+Shift+F` opens

&#x20; Recent, Folders, Orphans, or the full list; jump straight to Chrome's

&#x20; own shortcut page if you want to remap the key combo itself.

\- \*\*🌱 Seeded with reference payloads\*\*: ships with a handful of standard,

&#x20; publicly documented OWASP-style XSS payloads so it's useful on install,

&#x20; not an empty box.

\- \*\*🔒 100% local\*\*: everything lives in `chrome.storage.local`. No

&#x20; accounts, no sync servers, no analytics, no network calls at all.



\## How to use it



\### Install (unpacked / developer mode)

1\. Download and unzip the extension folder.

2\. Go to `chrome://extensions` (or `edge://extensions`, `brave://extensions`).

3\. Turn on \*\*Developer mode\*\* (top right).

4\. Click \*\*Load unpacked\*\* and select the `payload-vault` folder.

5\. Pin it to your toolbar for one-click access.



\### Everyday use

| Action | How |

|---|---|

| Copy a payload | Click its card |

| Add a payload | Click \*\*+ Add\*\*, fill in label/payload, add tags |

| Tag something | In the tag box, type a tag → press \*\*Enter\*\* or \*\*,\*\* → it becomes a chip |

| Get tag suggestions | Just start typing: matching existing tags appear below the input |

| Browse by category | Click the \*\*folder icon\*\* in the header |

| Find untagged payloads | Click the \*\*no-tag icon\*\* in the header |

| Pre-make an empty folder | Inside Folders view, click \*\*+ Add Folder\*\* |

| Rename a folder | Hover a folder card → pencil icon |

| Delete a folder (keeps payloads) | Hover a folder card → trash icon → confirm |

| Reorder anything | Drag the \*\*⠿\*\* handle on a card |

| Jump to recently viewed | `Alt+Shift+F` |

| Change what the shortcut opens | Gear icon (bottom right) → Settings |

| Remap the shortcut's key combo | Settings → \*Change key combo in Chrome\* |



\## What's included by default

\- Basic `<script>` alert

\- IMG `onerror` XSS

\- SVG `onload` XSS

\- HTML entity-encoded `onerror` (filter-bypass demo)

\- Classic multi-context polyglot

\- `javascript:` URL payload

\- SVG/XML file content for stored-XSS file-upload testing



All are standard, publicly documented reference strings: for use only in

authorized testing (your own apps, CTFs, or bug bounty programs where you

have explicit permission).



\## Privacy \& footprint

\- No network requests, no telemetry, no external libraries.

\- No frameworks or build step: plain HTML/CSS/JS only.

\- The popup fully unloads when closed; the background service worker is

&#x20; purely event-driven and Chrome sleeps it when idle. It will not sit there

&#x20; eating RAM.



\## Data migration

Older versions stored a single `category` string per payload. On first load

after updating, this is automatically converted into the new `tags\[]`

format: nothing is lost, no action needed.

