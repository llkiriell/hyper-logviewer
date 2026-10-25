<p align="center">
  <img src="./public/icon.svg" width="80" height="80" alt="Hyper LogViewer Logo" />
</p>

<h1 align="center">Hyper LogViewer</h1>

<p align="center">
  <strong>🇺🇸 Read in English</strong> | <a href="README.es.md">🇪🇸 Leer en Español</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-34.x-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19.1-23272f?logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Icons-Tabler-0054a6" alt="Tabler Icons" />
  <img src="https://img.shields.io/badge/Scroll-TanStack%20Virtual-FF4154" alt="TanStack Virtual" />
  <img src="https://img.shields.io/badge/i18n-English%20|%20Español-blue" alt="i18n" />
  <img src="https://img.shields.io/badge/Co--author-Antigravity%20CLI-E65100?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMTIuMDI1IDJxMi4wMjUgMCAzLjE2MyAxLjUyNVQxNy4xMjUgN3EuNjUgMS41NzUgMS4yNSAzLjV0MS4yNzUgMy44NzVxLjY1IDEuODc1IDEuNDI1IDMuNTI1dDEuOCAyLjgyNXEuMi4yMjUuMTc1LjUyNXQtLjIyNS41MjV0LS40NzUuMjV0LS41NS0uMTc1cS0xLjk3NS0xLjU1LTMuMjUtMy40NjN0LTIuNTc1LTMuMzM3cS0uODUtLjk1LTEuODEyLTEuNVQxMi4wMjUgMTN0LTIuMTM3LjU1dC0xLjgxMyAxLjVxLTEuMyAxLjQyNS0yLjU3NSAzLjMzOFQyLjI1IDIxLjg1cS0uMjc1LjItLjU1LjE3NXQtLjQ3NS0uMjVUMSAyMS4yNXQuMTc1LS41MjVRMi4yIDE5LjU1IDIuOTc1IDE3LjlUNC40IDE0LjM3NXEuNjc1LTEuOTUgMS4yNzUtMy44NzVUNi45MjUgN3EuOC0xLjk1IDEuOTM4LTMuNDc1VDEyLjAyNSAybTAgMnEtMS4xMjUgMC0xLjc3NS45NzVUOS4xIDdxLS42NSAxLjQtMS4xNjIgMy4wMTNUNi44IDEzLjVxLjUtLjUyNS45NjMtLjkyNXQuOTYyLS43MjVxLjgtLjQ3NSAxLjU4OC0uNjYzVDEyLjAyNSAxMXQxLjcxMy4xODh0MS41ODcuNjYycS41LjMyNS45NjMuNzI1dC45NjIuOTI1cS0uNjI1LTEuODc1LTEuMTM3LTMuNDg3VDE0Ljk1IDdxLS41LTEuMDUtMS4xNS0yLjAyNVQxMi4wMjUgNG0wIDciLz4KPC9zdmc+Cg==" alt="Co-author" />
</p>

**hyper-logviewer** is an ultra-fast, local-first desktop `.log` file viewer engineered for deep diagnostic inspection, high-performance filtering, and effortless stacktrace troubleshooting on large log streams.

Built with modern desktop ergonomics in mind, hyper-logviewer combines pure CSS tokens (light/dark modes and accent palettes), a modular settings dialog, multi-tab navigation, and virtualized row scrolling powered by TanStack Virtual to navigate millions of lines smoothly at 60 FPS without UI freezes or memory bloat.

---

## Key Features

* **Multi-Tab Navigation (Multi-log):** Inspect multiple log sources concurrently with smooth horizontal scrolling, quick keyboard shortcuts (`Ctrl+T`, `Ctrl+W`, `Ctrl+1..9`), and individual tab close handlers.
* **Triple Ingestion Workflow:**
  * **Native OS File Dialog:** Fast file picker integration (`Ctrl+O`).
  * **Drag & Drop:** Immediate file dropzone on the home screen or dropped directly onto the tab bar.
  * **Direct Clipboard Paste:** Global `Ctrl+V` shortcut or toolbar action that instantly creates an in-memory formatted tab from raw log buffers.
* **High-Performance Virtual Scroller:** Powered by `@tanstack/react-virtual` to ensure rock-solid 60 FPS scrolling with minimal memory footprint, even across multi-gigabyte files or millions of entries.
* **Rainbow Brackets & Matching Highlights:**
  * Depth-based hierarchical colorization for braces `{}` and brackets `[]`.
  * Real-time interactive highlighting when hovering or clicking delimiter pairs.
  * Fully integrated across virtualized log lines and the dedicated JSON inspector block.
* **Intelligent Metadata Extraction:**
  * Automated discovery of **UUIDs**, **URLs**, and local or remote **File Paths**.
  * Instant hover-to-copy buttons for rapid debugging and trace sharing.
