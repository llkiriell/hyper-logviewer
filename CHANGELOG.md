# Changelog

All notable changes to **Hyper LogViewer** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-beta.3] - 2026-10-29

Third beta release of **Hyper LogViewer**, introducing deterministic character-grid word wrapping (VS Code Monaco-style), home view as a native tab, dedicated element extraction patterns with live double regex workbench, full-width bottom search bar, and refined viewing ergonomics.

### Added
- **Deterministic Word Wrap Engine (VS Code Style):** Mathematical character-grid projection in memory that eliminates line overlapping and vertical jumpiness on large multiline logs and JSON payloads.
- **Home View as a Native Tab (`kind: 'home'`):** Unified tab architecture where the initial screen and the `+` button open native Home tabs, cleanly transforming into log viewers upon file selection.
- **Dedicated Element Extraction Menu:** Independent settings section with double regex support (primary capture + secondary transform/filter) and live test workbench with instant chip preview.
- **Persistent Full-width Bottom Search Bar:** Search bar permanently positioned at the bottom of the viewer, flanked by instant "Jump to top" and "Jump to bottom" navigation buttons.
- **Severity Filter Scroll Preservation:** Remembers focused log entries and restores exact scroll position when clearing or toggling severity level filters.
- **Defensive Truncation in Modals & Recents:** Long URLs and file paths truncate gracefully with ellipses to prevent modal overflow.
- **Hover Illumination & Cursor:** Interactive pointer cursor and persistent hover illumination across lines and sticky columns.

### Changed & Improved
- **Default Word Wrap:** Now enabled by default for all newly loaded files with automated v2 preferences migration.
- **Subtle Separators:** Line separator thickness default and minimum set to `0.10 px`.
- **Dynamic Entities Limit:** Extracted URLs, UUIDs, and paths capped to 2 occurrences per line.
- **Faster Auto-scroll:** Continuous scroll speed increased by 10% (1.98 px/frame by default).
- **Settings Modal Ergonomics:** Outside scrim clicks no longer close the settings dialog accidentally.

---

## [0.1.0-beta.2] - 2026-10-29

Second beta release of **Hyper LogViewer**, delivering advanced line search filtering, accessibility improvements with WCAG 2.1 compliance, multi-line selection, customizable line separators, and performance optimizations.

### Added
- **Match Funnel Filtering:** Fast match-filtering mode (`Filtro de coincidencias`) that isolates and displays only matching log entries with immediate line navigation and zero scroll desynchronization.
- **WCAG 2.1 Contrast & Accessibility Suite:**
  - Real-time relative luminance and contrast ratio calculations.
  - Interactive contrast indicator previews with compliance badges (AA / AAA).
  - Configurable focus indicators and customizable severity background strip modes for maximum legibility in low and high-contrast environments.
- **Contiguous Multi-Row Selection:**
  - `Ctrl`/`Cmd` + click multi-line selection supporting non-contiguous and block selections.
  - Unified contiguous focus border rendering across multi-selected rows without visual breaks.
- **Customizable Line Separators:**
  - Dedicated configuration for line separator thickness (`0.5px` to `3px`) and custom accent or subtle colors.
- **Custom Parser Highlight Patterns:**
  - User-configurable regex pattern matching and custom badge tags (e.g., JPA, Token, HTTP) with live preview directly in the parser settings dialog.
- **Enhanced Search Context Menu:** Contextual actions on search match highlights to copy tokens, filter, or inspect records.
- **Physical Keyboard Step Navigation:** Precise line-by-line keyboard arrow navigation without browser window scrolling.

### Fixed & Improved
- **Word Wrap & Virtualizer Synchronization:** Eliminated dynamic row height overlaps during word wrap toggling and container resizing by stabilizing TanStack Virtualizer cache invalidation.
- **Optimized High-Volume Log Scrolling:** Removed fixed-height skeleton placeholders during momentum scrolling on large log files (>1500 lines) for instantaneous, artifact-free virtual rendering.
- **JSON Parser Refinements:** Restrict inline JSON array extraction strictly to arrays of objects, preventing false positives on primitive numeric or string arrays.
- **OS File Association & Initial File Loading:** Improved launch argument parsing and single-instance messaging on Windows.

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
