# Future Enhancements & Roadmap

This document outlines the detailed backlog of future enhancements for the Jules & Gemini 3 Chess Engine. Each section represents an **Epic**, containing detailed **User Stories** with implementation plans and acceptance criteria.

---








### Epic 79: Integration, Social & Misc
**Size:** Medium (3 days)
**Description:** Connectivity, sharing, and miscellaneous polish.

**User Stories:**

176. **Export Settings (S)**
    *   *Description:* Download all current UI settings as a JSON file.
    *   *Implementation:* Dump `localStorage`.
    *   *Tasks:*
        - [x] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [x] File downloaded.

177. **Import Settings (S)**
    *   *Description:* Restore UI settings from a JSON file.
    *   *Implementation:* Read JSON, fill `localStorage`, reload.
    *   *Tasks:*
        - [x] Upload.
    *   *Testing Plan:* Import.
    *   *Acceptance Criteria:*
        - [x] Settings restored.

178. **Factory Reset (S)**
    *   *Description:* Restore all settings to default values.
    *   *Implementation:* `localStorage.clear()`.
    *   *Tasks:*
        - [x] Button.
    *   *Testing Plan:* Reset.
    *   *Acceptance Criteria:*
        - [x] Defaults restored.

179. **Local Storage Auto-Save (S)**
    *   *Description:* Persist the current game to local storage to prevent data loss.
    *   *Implementation:* Save FEN/History on every move.
    *   *Tasks:*
        - [x] Save logic.
    *   *Testing Plan:* Reload page.
    *   *Acceptance Criteria:*
        - [x] Game resumes.

180. **Crash Recovery (S)**
    *   *Description:* Automatically restore the game state if the browser tab is accidentally reloaded.
    *   *Implementation:* Same as auto-save.
    *   *Tasks:*
        - [x] Restoration logic.
    *   *Testing Plan:* Crash.
    *   *Acceptance Criteria:*
        - [x] Recovered.

181. **Language Selection (S)**
    *   *Description:* Support for multiple languages in the UI.
    *   *Implementation:* Dictionary lookup for strings.
    *   *Tasks:*
        - [ ] Dictionary file.
        - [ ] Dropdown.
    *   *Testing Plan:* Switch language.
    *   *Acceptance Criteria:*
        - [ ] Text updates.

182. **Version Checker (S)**
    *   *Description:* Check against GitHub API if a newer version is available.
    *   *Implementation:* Fetch release tag. Compare with `package.json`.
    *   *Tasks:*
        - [ ] Check logic.
    *   *Testing Plan:* Mock API.
    *   *Acceptance Criteria:*
        - [ ] Notification if outdated.

183. **Changelog Viewer (S)**
    *   *Description:* Display the `CHANGELOG.md` within the UI.
    *   *Implementation:* Fetch markdown, render HTML.
    *   *Tasks:*
        - [x] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [x] Text visible.

184. **License Viewer (S)**
    *   *Description:* Display the `LICENSE` text within the UI.
    *   *Implementation:* Static text.
    *   *Tasks:*
        - [x] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [x] Text visible.

185. **Credits Screen (S)**
    *   *Description:* List contributors and libraries used.
    *   *Implementation:* Static list.
    *   *Tasks:*
        - [x] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [x] Credits shown.

186. **Sponsor Link (S)**
    *   *Description:* Link to GitHub Sponsors or donation page.
    *   *Implementation:* External link `<a>`.
    *   *Tasks:*
        - [x] Link.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [x] Opens page.

187. **Feedback Form (S)**
    *   *Description:* Embedded form or link to open a GitHub issue.
    *   *Implementation:* Link to new issue template.
    *   *Tasks:*
        - [x] Link.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [x] Opens GitHub.

188. **Lichess API Integration (S)**
    *   *Description:* Button to "Analyze on Lichess".
    *   *Implementation:* Form post to Lichess import URL with PGN.
    *   *Tasks:*
        - [x] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [x] Opens Lichess with game.

189. **Chess.com API Integration (S)**
    *   *Description:* Button to "Analyze on Chess.com".
    *   *Implementation:* Link generation.
    *   *Tasks:*
        - [x] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [x] Opens Chess.com.

190. **Board Screenshot (S)**
    *   *Description:* Add a button to download the current board state as an image.
    *   *Implementation:* `html2canvas` or similar.
    *   *Tasks:*
        - [x] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [x] Image downloaded.

191. **Export to GIF (S)**
    *   *Description:* Generate an animated GIF of the game.
    *   *Implementation:* `gif.js` combining screenshots of each move.
    *   *Tasks:*
        - [ ] Generator logic.
    *   *Testing Plan:* Generate.
    *   *Acceptance Criteria:*
        - [ ] GIF plays.

192. **Social Share (S)**
    *   *Description:* Buttons to share the game PGN/FEN to Twitter/Reddit.
    *   *Implementation:* Intent URLs.
    *   *Tasks:*
        - [x] Icons.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [x] Opens share dialog.

193. **Embed Code (S)**
    *   *Description:* Generate HTML iframe code to embed the board.
    *   *Implementation:* Text area with iframe string.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Copy.
    *   *Acceptance Criteria:*
        - [ ] Code valid.

