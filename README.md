<p align="center">
  <img src="assets/logo.svg" alt="stackcraftio" width="260">
</p>

<h1 align="center">⚔️ Sword Sovereign — 万剑归宗</h1>
<p align="center"><em>Ten Thousand Swords Return to One</em></p>
<p align="center"><strong>One hand summons a sword. Two hands command ten thousand.</strong></p>

A gesture-controlled 3D fantasy simulation inspired by xianxia and wuxia. Stand in front of your webcam and command thousands of glowing flying swords with your bare hands. It runs entirely in the browser, with no installs, no backend and no build step.

> This is a virtual visual simulation. It is not a physical drone or weapon-control system.

Built by **stackcraftio**.

---

## ✨ Features

- Real-time two-hand tracking with [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- Up to **10,000 swords** rendered with Three.js `InstancedMesh` (one draw call)
- 8 formations: orbit, wings, shield sphere, launch, precision, sword rain, spiral vortex and the giant-sword ultimate
- Glowing trails, bloom, energy particles, animated summoning circles, cinematic camera, optional sound
- 6 colour themes (including colour-shifting rainbow) and 5 environments
- Beginner and advanced control modes
- Mouse and keyboard fallback if you have no webcam

## 🖐️ Gestures

| Gesture | Ability | Key |
|---|---|---|
| No hand | Sword Orbit | `1` |
| ✋ Open palm | Sword Summoning | `2` |
| ✊ Closed fist | Defensive Formation | `3` |
| ☝️ Pointing finger | Sword Launch (swords fly to your fingertip) | `4` |
| 👌 Pinch | Precision Control (one big sword follows your fingertips) | `5` |
| ✌️ Peace sign | Rain of Swords | `6` |
| 🙌 Both palms open, close together | Spiral Vortex | `7` |
| 🙆 Both palms open, wide apart | Ten Thousand Swords (vortex, then one giant sword) | `8` |

Keys `1`–`8` also work while the camera is on and override hand control. Press `0` or `Esc` to give control back to your hands. You can also click the gesture cards on screen.

---

## 🚀 Step-by-step guide

### Step 1 — Get the project

Unzip `sword-sovereign.zip`. You should have a folder like this:

```
sword-sovereign/
├── index.html
├── css/style.css
├── js/app.js
├── assets/
│   ├── logo.svg          ← stackcraftio logo (also used as the on-screen watermark)
│   └── favicon.svg
├── .vscode/              ← recommended VS Code settings
├── .nojekyll             ← tells GitHub Pages to serve files as they are
├── .gitignore
├── package.json
├── LICENSE
└── README.md
```

### Step 2 — Open and run it in VS Code

1. Install [Visual Studio Code](https://code.visualstudio.com/).
2. **File → Open Folder…** and choose the `sword-sovereign` folder.
3. Install the **Live Server** extension: open the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`), search for "Live Server" by Ritwick Dey and click **Install**.
4. Right-click `index.html` in the sidebar and choose **Open with Live Server**.
5. Your browser opens at `http://127.0.0.1:5500`. Click **Enable camera & begin** and allow camera access.

Use **Chrome or Edge** for best results. Make sure you are online, since Three.js and MediaPipe load from a CDN.

**Alternative without Live Server** (needs Python or Node):

```bash
python -m http.server 8000      # then open http://localhost:8000
# or
npm start                       # then open http://localhost:5500
```

> Opening `index.html` by double-clicking works too, but some browsers block the camera on `file://` pages. Using a local server (as above) or GitHub Pages avoids that.

### Step 3 — Put it on GitHub

First create a free account at [github.com](https://github.com) if you don't have one.

#### Option A — GitHub website, no tools needed

1. Go to <https://github.com/new>.
2. **Repository name:** `sword-sovereign`. Set it to **Public**. Don't tick "Add a README". Click **Create repository**.
3. On the next page click **uploading an existing file**.
4. Open the unzipped folder, select **everything inside it** (including the `css`, `js`, `assets` and `.vscode` folders) and drag it into the browser window. On macOS press `Cmd+Shift+.` in Finder to show hidden files like `.nojekyll`, and on Windows enable *View → Hidden items* in File Explorer.
5. Scroll down and click **Commit changes**.

#### Option B — From VS Code (no terminal)

1. Click the **Source Control** icon in the left bar (or press `Ctrl+Shift+G`).
2. Click **Initialize Repository**.
3. Type a message such as `Initial commit`, then click **Commit** and **Yes** if asked to stage everything.
4. Click **Publish Branch**, sign in to GitHub when asked, choose **Public repository** and confirm.

#### Option C — Terminal

Replace `YOUR-USERNAME` with your GitHub username (create the empty repo on github.com first, as in Option A steps 1–2):

```bash
cd sword-sovereign
git init
git add .
git commit -m "Initial commit: Sword Sovereign"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sword-sovereign.git
git push -u origin main
```

### Step 4 — Publish it as a live website (free)

Because GitHub Pages uses HTTPS, the webcam works with no extra setup.

1. In your repository, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Set **Branch** to `main` and the folder to `/ (root)`, then click **Save**.
4. Wait about a minute and refresh the page. Your link appears at the top:

   ```
   https://YOUR-USERNAME.github.io/sword-sovereign/
   ```

5. Copy that link into your repository's **About** box (the ⚙ next to "About" on the repo home page) so people can find the demo.

### Step 5 — Make it yours (optional)

- **Branding and watermark:** The name **stackcraftio** appears three ways: a big faint monochrome watermark behind the swords (`#bgmark` in `css/style.css`), a bracket-framed label in the bottom-right corner (`#wm`), and the full logo `assets/logo.svg` on the intro screen. Change the text in `index.html`, or tweak the CSS to change position, size or opacity. Want capitals? Add `text-transform:uppercase` to `#wm` and `#bgmark span`.
- **Defaults:** Change the starting sword count and colour theme in the `S` object near the top of `js/app.js`.
- **Social preview:** In **Settings → General → Social preview**, upload a screenshot of the app.

---

## 🧰 Project structure and tech

| File | Purpose |
|---|---|
| `index.html` | Page layout, HUD, gesture cards, settings panel, script loading |
| `css/style.css` | All styling, including the stackcraftio watermark |
| `js/app.js` | Hand tracking, gesture recognition, sword simulation, formations, effects, audio |
| `assets/` | Logo and favicon |

**Stack:** HTML/CSS · JavaScript · [Three.js](https://threejs.org/) r128 (WebGL, `InstancedMesh`, bloom post-processing) · [MediaPipe Hands](https://github.com/google/mediapipe). Everything loads from a CDN, so there is nothing to install.

**How it works:** MediaPipe returns 21 landmarks per hand. `analyse()` in `js/app.js` turns them into a gesture by checking which fingers are extended and how far apart the thumb and index tips are. A gesture must hold for 3 frames before the formation changes. Each frame, every sword is pulled towards a target position by a spring, with a per-sword random stiffness so formations flow into each other. Orientation follows the formation's facing direction, or the flight direction while a sword is moving fast.

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| Camera doesn't start | Use Chrome or Edge, allow camera permission, and serve over `http://localhost` or HTTPS (Live Server or GitHub Pages) |
| "Hand-tracking library did not load" | You're offline or a network blocks `cdn.jsdelivr.net`. The app falls back to mouse mode |
| Laggy | Lower the sword count in ⚙ settings, turn off **Bloom glow**, or turn off **Trails** |
| Gestures flicker | Use even lighting, keep your whole hand in view about an arm's length from the camera, and try **Beginner** mode |
| Page blank after GitHub upload | Make sure `index.html` is at the repository root, not inside an extra folder |

## 🗺️ Roadmap

- [x] Phase 1: one sword follows one hand
- [x] Phase 2: multiple swords and basic gestures
- [x] Phase 3: 3D swords, formations, effects
- [x] Phase 4: 1,000+ swords with instancing and two-hand gestures
- [x] Phase 5: 10,000 swords and the Ten Thousand Swords formation
- [ ] Python and OpenCV prototype with a WebSocket bridge
- [ ] Mobile layout polish
- [ ] More formations and sword models

## 📄 License

[MIT](LICENSE) © 2026 stackcraftio

<p align="center"><img src="assets/logo.svg" alt="stackcraftio" width="160"></p>
