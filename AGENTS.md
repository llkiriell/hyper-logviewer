# Agent Collaboration & Development Guidelines

Welcome to the **hyper-logviewer** project. This document defines the operational workflow, branching model, commit conventions, and guidelines for AI agents and human contributors collaborating on this codebase.

All instructions and rules in this document must be strictly adhered to by automated agents.

---

## 1. Project Overview & Architecture Principles

**hyper-logviewer** is a high-performance, local-first `.log` file viewer desktop application built with:
* **Electron** + **Vite** + **React 19** + **TypeScript**.
* **Design Philosophy:** Inspired by [Morrow](https://github.com/Aarav2709/Morrow), utilizing pure CSS design tokens (`tokens.css`, `color.css`) with light/dark theme support and accent palettes. No heavy CSS utility frameworks (no Tailwind, no CSS-in-JS).
* **High-Performance Log Viewer:** Virtualized line scrolling via `@tanstack/react-virtual` to ensure smooth 60 FPS navigation on files containing millions of log entries.
* **Iconography:** Exclusively [Tabler Icons](https://tabler.io/icons) (`@tabler/icons-react`) with consistent stroke aesthetics (`stroke={1.5}`).
* **Internationalization (i18n):** Native, type-safe i18n engine with English (`en`) as the default language and Spanish (`es`) fully integrated.
* **Settings Dialog:** Modal configuration with sections for General, Appearance, Log Parser, Shortcuts, and the **About** view.

---

## 2. Git Branching Model

We follow a strict, structured Git branching model:

```
main (Production / Stable Releases)
  │
  └── dev (Primary Development Branch)
        │
        ├── feature/scaffolding-and-i18n
        ├── feature/tabs-and-dropzone
        ├── feature/virtual-log-scroller
        └── feature/settings-modal-and-about
```

### Branch Roles
1. **`main`:** Production-ready, stable codebase. Direct commits to `main` are restricted.
2. **`dev`:** Active integration and development branch. All feature branches must branch off from `dev` and merge back into `dev` via Pull Request or clean rebase/merge.
3. **`feature/<feature-name>`:** Topic branches for implementing distinct features, bugfixes, or refactors (e.g., `feature/virtual-scroller`, `feature/tabler-icons`).

---

## 3. Commit Message Standard

We adhere to an open-source commit format with the following structure:

```
<noun> : <verb> <description>
```

### Language Conventions:
* **Author commits (Primary maintainer):** Written in **Spanish**.
* **Community / Open Source contributors:** Written in **English**.

### Examples:

| Scope | Author (Spanish) | Community (English) |
| :--- | :--- | :--- |
| **Pestañas / Tabs** | `tabs : implementar navegación y cierre de pestañas` | `tabs : implement tab navigation and close handlers` |
| **Visor / Viewer** | `visor : integrar virtualización de registros con tanstack` | `viewer : integrate log line virtualization with tanstack` |
| **Estilos / Styles** | `estilos : agregar variables css de tema oscuro y acentos` | `styles : add dark theme css tokens and accent palettes` |
| **i18n** | `i18n : agregar diccionario en español y selector de idioma` | `i18n : add Spanish dictionary and language selector` |
| **Configuración** | `ajustes : crear modal de configuración con pestaña acerca de` | `settings : create settings modal with about tab` |
| **Portapapeles** | `portapapeles : permitir pegar registros en nueva pestaña` | `clipboard : allow pasting raw log buffer into new tab` |
| **Repo / Tooling** | `repo : inicializar configuración de vite y electron` | `repo : initialize vite and electron build configuration` |

---

## 4. Local Documentation & Scratchpad (`docs/`)

The repository includes a dedicated `docs/` folder in the project root:
* **Purpose:** Serves as a local scratchpad where developers and agents can store temporary benchmark logs, raw output files, API specifications, or experimental notes.
* **Git Tracking:** The `docs/` folder is explicitly listed in `.gitignore` and is **excluded from version control tracking**.
* **Agent Rule:** Agents may read from or write temporary files to `docs/` during local problem solving without contaminating Git history.

---

## 5. Agent Operational Directives

When modifying, generating, or refactoring code, every agent must respect:
1. **Refer to `DESIGN.md`** for coding practices, naming patterns, and typing discipline.
2. **Preserve i18n Completeness:** Never introduce hardcoded user-facing strings in UI components. Add corresponding keys to both `src/app/i18n/locales/en.ts` and `src/app/i18n/locales/es.ts`.
3. **Preserve Design System Integrity:** Use native CSS variables (`var(--bg)`, `var(--text)`, `var(--accent)`, `var(--border)`). Do not install unapproved CSS libraries.
4. **Virtualization First:** Always virtualize log lines; never map an unbounded array into React DOM nodes.
5. **Clean IPC Boundaries:** Keep native OS interactions (file dialogs, raw file reading, clipboard access) strictly inside `electron/` and expose them via safe contextBridge channels in `electron/preload.cts`.
