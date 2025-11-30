# Future Enhancements & Roadmap

This document outlines the detailed backlog of future enhancements for the Jules & Gemini 3 Chess Engine. Each section represents an **Epic**, containing detailed **User Stories** with implementation plans and acceptance criteria.

---





### Epic 75: Board Editor
**Size:** Medium (3 days)
**Description:** Tools for setting up custom positions.

**User Stories:**

134. **Custom FEN Start (S)**
    *   *Description:* "Setup Position" board editor where users can place pieces freely.
    *   *Implementation:* Palette of pieces. Drag to board.
    *   *Tasks:*
        - [ ] Editor Mode UI.
        - [ ] Piece Palette.
    *   *Testing Plan:* Create position.
    *   *Acceptance Criteria:*
        - [ ] Valid FEN generated.

135. **Castling Rights Editor (S)**
    *   *Description:* Checkboxes to manually toggle castling rights in setup editor.
    *   *Implementation:* Update FEN `KQkq`.
    *   *Tasks:*
        - [ ] Checkboxes.
    *   *Testing Plan:* Toggle.
    *   *Acceptance Criteria:*
        - [ ] FEN updates.

136. **En Passant Target Editor (S)**
    *   *Description:* Input to set the en passant square in setup editor.
    *   *Implementation:* Text input or click square.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Set square.
    *   *Acceptance Criteria:*
        - [ ] FEN updates.

137. **Side to Move Editor (S)**
    *   *Description:* Toggle to switch whose turn it is in setup editor.
    *   *Implementation:* Radio button W/B.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Switch.
    *   *Acceptance Criteria:*
        - [ ] FEN updates.

138. **Move Counter Editor (S)**
    *   *Description:* Input to set the fullmove and halfmove clocks.
    *   *Implementation:* Number inputs.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Change numbers.
    *   *Acceptance Criteria:*
        - [ ] FEN updates.

---

### Epic 76: Developer Tools & Debugging
**Size:** Medium (3 days)
**Description:** Internal tools for developers to debug the engine and client.

**User Stories:**

139. **Perft Benchmark Button (S)**
    *   *Description:* Dev-tool button to run a quick `perft(5)` and show nodes/time.
    *   *Implementation:* Send `perft 5` command.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Result shown.

140. **Debug Overlay (S)**
    *   *Description:* Toggle an overlay showing internal engine stats (quiescence nodes, cache hits).
    *   *Implementation:* Parse expanded `info` string.
    *   *Tasks:*
        - [ ] Overlay UI.
    *   *Testing Plan:* Enable.
    *   *Acceptance Criteria:*
        - [ ] Stats visible.

141. **Zobrist Key Display (S)**
    *   *Description:* Show the current Zobrist hash key for debugging.
    *   *Implementation:* Request key or compute locally.
    *   *Tasks:*
        - [ ] Display element.
    *   *Testing Plan:* Make move.
    *   *Acceptance Criteria:*
        - [ ] Key updates.

142. **FEN Validation Info (S)**
    *   *Description:* Show why a manually entered FEN is invalid.
    *   *Implementation:* Validator function error message.
    *   *Tasks:*
        - [ ] Error UI.
    *   *Testing Plan:* Enter bad FEN.
    *   *Acceptance Criteria:*
        - [ ] Error explained.

143. **Sanity Check (S)**
    *   *Description:* Button to run `board.validate()` and report internal state consistency.
    *   *Implementation:* Engine command `verify`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] "State OK" or error.

144. **Force Garbage Collection (S)**
    *   *Description:* Button to trigger GC if exposed.
    *   *Implementation:* `window.gc()` (if run with flags).
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Does not crash.

145. **Packet Inspector (S)**
    *   *Description:* Log raw UCI messages sent/received in a dedicated debug panel.
    *   *Implementation:* Monitor websocket traffic.
    *   *Tasks:*
        - [ ] Log Panel.
    *   *Testing Plan:* Watch traffic.
    *   *Acceptance Criteria:*
        - [ ] Messages scroll.

146. **Latency Meter (S)**
    *   *Description:* Measure and display the round-trip time for UCI commands.
    *   *Implementation:* Send `isready` -> measure time to `readyok`.
    *   *Tasks:*
        - [ ] Ping loop.
    *   *Testing Plan:* Check MS.
    *   *Acceptance Criteria:*
        - [ ] Latency displayed.

