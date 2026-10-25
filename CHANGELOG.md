# Changelog

All notable changes to **Hyper LogViewer** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-beta.1] - 2026-10-25

First public beta release of **Hyper LogViewer**, a high-performance, local-first desktop `.log` viewer engineered with Electron, React 19, TypeScript, and Vite.

### Added
- **Multi-Tab Architecture:** Open, view, and inspect multiple log files concurrently with smooth horizontal scrolling, keyboard shortcuts (`Ctrl+T`, `Ctrl+W`, `Ctrl+1..9`), and individual close buttons.
- **Triple Ingestion Workflow:**
  - Native OS file picker (`Ctrl+O`).
  - Drag and drop files onto the landing dropzone or directly onto the tab bar.
  - Clipboard ingestion (`Ctrl+V`) that instantly creates an in-memory tab from copied log buffers.
- **High-Performance Virtual Scroller:** Virtualized line rendering via `@tanstack/react-virtual` delivering 60 FPS scrolling even on files containing millions of log lines.
- **Rainbow Brackets & Interactive Matching:**
  - Depth-based colorization for braces `{}` and brackets `[]` across both the virtual scroller and the dedicated JSON inspector block.
  - Real-time highlighting of delimiter pairs on hover and click.
- **Intelligent Metadata Discovery:**
  - Instant discovery of UUIDs, URLs, and File Paths inside log entries.
  - Hover-activated copy-to-clipboard buttons for rapid diagnosis.
- **Java Stacktrace & Multiline Continuity Engine:**
  - Strict pattern detection for Java exceptions (`java.lang.*Exception`, `at ...` stack frames, `Caused by:`).
  - Continuation lines suppress redundant `UNKNOWN` badges and apply a soft background tint inherited from the root error severity.
  - Consolidated exception tree preview inside the log detail modal.
- **Jenkins & Git Pipeline Log Highlighting:**
  - Automatic detection and colorization of Git branches (`feature/...`, `develop`, etc.).
  - Merge and conflict keywords highlighted (`git merge`, `CONFLICT`).
  - Colored Git diff statistics (`+` insertions in green, `-` deletions in red, numbers in blue).
- **Severity-Aware Dynamic Row Focus:**
  - Active line focus borders dynamically match the entry severity (red for error, amber for warning, blue for info).
  - Configurable Tabler Icon indicator (hand, right arrow, chevron, caret triangle, double arrow, target, dot, bookmark, star).
- **Clean INFO Background Toggle:** Optional setting in Settings > Log Parser to strip background tints on INFO entries for higher contrast.
- **Watched Folders Sidebar:** Collapsible side panel to monitor local log directories with quick reload and one-click file opening.
- **Smart Autoscroll:** Continuous and tail modes with configurable speeds and automatic pause on user interaction.
- **Bilingual i18n:** Full support for English (`en`) and Spanish (`es`) with instant switching without app reload.
- **Modern Floating Tooltips:** Dynamic out-of-DOM tooltips powered by `@floating-ui/dom`.
- **Packaging & Distribution:**
  - Windows 10/11 NSIS Installer (`Hyper LogViewer-Setup-0.1.0-beta.1.exe`).
  - Standalone Portable executable (`Hyper LogViewer-0.1.0-beta.1-Portable.exe`).
