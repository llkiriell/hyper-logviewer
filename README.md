<p align="center">
  <img src="./public/icon.svg" width="80" height="80" alt="Hyper LogViewer Logo" />
</p>

<h1 align="center">Hyper LogViewer</h1>

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

**hyper-logviewer** es un visor de archivos `.log` de escritorio, ultrarrápido y *local-first*, concebido para la inspección, filtrado y diagnóstico eficiente de registros de depuración y auditoría. 

hyper-logviewer combina un diseño minimalista y moderno con un sistema de estilos por tokens CSS puros (modo claro/oscuro y paletas de acento), diálogo modal de configuración y arquitectura de navegación por pestañas (`TabBar`), incorporando un motor de renderizado virtualizado para navegar fluidamente por millones de líneas de log a 60 FPS sin bloquear la memoria ni la interfaz.

---

## Características Principales

* **Navegación por pestañas (Multi-log):** Soporte simultáneo para múltiples fuentes de log con desplazamiento horizontal suave, atajos rápidos (`Ctrl+T`, `Ctrl+W`, `Ctrl+1..9`) y cierres individuales.
* **Triple vía de entrada de registros:**
  * **Explorador Nativo:** Diálogo del sistema operativo con selección de archivo rápida (`Ctrl+O`).
  * **Arrastrar y Soltar (Drag & Drop):** Zona receptora tanto en la vista inicial como arrastrando directamente archivos sobre la barra de pestañas.
  * **Pegado Directo del Portapapeles (Clipboard Paste):** Botón superior y atajo global `Ctrl+V` que genera una pestaña en memoria con el contenido crudo formateado y numerado de forma instantánea.
* **Visor virtualizado de alto rendimiento:** Renderizado con `@tanstack/react-virtual` para garantizar 60 FPS con mínimo uso de RAM, incluso con archivos de cientos de megabytes.
* **Estilo visual limpio y temas bimodales:** Modo Claro, Modo Oscuro (automático según preferencias del sistema operativo) y selección de colores de acento (`Ember`, `Ocean`, `Aqua`, `Violet`).
* **Internacionalización (i18n) bilingüe:** Inglés (`en`) como idioma predeterminado y Español (`es`) completamente integrado, con cambio en tiempo real sin recargar la aplicación.
* **Modal de configuración con pestaña «Acerca de»:** Diálogo modal flotante con selector segmentado para gestionar Idioma, Apariencia, Parser, Atajos y la vista **Acerca de** con detalles de versión y repositorio.
* **Iconografía Tabler Icons:** Estética vectorial uniforme basada en trazos limpios (`@tabler/icons-react` con `stroke={1.5}`).

---

## Pila Tecnológica (Tech Stack)

| Componente | Tecnología | Versión |
| :--- | :--- | :--- |
| **Entorno de Escritorio** | Electron | ^34.2.0 |
| **Empaquetador / Bundler** | Vite | ^6.2.0 |
| **Lenguaje** | TypeScript | ^5.8.0 |
| **Biblioteca de UI** | React | ^19.1.0 |
| **Virtualización de Registros** | `@tanstack/react-virtual` | ^3.13.2 |
| **Librería de Iconos** | Tabler Icons (`@tabler/icons-react`) | ^3.31.0 |
| **Motor de Internacionalización** | Custom Typed i18n Engine | Nativo (`en` / `es`) |
| **Sistema de Estilos** | Pure CSS Variables (`tokens.css`, `color.css`) | Estándar W3C |

---

## Estructura del Repositorio

```
hyper-logviewer/
├── docs/                     # Carpeta local para logs de prueba y scratchpad (excluida de Git)
├── electron/
│   ├── main.cts              # Proceso principal: ventanas, menú, IPC nativo
│   └── preload.cts           # ContextBridge seguro (lectura de archivos, portapapeles)
├── src/
│   ├── core/                 # Lógica pura TypeScript (parsers, regex, tipos)
│   ├── app/
│   │   ├── i18n/             # Motor i18n tipado y diccionarios (en.ts, es.ts)
│   │   ├── components/       # Primitivas UI (Dialog, Switch, TabBar, VirtualLogView)
│   │   │   └── settings/     # Modal de configuración y pestaña Acerca de
│   │   ├── platform/         # Fachadas para puente Electron y preferencias locales
│   │   ├── styles/           # Tokens CSS, temas claro/oscuro y reglas de diseño
│   │   ├── tabs.ts           # Store reactivo para gestión de pestañas
│   │   ├── App.tsx           # Vista orquestadora principal
│   │   └── main.tsx          # Punto de entrada React
├── AGENTS.md                 # Flujo de ramas, commits y directivas para agentes IA
├── DESIGN.md                 # Estándar estricto de diseño, TypeScript y estilos
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Instalación y Desarrollo Local

### Requisitos Previos
* **Node.js** >= 20.x
* **npm** >= 10.x

### Comandos de Desarrollo

```powershell
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo Vite con Hot Module Replacement (HMR)
npm run dev

# Compilar proceso principal y renderer para producción
npm run build

# Ejecutar aplicación de escritorio en Electron
npm run start

# Verificación estricta de tipos de TypeScript
npm run typecheck
```

---

## Modelo de Ramas y Commits

Este repositorio sigue una convención estricta de ramas y mensajes de commit descrita en [`AGENTS.md`](AGENTS.md):
* **Ramas:**
  * `main`: Producción y versiones estables.
  * `dev`: Rama activa de integración principal.
  * `feature/<nombre>`: Ramas de características específicas.
* **Formato de Commits:** `<sustantivo> : <verbo> <descripción>`
  * *Autor (Español):* `visor : implementar virtualizacion de lineas de log`
  * *Comunidad (Inglés):* `viewer : implement log line virtualization`

---

## Reconocimientos y Coautoría

Este proyecto ha sido concebido y desarrollado en estrecha colaboración entre el autor principal y **Antigravity CLI**, el agente avanzado de ingeniería de software desarrollado por el equipo de Google DeepMind.

> **Nota de gobernanza:** Conforme a las políticas del proyecto establecidas en [`AGENTS.md`](AGENTS.md), la coautoría y créditos de Antigravity CLI se reconocen formalmente y de manera exclusiva en esta documentación (README), manteniéndose expresamente **fuera de la interfaz de la aplicación y del historial de commits de Git** para preservar un historial de autoría y una aplicación limpia.
