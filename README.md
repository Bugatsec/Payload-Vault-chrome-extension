# 🗂️ Payload Vault

**Your go-to security payloads, one click away, no digging through notes, Burp history, or old bug reports.**

<p>
  <img alt="Manifest V3" src="https://img.shields.io/badge/manifest-v3-5af0a0?style=flat-square" />
  <img alt="Chrome / Edge / Brave" src="https://img.shields.io/badge/browser-chrome%20%7C%20edge%20%7C%20brave-4285F4?style=flat-square" />
  <img alt="Vanilla JS" src="https://img.shields.io/badge/stack-vanilla%20JS-f0db4f?style=flat-square" />
  <img alt="Zero dependencies" src="https://img.shields.io/badge/dependencies-0-success?style=flat-square" />
  <img alt="Network requests" src="https://img.shields.io/badge/network%20requests-0-success?style=flat-square" />
  <img alt="Storage" src="https://img.shields.io/badge/storage-local%20only-blue?style=flat-square" />
  <img alt="Footprint" src="https://img.shields.io/badge/footprint-lightweight-brightgreen?style=flat-square" />
  <img alt="Version" src="https://img.shields.io/badge/version-1.1.0-informational?style=flat-square" />
</p>

---

## Why this exists

Every pentest / bug bounty session hits the same friction: you know the
payload you need: `<img src=x onerror=alert(1)>`, a polyglot, a specific
SVG upload trick, but it's buried in a notes app, an old Burp project, or a
Discord message from six months ago. Tab-switching to find it, retyping it,
or re-Googling "XSS cheat sheet" mid-flow breaks concentration and wastes
time across dozens of targets a week.

Payload Vault keeps a personal, organized, instantly-searchable library of
your payloads **in the browser toolbar itself**, one click to copy, zero
context-switching. It's a snippet manager built specifically for the shape
of security-testing workflows: tag-based organization instead of rigid
folders, everything reachable in under two seconds, and nothing sent
anywhere over the network.

## Features

- **One-click copy**: click any payload card, it's on your clipboard.
- **Tag-based organization**: tag payloads (`xss`, `openredirect`, `ssrf`,
  whatever you use) instead of filing them into one rigid folder. A payload
  can belong to as many tags as make sense.
- **Fuzzy tag search**: search ignores spacing/casing, so `open redirect`
  finds payloads tagged `openredirect`.
- **Folders view**: every tag doubles as a browsable folder. A payload
  tagged `xss` + `openredirect` shows up in both: no duplication, no
  manual filing.
- **Orphans view**: instantly see which payloads you forgot to tag.
- **Pre-create empty folders**: set up your taxonomy (`sqli`, `ssti`,
  `idor`...) before you've added a single payload to them.
- **Drag-to-reorder**: grab the six-dot handle on any payload or folder
  to pin your most-used ones to the top. Order inside a folder is
  independent from the main list and other folders.
- **Recent view**: `Alt+Shift+F` jumps straight to the folders/Orphans
  you looked at most recently.
- **Configurable shortcut target**: decide whether `Alt+Shift+F` opens
  Recent, Folders, Orphans, or the full list; jump straight to Chrome's
  own shortcut page if you want to remap the key combo itself.
- **Seeded with reference payloads**: ships with a handful of standard,
  publicly documented OWASP-style XSS payloads so it's useful on install,
  not an empty box.
- **100% local**: everything lives in `chrome.storage.local`. No
  accounts, no sync servers, no analytics, no network calls at all.

## How to use it

### Install (unpacked / developer mode)
1. Download and unzip the extension folder.
2. Go to `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `payload-vault` folder.
5. Pin it to your toolbar for one-click access.

### Everyday use
| Action | How |
|---|---|
| Copy a payload | Click its card |
| Add a payload | Click **+ Add**, fill in label/payload, add tags |
| Tag something | In the tag box, type a tag → press **Enter** or **,** → it becomes a chip |
| Get tag suggestions | Just start typing: matching existing tags appear below the input |
| Browse by category | Click the **folder icon** in the header |
| Find untagged payloads | Click the **no-tag icon** in the header |
| Pre-make an empty folder | Inside Folders view, click **+ Add Folder** |
| Rename a folder | Hover a folder card → pencil icon |
| Delete a folder (keeps payloads) | Hover a folder card → trash icon → confirm |
| Reorder anything | Drag the **⠿** handle on a card |
| Jump to recently viewed | `Alt+Shift+F` |
| Change what the shortcut opens | Gear icon (bottom right) → Settings |
| Remap the shortcut's key combo | Settings → *Change key combo in Chrome* |

## What's included by default
- Basic `<script>` alert
- IMG `onerror` XSS
- SVG `onload` XSS
- HTML entity-encoded `onerror` (filter-bypass demo)
- Classic multi-context polyglot
- `javascript:` URL payload
- SVG/XML file content for stored-XSS file-upload testing

All are standard, publicly documented reference strings: for use only in
authorized testing (your own apps, CTFs, or bug bounty programs where you
have explicit permission).

## License
Payload Vault is released under the MIT License.
You are free to use, modify, and distribute the software in accordance with the terms of the license.
See the [LICENSE](LICENCE) file for the complete license text.

## Support the Project ☕
If Payload Vault saves you time during your security research and you find it useful, you can support its development and maintenance:
🇮🇳 [Buy Bugatsec a Chai](https://www.buymeachai.in/Bugatsec)
Your support helps with continued development, maintenance, and improvements to Payload Vault.
If you'd rather not donate, ⭐ starring the repository, sharing the project, or reporting bugs is always appreciated.

## Contact
Found a bug, have a feature request, or want to get in touch?

GitHub: Open an issue or discussion in this repository.
Security issues: Please report security-sensitive issues privately rather than posting them publicly on bugatsec@gmail.com

For feature requests and general feedback, feel free to open a GitHub issue.
