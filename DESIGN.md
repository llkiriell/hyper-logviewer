# Agent Code & Style Specification Guide

This document establishes the official architectural and code style rules for **hyper-logviewer**. AI agents must treat these rules as binding constraints when generating, editing, or refactoring code.

---

## 1. Architectural Architecture & Folder Discipline

```
hyper-logviewer/
├── electron/                 # Electron main process & IPC boundaries
│   ├── main.cts              # Main process: window lifecycle & native menus
│   ├── preload.cts           # ContextBridge API exposed to renderer window
│   └── fileReader.cts        # High-performance chunked file reader
├── src/
│   ├── core/                 # Pure TypeScript logic (zero React/DOM dependencies)
│   │   ├── parser.ts         # Log level extraction & timestamp parsing
│   │   ├── search.ts         # Fast search and regex indexing
│   │   └── types.ts          # Core domain data types
│   ├── app/                  # React 19 User Interface
│   │   ├── components/       # Reusable UI primitives & views
│   │   │   ├── primitives.tsx  # Dialog, Switch, Select, Button, Logo
│   │   │   ├── TabBar.tsx      # Tab strip with drag-and-drop & close buttons
│   │   │   ├── TopBar.tsx      # Search bar, severity chips, and action buttons
│   │   │   ├── VirtualLogView.tsx # High-performance virtualized log scroller
│   │   │   ├── StatusBar.tsx   # Metrics footer (line count, size, cursor, tail)
│   │   │   └── settings/       # Settings modal dialog & sections (including About)
│   │   ├── i18n/             # Type-safe i18n engine and dictionaries
│   │   ├── platform/         # Facades for Electron bridge & local preferences
│   │   ├── styles/           # CSS tokens, themes, and application styles
│   │   ├── tabs.ts           # Reactive store for multi-log tabs
│   │   ├── App.tsx           # Root UI orchestrator
│   │   └── main.tsx          # React application entry point
```

### Constraints:
* `src/core/` must never import from `react`, `react-dom`, or `electron`. It must remain pure, testable, deterministic TypeScript.
* `electron/` must remain decoupled from React. All communication with the UI must go through the IPC channels defined in `preload.cts`.
* Do not create arbitrary top-level directories outside this convention.

---

## 2. TypeScript & React 19 Discipline

1. **Strict Type Safety:**
   * No implicit or explicit `any`. Use `unknown` with type narrowing or generic type parameters.
   * Prefer `interface` for object structures that can be extended, and `type` for unions, tuples, and utility types.
2. **Component Structure:**
   * Functional components only. No class components.
   * Explicit typing for component props:
     ```tsx
     interface TabBarProps {
       onTabChange?: (tabId: string) => void;
     }
     export function TabBar({ onTabChange }: TabBarProps) { ... }
     ```
3. **State Management & Decoupling:**
   * For non-DOM/application stores (e.g., `tabs.ts`, `preferences.ts`), use the `useSyncExternalStore` pattern.
   * Do not introduce Redux, Zustand, MobX, or other external state containers. The built-in reactive store pattern is mandatory.
4. **Hooks Rules:**
   * Custom hooks must start with `use` (e.g., `useTranslation()`, `useTheme()`, `useTabs()`).
   * Avoid deep dependency chains in `useEffect`; use event handlers for user-initiated actions.

---

## 3. UI Styling & CSS Tokens System

1. **Pure CSS Design Tokens:**
   * Styling relies on standard CSS custom properties defined in `tokens.css` and `color.css`:
     * Backgrounds: `var(--bg)`, `var(--bg-sidebar)`, `var(--surface)`, `var(--popover)`
     * Text: `var(--text)`, `var(--text-muted)`, `var(--text-faint)`
     * Borders: `var(--border)`, `var(--border-strong)`
     * Accents & States: `var(--accent)`, `var(--hover)`, `var(--active)`, `var(--danger)`, `var(--mark)`
2. **Theming (`light` / `dark` / `system`):**
   * Theme is switched via the `data-theme="light"` or `data-theme="dark"` attribute on `:root` (`document.documentElement`).
   * Accent color is switched via `data-accent="ember" | "ocean" | "aqua" | "violet"`.
3. **No Utility Frameworks:**
   * Do not install or use Tailwind CSS, CSS Modules, or CSS-in-JS libraries (styled-components, emotion).
   * Write clean, semantic class names in `app.css` (e.g., `.tab-bar`, `.tab`, `.log-row`, `.settings-dialog`).
4. **High-Contrast Log Severity Palette:**
   * `ERROR` / `FATAL`: `var(--danger)` (#b3261e light, #f07a6e dark)
   * `WARN`: `var(--mark)` (#d6a028 light, #e6b43c dark)
   * `INFO`: `var(--accent)` (dynamic accent)
   * `DEBUG` / `TRACE`: `var(--text-faint)`

---

## 4. Iconography Standards

1. **Official Icon Library:**
   * Use exclusively [Tabler Icons](https://tabler.io/icons) via `@tabler/icons-react`.
2. **Styling & Sizing:**
   * Always pass a uniform stroke width: `stroke={1.5}`.
   * Default sizes:
     * Tab bar & inline buttons: `size={16}` or `size={18}`
     * Dialog headers & toolbar primary actions: `size={20}` or `size={22}`
     * Hero / About screen icons: `size={36}` or `size={48}`
   * Example:
     ```tsx
     import { IconFolderOpen, IconClipboard, IconSettings } from '@tabler/icons-react';

     <button type="button" className="toolbar-button" title={t('common.openFile')}>
       <IconFolderOpen size={18} stroke={1.5} />
     </button>
     ```

---

## 5. Internationalization (i18n) Rules

1. **Source of Truth:**
   * English (`src/app/i18n/locales/en.ts`) is the authoritative dictionary defining the `TranslationSchema`.
2. **Mirror Requirement:**
   * Spanish (`src/app/i18n/locales/es.ts`) must mirror every single key present in `en.ts`.
3. **Key Naming Convention:**
   * Use camelCase identifiers in dot-delimited hierarchical namespaces:
     * `common.search`, `common.open`, `common.cancel`
     * `tabs.newTab`, `tabs.closeTab`, `tabs.clipboardTab`
     * `settings.sections.general`, `settings.about.version`
4. **Usage in Components:**
   * Always use `t(key, params)` from `useTranslation()`:
     ```tsx
     const { t } = useTranslation();
     return <span>{t('statusBar.lines', { count: totalLines })}</span>;
     ```
   * Never hardcode visible text strings in JSX.

---

## 6. Performance & Log Virtualization

1. **Unbounded Lists Are Prohibited:**
   * Never render log lines using `.map()` directly into the DOM.
   * All log views must utilize virtual windowing via `@tanstack/react-virtual` or an indexed chunk scroller.
2. **Memory Cleanup:**
   * When closing a tab, release references to its in-memory line buffer to allow garbage collection.
3. **Search Indexing:**
   * For regex or text filtering on large buffers, run filtering operations asynchronously or in Web Workers if line counts exceed 100,000 entries.

---

## 7. Electron Security & Isolation

1. `contextIsolation: true` and `nodeIntegration: false` must always remain enabled in `BrowserWindow` webPreferences.
2. Do not import `electron` directly in renderer code (`src/app/`). All OS operations must go through `window.logviewer` via `preload.cts`.
3. Never use `remote` module or insecure IPC evaluation.