147. **Performance Test Suite (S)**
    *   *Description:* Frontend button to run a small suite of test positions (STS).
    *   *Implementation:* Script to run list of FENs and check bestmove.
    *   *Tasks:*
        - [ ] Test Runner.
    *   *Testing Plan:* Run suite.
    *   *Acceptance Criteria:*
        - [ ] Score reported.

148. **Engine Info Tooltip (S)**
    *   *Description:* Hovering over the engine status shows detailed version info.
    *   *Implementation:* Tooltip with `id name`, `id author`.
    *   *Tasks:*
        - [ ] Tooltip UI.
    *   *Testing Plan:* Hover.
    *   *Acceptance Criteria:*
        - [ ] Info shown.

149. **Memory Usage Indicator (S)**
    *   *Description:* Show the current RAM usage of the engine process.
    *   *Implementation:* Server reports `process.memoryUsage()`.
    *   *Tasks:*
        - [ ] Periodic update.
    *   *Testing Plan:* Observe.
    *   *Acceptance Criteria:*
        - [ ] Value updates.

150. **Thread Usage Indicator (S)**
    *   *Description:* Show how many threads are currently active.
    *   *Implementation:* Config check.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Change threads.
    *   *Acceptance Criteria:*
        - [ ] Count correct.

151. **Hash Usage Monitor (S)**
    *   *Description:* Display the percentage of the Transposition Table currently in use.
    *   *Implementation:* Engine reports `hashfull`.
    *   *Tasks:*
        - [ ] Progress bar.
    *   *Testing Plan:* Fill hash.
    *   *Acceptance Criteria:*
        - [ ] Bar fills.

152. **Search Depth Gauge (S)**
    *   *Description:* Visual progress bar showing current search depth versus a target depth.
    *   *Implementation:* Max depth config vs current `info depth`.
    *   *Tasks:*
        - [ ] Bar UI.
    *   *Testing Plan:* Search to 20.
    *   *Acceptance Criteria:*
        - [ ] Bar grows.

153. **Null Move Input (S)**
    *   *Description:* Allow the user to manually enter a "null move" for analysis.
    *   *Implementation:* Send `0000` move.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Turn passes.

---

### Epic 77: Move List & Annotation
**Size:** Medium (3 days)
**Description:** Enhanced game record display and annotation capabilities.

**User Stories:**

154. **Game Annotation (S)**
    *   *Description:* Automatically annotate the move list with symbols like "?", "!" based on score drops.
    *   *Implementation:* Compare eval before/after move.
    *   *Tasks:*
        - [ ] Annotation logic.
    *   *Testing Plan:* Make blunder.
    *   *Acceptance Criteria:*
        - [ ] "??" appears.

155. **Variation Tree Visualization (S)**
    *   *Description:* A graphical tree view of the variations explored by the engine.
    *   *Implementation:* D3.js tree layout of PVs.
    *   *Tasks:*
        - [ ] Tree view component.
    *   *Testing Plan:* Enable multiPV.
    *   *Acceptance Criteria:*
        - [ ] Tree expands.

156. **Promote Variation (S)**
    *   *Description:* Button to make a variation the main line in the move list.
    *   *Implementation:* Swap arrays in game history.
    *   *Tasks:*
        - [ ] Context menu "Promote".
    *   *Testing Plan:* Promote line.
    *   *Acceptance Criteria:*
        - [ ] Moves update.

157. **Delete Variation (S)**
    *   *Description:* Button to remove a specific variation branch.
    *   *Implementation:* Splicing logic.
    *   *Tasks:*
        - [ ] Context menu "Delete".
    *   *Testing Plan:* Delete.
    *   *Acceptance Criteria:*
        - [ ] Variation gone.

158. **Delete Remaining Moves (S)**
    *   *Description:* Button to truncate the game history from the current move.
    *   *Implementation:* Slice history.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click at move 10.
    *   *Acceptance Criteria:*
        - [ ] Moves 11+ gone.

159. **Comment Editor (S)**
    *   *Description:* Text area to add detailed comments to the current move.
    *   *Implementation:* Store string in move object. Render in list.
    *   *Tasks:*
        - [ ] Text area.
    *   *Testing Plan:* Add comment.
    *   *Acceptance Criteria:*
        - [ ] Comment visible.

160. **NAG Editor (S)**
    *   *Description:* Interface to add Numeric Annotation Glyphs ($1, $2, etc.) to moves.
    *   *Implementation:* Dropdown of standard NAGs.
    *   *Tasks:*
        - [ ] Dropdown.
    *   *Testing Plan:* Select "!".
    *   *Acceptance Criteria:*
        - [ ] Symbol appears.