* **Java Stacktrace & Multiline Continuity Engine:**
  * Strict detection of Java exceptions (`java.lang.*Exception`, `at ...` frames, `Caused by:`).
  * Continuation row flattening: suppresses redundant `UNKNOWN` badges on multiline traces while applying a soft background tint inherited from the root error severity.
  * Log detail inspector captures and displays the full consolidated exception tree.
* **Jenkins & Git Pipeline Log Support:**
  * Automatic recognition and colorization of Git branches (`feature/...`, `bugfix/...`, `develop`).
  * Command highlighting for merge actions (`git merge`, integration conflicts).
  * Diff statistics highlighting (file counts in blue, `+` insertions in green, and `-` deletions in red).
* **Severity-Aware Dynamic Row Focus:**
  * Seamless focus borders dynamically colored according to the log severity (red for error, amber for warning, accent for info).
  * Customizable indicator icon in Settings (hand 👉, right arrow ➡️, chevron ❯, caret ▶, target 🎯, star ★, etc.).
* **Clean INFO Background Toggle:** Optional setting to strip background tints on INFO entries for higher contrast and readability.
* **Watched Folders Sidebar:** Collapsible side panel to monitor local log directories with quick reload and one-click file opening.
* **Smart Autoscroll:** Continuous and tail modes with configurable speeds and automatic pause on user interaction.
* **Bilingual i18n:** Built-in English (`en`) and Spanish (`es`) with instantaneous switching without application reload.
* **Modern Floating Tooltips:** Dynamic out-of-DOM tooltips powered by `@floating-ui/dom` matching the current theme palette.

---

## Tech Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Desktop Runtime** | Electron | ^34.2.0 |
| **Bundler & Dev Server** | Vite | ^6.2.0 |
| **Language** | TypeScript | ^5.8.0 |
| **UI Library** | React | ^19.1.0 |
| **Log Virtualization** | `@tanstack/react-virtual` | ^3.13.2 |
| **Floating UI Tooltips** | `@floating-ui/dom` | ^1.8.0 |
| **Iconography** | Tabler Icons (`@tabler/icons-react`) | ^3.31.0 |
| **Internationalization** | Custom Type-Safe i18n Engine | Native (`en` / `es`) |
| **Styling Architecture** | Pure CSS Tokens (`tokens.css`, `app.css`) | W3C Standard |

---

## Repository Structure

```
hyper-logviewer/
├── docs/                     # Local test logs and scratchpad (excluded from Git)
├── electron/
│   ├── main.cts              # Main process: window lifecycle, native menus, IPC
│   └── preload.cts           # Secure contextBridge (file system access, clipboard)
├── src/
│   ├── core/                 # Pure TypeScript domain logic (parsers, regex, brackets, types)
│   ├── app/
│   │   ├── i18n/             # Type-safe i18n engine and dictionaries (en.ts, es.ts)
│   │   ├── components/       # UI components (TabBar, VirtualLogView, VirtualLogRow)
│   │   │   └── settings/     # Modular settings modal and About tab
│   │   ├── platform/         # Electron bridge facades and persistent preferences
│   │   ├── styles/           # Pure CSS tokens, light/dark themes, and layout rules
│   │   ├── tabs.ts           # Reactive store for multi-tab management
│   │   ├── App.tsx           # Primary orchestrator component
│   │   └── main.tsx          # React application entry point
├── AGENTS.md                 # Branching model, commit rules, and AI agent guidelines
├── DESIGN.md                 # Strict code style, TypeScript, and design guidelines
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Installation & Local Development

### Prerequisites
* **Node.js** >= 20.x
* **npm** >= 10.x

### Development Commands

```powershell
# Install dependencies
npm install

# Start Vite dev server with Hot Module Replacement (HMR)
npm run dev

# Compile main process and renderer for production
npm run build

# Launch the desktop application with Electron
npm run start

# Strict TypeScript type check
npm run typecheck
```

---

## Git Branching Model & Commit Standard

This repository follows a strict workflow detailed in [`AGENTS.md`](AGENTS.md):
* **Branches:**
  * `main`: Production and stable release tags.
  * `dev`: Primary integration branch.
  * `feature/<feature-name>`: Specific feature or topic branches.
* **Commit Message Format:** `<noun> : <verb> <description>`
  * *Author (Spanish):* `visor : implementar virtualizacion de lineas de log`
  * *Community (English):* `viewer : implement log line virtualization`

---

## Acknowledgements & Co-Authorship

This project was conceived and developed in close collaboration between the primary maintainer and **Antigravity CLI**, the advanced agentic coding assistant designed by Google DeepMind.

> **Governance Note:** As established in [`AGENTS.md`](AGENTS.md), co-authorship and technical credits to Antigravity CLI are formally recognized exclusively within this repository documentation (README), remaining strictly **outside the user interface and Git commit history** to preserve a clean and standard open-source footprint.
