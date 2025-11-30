# Epic 79: Integration, Social & Misc
**Size:** Medium (3 days)
**Description:** Connectivity, sharing, and miscellaneous polish.

**User Stories:**

- [x] **176. Export Settings (S)**
    *   *Description:* Download all current UI settings as a JSON file.
    *   *Implementation:* Dump `localStorage`.
    *   *Acceptance Criteria:* File downloaded.

- [x] **177. Import Settings (S)**
    *   *Description:* Restore UI settings from a JSON file.
    *   *Implementation:* Read JSON, fill `localStorage`, reload.
    *   *Acceptance Criteria:* Settings restored.

- [x] **178. Factory Reset (S)**
    *   *Description:* Restore all settings to default values.
    *   *Implementation:* `localStorage.clear()`.
    *   *Acceptance Criteria:* Defaults restored.

- [x] **179. Local Storage Auto-Save (S)**
    *   *Description:* Persist the current game to local storage to prevent data loss.
    *   *Implementation:* Save FEN/History on every move.
    *   *Acceptance Criteria:* Game resumes.

- [x] **180. Crash Recovery (S)**
    *   *Description:* Automatically restore the game state if the browser tab is accidentally reloaded.
    *   *Implementation:* Same as auto-save.
    *   *Acceptance Criteria:* Recovered.

- [x] **181. Language Selection (S)**
    *   *Description:* Support for multiple languages in the UI.
    *   *Implementation:* Dictionary lookup for strings.
    *   *Acceptance Criteria:* Text updates.

- [x] **182. Version Checker (S)**
    *   *Description:* Check against GitHub API if a newer version is available.
    *   *Implementation:* Fetch release tag. Compare with `package.json`.
    *   *Acceptance Criteria:* Notification if outdated.

- [x] **183. Changelog Viewer (S)**
    *   *Description:* Display the `CHANGELOG.md` within the UI.
    *   *Implementation:* Fetch markdown, render HTML.
    *   *Acceptance Criteria:* Text visible.

- [x] **184. License Viewer (S)**
    *   *Description:* Display the `LICENSE` text within the UI.
    *   *Implementation:* Static text.
    *   *Acceptance Criteria:* Text visible.

- [x] **185. Credits Screen (S)**
    *   *Description:* List contributors and libraries used.
    *   *Implementation:* Static list.
    *   *Acceptance Criteria:* Credits shown.

- [x] **186. Sponsor Link (S)**
    *   *Description:* Link to GitHub Sponsors or donation page.
    *   *Implementation:* External link `<a>`.
    *   *Acceptance Criteria:* Opens page.

- [x] **187. Feedback Form (S)**
    *   *Description:* Embedded form or link to open a GitHub issue.
    *   *Implementation:* Link to new issue template.
    *   *Acceptance Criteria:* Opens GitHub.

- [x] **188. Lichess API Integration (S)**
    *   *Description:* Button to "Analyze on Lichess".
    *   *Implementation:* Form post to Lichess import URL with PGN.
    *   *Acceptance Criteria:* Opens Lichess with game.

- [x] **189. Chess.com API Integration (S)**
    *   *Description:* Button to "Analyze on Chess.com".
    *   *Implementation:* Link generation.
    *   *Acceptance Criteria:* Opens Chess.com.

- [x] **190. Board Screenshot (S)**
    *   *Description:* Add a button to download the current board state as an image.
    *   *Implementation:* `html2canvas` or similar.
    *   *Acceptance Criteria:* Image downloaded.

- [ ] **191. Export to GIF (S)**
    *   *Description:* Generate an animated GIF of the game.
    *   *Implementation:* `gif.js` combining screenshots of each move.
    *   *Acceptance Criteria:* GIF plays.

- [x] **192. Social Share (S)**
    *   *Description:* Buttons to share the game PGN/FEN to Twitter/Reddit.
    *   *Implementation:* Intent URLs.
    *   *Acceptance Criteria:* Opens share dialog.