161. **Move List Scroll Lock (S)**
    *   *Description:* Option to keep the move list scrolled to the bottom.
    *   *Implementation:* `scrollTop = scrollHeight`.
    *   *Tasks:*
        - [ ] Checkbox.
    *   *Testing Plan:* Make move.
    *   *Acceptance Criteria:*
        - [ ] List scrolls.

162. **Search Filter (S)**
    *   *Description:* Filter the game history by move number or piece.
    *   *Implementation:* Search input. Hide non-matching rows.
    *   *Tasks:*
        - [ ] Input.
    *   *Testing Plan:* Search "Nf3".
    *   *Acceptance Criteria:*
        - [ ] Only Nf3 moves shown.

163. **Opening Book Explorer (S)**
    *   *Description:* A simple UI panel showing book moves available in the current position.
    *   *Implementation:* Query server for book moves.
    *   *Tasks:*
        - [ ] Explorer Panel.
    *   *Testing Plan:* Startpos.
    *   *Acceptance Criteria:*
        - [ ] e4, d4, etc shown.

164. **Opening Name Database (S)**
    *   *Description:* Display the specific opening name dynamically.
    *   *Implementation:* Lookup ECO or name based on PGN/Moves.
    *   *Tasks:*
        - [ ] ECO DB lookup.
    *   *Testing Plan:* Play Sicilian.
    *   *Acceptance Criteria:*
        - [ ] "Sicilian Defense" shown.

165. **ECO Code Display (S)**
    *   *Description:* Show the ECO code and opening name.
    *   *Implementation:* Display code.
    *   *Tasks:*
        - [ ] UI element.
    *   *Testing Plan:* Check.
    *   *Acceptance Criteria:*
        - [ ] Code shown.

---

### Epic 78: Accessibility & Audio
**Size:** Medium (3 days)
**Description:** Making the game accessible to all users.

**User Stories:**

166. **Keyboard Navigation (S)**
    *   *Description:* Support arrow keys for navigating through the game history.
    *   *Implementation:* `keydown` listener. Left/Right arrows -> Undo/Redo.
    *   *Tasks:*
        - [ ] Listener.
    *   *Testing Plan:* Press arrows.
    *   *Acceptance Criteria:*
        - [ ] Board updates.

167. **Voice Announcement (S)**
    *   *Description:* Use Web Speech API to announce moves audibly.
    *   *Implementation:* `speechSynthesis.speak()`.
    *   *Tasks:*
        - [ ] Toggle.
        - [ ] Speech logic.
    *   *Testing Plan:* Make move.
    *   *Acceptance Criteria:*
        - [ ] "Knight to f3" spoken.

168. **Voice Control (S)**
    *   *Description:* Full voice control for navigating UI.
    *   *Implementation:* Web Speech Recognition. Command mapping.
    *   *Tasks:*
        - [ ] Microphone input.
    *   *Testing Plan:* Say "Play e4".
    *   *Acceptance Criteria:*
        - [ ] Move plays.

169. **Screen Reader Support (S)**
    *   *Description:* Ensure all moves and status updates are ARIA-live regions.
    *   *Implementation:* `aria-live="polite"` on status div.
    *   *Tasks:*
        - [ ] HTML attributes.
    *   *Testing Plan:* Use NVDA/VoiceOver.
    *   *Acceptance Criteria:*
        - [ ] Updates announced.

170. **High Contrast Mode (S)**
    *   *Description:* Accessibility mode with maximum contrast colors.
    *   *Implementation:* B/W theme.
    *   *Tasks:*
        - [ ] Toggle.
    *   *Testing Plan:* Check contrast.
    *   *Acceptance Criteria:*
        - [ ] High contrast visible.

171. **Move Sound Effects (S)**
    *   *Description:* Add distinct sounds for move, capture, check, and game over.
    *   *Implementation:* Audio files. Play on event.
    *   *Tasks:*
        - [ ] Source audio.
    *   *Testing Plan:* Play.
    *   *Acceptance Criteria:*
        - [ ] Sounds play.

172. **Checkmate Sound (S)**
    *   *Description:* A unique sound effect for checkmate.
    *   *Implementation:* Distinct file.
    *   *Tasks:*
        - [ ] Logic.
    *   *Testing Plan:* Mate.
    *   *Acceptance Criteria:*
        - [ ] Sound plays.

173. **Stalemate Sound (S)**
    *   *Description:* A unique sound effect for stalemate.
    *   *Implementation:* Distinct file.
    *   *Tasks:*
        - [ ] Logic.
    *   *Testing Plan:* Stalemate.
    *   *Acceptance Criteria:*
        - [ ] Sound plays.

