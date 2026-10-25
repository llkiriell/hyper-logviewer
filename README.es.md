<p align="center">
  <img src="./public/icon.svg" width="80" height="80" alt="Hyper LogViewer Logo" />
</p>

<h1 align="center">Hyper LogViewer</h1>

<p align="center">
  <a href="README.md">🇺🇸 Read in English</a> | <strong>🇪🇸 Leer en Español</strong>
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

**hyper-logviewer** es un visor de archivos `.log` de escritorio, ultrarrápido y *local-first*, concebido para la inspección, filtrado y diagnóstico eficiente de registros de depuración, trazas de errores y auditoría.

hyper-logviewer combina un diseño minimalista y moderno con un sistema de tokens CSS puros (modo claro/oscuro y paletas de acento), diálogo modal de configuración y navegación multi-pestaña, incorporando un motor de renderizado virtualizado para navegar fluidamente por millones de líneas de log a 60 FPS sin bloquear la memoria ni la interfaz gráfica.

---

## Características Principales

* **Navegación por pestañas (Multi-log):** Soporte simultáneo para múltiples fuentes de log con desplazamiento horizontal suave, atajos rápidos (`Ctrl+T`, `Ctrl+W`, `Ctrl+1..9`) y cierres individuales.
* **Triple vía de entrada de registros:**
  * **Explorador Nativo:** Diálogo del sistema operativo con selección de archivo rápida (`Ctrl+O`).
  * **Arrastrar y Soltar (Drag & Drop):** Zona receptora tanto en la vista inicial como arrastrando directamente archivos sobre la barra de pestañas.
  * **Pegado Directo del Portapapeles:** Botón superior y atajo global `Ctrl+V` que genera una pestaña en memoria con el contenido crudo formateado de forma instantánea.
* **Visor virtualizado de alto rendimiento:** Renderizado con `@tanstack/react-virtual` para garantizar 60 FPS estables con mínimo consumo de RAM, incluso con archivos de cientos de megabytes o millones de registros.
* **Rainbow Brackets & Coincidencia de Pares:**
  * Coloreado jerárquico por niveles de profundidad para llaves `{}` y corchetes `[]`.
  * Resaltado visual interactivo al pasar el cursor o hacer clic sobre cualquier par delimitador.
  * Integración completa tanto en la línea virtualizada como en el bloque de inspección JSON.
* **Extracción Inteligente de Metadatos:**
  * Detección automática en tiempo real de **UUIDs**, **URLs** y **Rutas de archivo** completas.
  * Botón de copiado al portapapeles con solo pasar el cursor (*hover*) para agilizar flujos de depuración.
* **Gestión Avanzada de Trazas Java y Continuaciones Multilínea:**
  * Detección estricta de excepciones Java (`java.lang.*Exception`, bloques `at ...`, `Caused by:`).
  * Continuidad visual para líneas de continuación: el nivel UNKNOWN se suprime en los saltos de línea para mostrar un tinte suave correspondiente a la severidad del error principal.
  * El visor detallado consolida el árbol completo de la excepción para su análisis íntegro.
* **Soporte Especializado para Jenkins & Git Pipelines:**
  * Resaltado automático de ramas Git (`feature/...`, `bugfix/...`, `develop`).
  * Identificación de comandos e integraciones (`git merge`, conflictos).
  * Estadísticas de *diff* coloreadas (números en azul, inserciones `+` en verde y eliminaciones `-` en rojo).
* **Foco de Línea Dinámico y Personalizable:**
  * Borde continuo de foco coloreado según la severidad del registro (rojo para error, ámbar para warn, azul para info, etc.).
  * Selector de icono indicador en Configuración (manito 👉, flecha ➡️, chevron ❯, caret ▶, diana 🎯, estrella ★, etc.).
* **Filtro de Fondo Limpio para INFO:** Opción configurable para retirar el fondo a los registros de nivel INFO manteniendo una legibilidad impecable.
* **Carpetas Observadas (Watched Folders):** Barra lateral colapsable para monitorear directorios locales de logs con recarga y apertura en un clic.
* **Autoscroll Inteligente:** Modos continuo y cola (*tail mode*) con velocidad graduable y pausa automática al interactuar con el scroll.
* **Internacionalización (i18n) Bilingüe:** Inglés (`en`) y Español (`es`) integrados con cambio instantáneo sin recargar la aplicación.
* **Tooltips Modernos Flotantes:** Renderizado dinámico fuera del árbol DOM con `@floating-ui/dom` adaptado al tema.

---

## Pila Tecnológica (Tech Stack)

| Componente | Tecnología | Versión |
| :--- | :--- | :--- |
| **Entorno de Escritorio** | Electron | ^34.2.0 |
| **Empaquetador / Bundler** | Vite | ^6.2.0 |
| **Lenguaje** | TypeScript | ^5.8.0 |
| **Biblioteca de UI** | React | ^19.1.0 |
| **Virtualización de Registros** | `@tanstack/react-virtual` | ^3.13.2 |
| **Posicionamiento de Tooltips** | `@floating-ui/dom` | ^1.8.0 |
| **Librería de Iconos** | Tabler Icons (`@tabler/icons-react`) | ^3.31.0 |
| **Motor de Internacionalización** | Custom Typed i18n Engine | Nativo (`en` / `es`) |
| **Sistema de Estilos** | Pure CSS Tokens (`tokens.css`, `app.css`) | Estándar W3C |

---

## Estructura del Repositorio

```
hyper-logviewer/
├── docs/                     # Carpeta local para logs de prueba y scratchpad (excluida de Git)
├── electron/
│   ├── main.cts              # Proceso principal: ventanas, menú nativo, IPC
│   └── preload.cts           # ContextBridge seguro (lectura de archivos, portapapeles)
├── src/
│   ├── core/                 # Lógica pura TypeScript (parsers, regex, brackets, tipos)
│   ├── app/
│   │   ├── i18n/             # Motor i18n tipado y diccionarios (en.ts, es.ts)
│   │   ├── components/       # Componentes UI (TabBar, VirtualLogView, VirtualLogRow)
│   │   │   └── settings/     # Modal de configuración modular y pestaña Acerca de
│   │   ├── platform/         # Puente Electron y preferencias persistentes
│   │   ├── styles/           # Tokens CSS, temas claro/oscuro y reglas visuales
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

Este repositorio sigue una convención estricta descrita en [`AGENTS.md`](AGENTS.md):
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