- [x] **193. Embed Code (S)**
    *   *Description:* Generate HTML iframe code to embed the board.
    *   *Implementation:* Text area with iframe string.
    *   *Acceptance Criteria:* Code valid.

- [ ] **194. QR Code (S)**
    *   *Description:* Generate a QR code for the current game URL.
    *   *Implementation:* QR library.
    *   *Acceptance Criteria:* URL opens.

- [ ] **195. Mobile App Prompt (S)**
    *   *Description:* Prompt to install the app on mobile home screen (PWA).
    *   *Implementation:* Manifest.json + service worker + install event.
    *   *Acceptance Criteria:* Installable.

- [x] **196. Offline Mode Indicator (S)**
    *   *Description:* Visual badge showing if the app is working offline.
    *   *Implementation:* `navigator.onLine`.
    *   *Acceptance Criteria:* Badge appears.

- [ ] **197. Engine Avatar (S)**
    *   *Description:* Display a robot icon or avatar for the engine.
    *   *Implementation:* Image.
    *   *Acceptance Criteria:* Visible.

- [ ] **198. Player Avatar (S)**
    *   *Description:* Allow user to upload or select an avatar for themselves.
    *   *Implementation:* File upload / LocalStorage.
    *   *Acceptance Criteria:* Avatar shown.

- [ ] **199. Chat Box (S)**
    *   *Description:* A simple chat interface for PvP.
    *   *Implementation:* Websocket message relay.
    *   *Acceptance Criteria:* Received.

- [ ] **200. Emoji Reactions (S)**
    *   *Description:* Allow reacting to moves with emojis.
    *   *Implementation:* Floating emoji animation.
    *   *Acceptance Criteria:* Animates.

- [x] **201. Confetti Effect (S)**
    *   *Description:* Particle effect on checkmate or win.
    *   *Implementation:* Canvas confetti library.
    *   *Acceptance Criteria:* Confetti falls.

- [x] **202. Shake Effect (S)**
    *   *Description:* Screen shake on blunders or checkmate.
    *   *Implementation:* CSS animation `transform: translate`.
    *   *Acceptance Criteria:* Screen shakes.

- [x] **203. Battery Saver Mode (S)**
    *   *Description:* Option to reduce animation framerate on battery.
    *   *Implementation:* Check `navigator.getBattery()`.
    *   *Acceptance Criteria:* FPS reduced.

- [ ] **204. Interactive Tutorial (S)**
    *   *Description:* A step-by-step guide explaining how to use the UI features.
    *   *Implementation:* Overlay pointing to elements.
    *   *Acceptance Criteria:* Steps complete.

- [x] **205. Keyboard Shortcuts Map (S)**
    *   *Description:* A modal showing all available keyboard shortcuts.
    *   *Implementation:* Static list.
    *   *Acceptance Criteria:* List correct.

- [ ] **206. Mind Control (S)**
    *   *Description:* (Joke) "Use EEG headset to make moves."
    *   *Implementation:* Text placeholder "Coming Soon".
    *   *Acceptance Criteria:* Laugh.

- [x] **207. Game Over Modal (S)**
    *   *Description:* A popup summary when the game ends.
    *   *Implementation:* Modal with result, reason, stats.
    *   *Acceptance Criteria:* Modal appears.

---

# Epic 80: Advanced Engine Integrations
**Size:** Medium (3 days)
**Description:** Integration with external engines (local and cloud) for extended analysis capability.

**User Stories:**

- [ ] **1. Local Engine Upload (S)**
    *   *Description:* Allow user to upload a `.wasm` or `.js` engine file to run locally.
    *   *Implementation:* Web Workers with user blob.
    *   *Acceptance Criteria:* External engine runs.

- [ ] **2. Cloud Engine Support (S)**
    *   *Description:* Connect to a remote UCI engine.
    *   *Implementation:* WebSocket proxy to external server.
    *   *Acceptance Criteria:* Remote analysis.