174. **Sound Volume Control (S)**
    *   *Description:* Slider to adjust sound effect volume.
    *   *Implementation:* `audio.volume`.
    *   *Tasks:*
        - [ ] Slider.
    *   *Testing Plan:* Adjust.
    *   *Acceptance Criteria:*
        - [ ] Volume changes.

175. **Sound Pack Upload (S)**
    *   *Description:* Allow user to upload a zip of custom sound effects.
    *   *Implementation:* Blob URL replacement for audio sources.
    *   *Tasks:*
        - [ ] Upload UI.
    *   *Testing Plan:* Upload custom sounds.
    *   *Acceptance Criteria:*
        - [ ] Custom sounds play.

---

### Epic 79: Integration, Social & Misc
**Size:** Medium (3 days)
**Description:** Connectivity, sharing, and miscellaneous polish.

**User Stories:**

176. **Export Settings (S)**
    *   *Description:* Download all current UI settings as a JSON file.
    *   *Implementation:* Dump `localStorage`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] File downloaded.

177. **Import Settings (S)**
    *   *Description:* Restore UI settings from a JSON file.
    *   *Implementation:* Read JSON, fill `localStorage`, reload.
    *   *Tasks:*
        - [ ] Upload.
    *   *Testing Plan:* Import.
    *   *Acceptance Criteria:*
        - [ ] Settings restored.

178. **Factory Reset (S)**
    *   *Description:* Restore all settings to default values.
    *   *Implementation:* `localStorage.clear()`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Reset.
    *   *Acceptance Criteria:*
        - [ ] Defaults restored.

179. **Local Storage Auto-Save (S)**
    *   *Description:* Persist the current game to local storage to prevent data loss.
    *   *Implementation:* Save FEN/History on every move.
    *   *Tasks:*
        - [ ] Save logic.
    *   *Testing Plan:* Reload page.
    *   *Acceptance Criteria:*
        - [ ] Game resumes.

180. **Crash Recovery (S)**
    *   *Description:* Automatically restore the game state if the browser tab is accidentally reloaded.
    *   *Implementation:* Same as auto-save.
    *   *Tasks:*
        - [ ] Restoration logic.
    *   *Testing Plan:* Crash.
    *   *Acceptance Criteria:*
        - [ ] Recovered.

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
        - [ ] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [ ] Text visible.

184. **License Viewer (S)**
    *   *Description:* Display the `LICENSE` text within the UI.
    *   *Implementation:* Static text.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [ ] Text visible.

185. **Credits Screen (S)**
    *   *Description:* List contributors and libraries used.
    *   *Implementation:* Static list.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [ ] Credits shown.

186. **Sponsor Link (S)**
    *   *Description:* Link to GitHub Sponsors or donation page.
    *   *Implementation:* External link `<a>`.
    *   *Tasks:*
        - [ ] Link.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens page.

187. **Feedback Form (S)**
    *   *Description:* Embedded form or link to open a GitHub issue.
    *   *Implementation:* Link to new issue template.
    *   *Tasks:*
        - [ ] Link.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens GitHub.

188. **Lichess API Integration (S)**
    *   *Description:* Button to "Analyze on Lichess".
    *   *Implementation:* Form post to Lichess import URL with PGN.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens Lichess with game.

189. **Chess.com API Integration (S)**
    *   *Description:* Button to "Analyze on Chess.com".
    *   *Implementation:* Link generation.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens Chess.com.

190. **Board Screenshot (S)**
    *   *Description:* Add a button to download the current board state as an image.
    *   *Implementation:* `html2canvas` or similar.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Image downloaded.

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
        - [ ] Icons.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens share dialog.

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
        - [ ] Trigger on win.
    *   *Testing Plan:* Win game.
    *   *Acceptance Criteria:*
        - [ ] Confetti falls.

202. **Shake Effect (S)**
    *   *Description:* Screen shake on blunders or checkmate.
    *   *Implementation:* CSS animation `transform: translate`.
    *   *Tasks:*
        - [ ] Class `.shake`.
    *   *Testing Plan:* Blunder.
    *   *Acceptance Criteria:*
        - [ ] Screen shakes.

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
        - [ ] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [ ] List correct.

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
        - [ ] Modal.
    *   *Testing Plan:* End game.
    *   *Acceptance Criteria:*
        - [ ] Modal appears.

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