194. **QR Code (S)**
    *   *Description:* Generate a QR code for the current game URL.
    *   *Implementation:* QR library.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Scan.
    *   *Acceptance Criteria:*
        - [ ] URL opens.

195. **Mobile App Prompt (S)**
    *   *Description:* Prompt to install the app on mobile home screen (PWA).
    *   *Implementation:* Manifest.json + service worker + install event.
    *   *Tasks:*
        - [ ] PWA setup.
    *   *Testing Plan:* Lighthouse audit.
    *   *Acceptance Criteria:*
        - [ ] Installable.

196. **Offline Mode Indicator (S)**
    *   *Description:* Visual badge showing if the app is working offline.
    *   *Implementation:* `navigator.onLine`.
    *   *Tasks:*
        - [ ] Indicator UI.
    *   *Testing Plan:* Disconnect net.
    *   *Acceptance Criteria:*
        - [ ] Badge appears.

197. **Engine Avatar (S)**
    *   *Description:* Display a robot icon or avatar for the engine.
    *   *Implementation:* Image.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Visual.
    *   *Acceptance Criteria:*
        - [ ] Visible.

198. **Player Avatar (S)**
    *   *Description:* Allow user to upload or select an avatar for themselves.
    *   *Implementation:* File upload / LocalStorage.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Set avatar.
    *   *Acceptance Criteria:*
        - [ ] Avatar shown.

199. **Chat Box (S)**
    *   *Description:* A simple chat interface for PvP.
    *   *Implementation:* Websocket message relay.
    *   *Tasks:*
        - [ ] Chat UI.
    *   *Testing Plan:* Send message.
    *   *Acceptance Criteria:*
        - [ ] Received.

200. **Emoji Reactions (S)**
    *   *Description:* Allow reacting to moves with emojis.
    *   *Implementation:* Floating emoji animation.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Click emoji.
    *   *Acceptance Criteria:*
        - [ ] Animates.

201. **Confetti Effect (S)**
    *   *Description:* Particle effect on checkmate or win.
    *   *Implementation:* Canvas confetti library.
    *   *Tasks:*
        - [x] Trigger on win.
    *   *Testing Plan:* Win game.
    *   *Acceptance Criteria:*
        - [x] Confetti falls.

202. **Shake Effect (S)**
    *   *Description:* Screen shake on blunders or checkmate.
    *   *Implementation:* CSS animation `transform: translate`.
    *   *Tasks:*
        - [x] Class `.shake`.
    *   *Testing Plan:* Blunder.
    *   *Acceptance Criteria:*
        - [x] Screen shakes.

203. **Battery Saver Mode (S)**
    *   *Description:* Option to reduce animation framerate on battery.
    *   *Implementation:* Check `navigator.getBattery()`.
    *   *Tasks:*
        - [ ] Logic.
    *   *Testing Plan:* Simulate low battery.
    *   *Acceptance Criteria:*
        - [ ] FPS reduced.

204. **Interactive Tutorial (S)**
    *   *Description:* A step-by-step guide explaining how to use the UI features.
    *   *Implementation:* Overlay pointing to elements.
    *   *Tasks:*
        - [ ] Tutorial flow.
    *   *Testing Plan:* Run tutorial.
    *   *Acceptance Criteria:*
        - [ ] Steps complete.

205. **Keyboard Shortcuts Map (S)**
    *   *Description:* A modal showing all available keyboard shortcuts.
    *   *Implementation:* Static list.
    *   *Tasks:*
        - [x] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [x] List correct.

206. **Mind Control (S)**
    *   *Description:* (Joke) "Use EEG headset to make moves."
    *   *Implementation:* Text placeholder "Coming Soon".
    *   *Tasks:*
        - [ ] Joke UI.
    *   *Testing Plan:* Look for it.
    *   *Acceptance Criteria:*
        - [ ] Laugh.

207. **Game Over Modal (S)**
    *   *Description:* A popup summary when the game ends.
    *   *Implementation:* Modal with result, reason, stats.
    *   *Tasks:*
        - [x] Modal.
    *   *Testing Plan:* End game.
    *   *Acceptance Criteria:*
        - [x] Modal appears.

### Epic 80: Advanced Engine Integrations
**Size:** Medium (3 days)
**Description:** Integration with external engines (local and cloud) for extended analysis capability.

**User Stories:**

1. **Local Engine Upload (S)**
    *   *Description:* Allow user to upload a `.wasm` or `.js` engine file to run locally.
    *   *Implementation:* Web Workers with user blob.
    *   *Tasks:*
        - [ ] File upload.
        - [ ] Worker instantiation.
    *   *Testing Plan:* Upload Stockfish.js.
    *   *Acceptance Criteria:*
        - [ ] External engine runs.

2. **Cloud Engine Support (S)**
    *   *Description:* Connect to a remote UCI engine.
    *   *Implementation:* WebSocket proxy to external server.
    *   *Tasks:*
        - [ ] Connection UI (IP/Port).
    *   *Testing Plan:* Connect.
    *   *Acceptance Criteria:*
        - [ ] Remote analysis.
