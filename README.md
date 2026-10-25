# hyper-logviewer

![Electron](https://img.shields.io/badge/Electron-34.x-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19.1-23272f?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)
![Tabler Icons](https://img.shields.io/badge/Icons-Tabler-0054a6)
![Virtual Scroller](https://img.shields.io/badge/Scroll-TanStack%20Virtual-FF4154)
![i18n](https://img.shields.io/badge/i18n-English%20|%20Español-blue)
![Co-author](https://img.shields.io/badge/Co--author-Antigravity%20(AGY)-E65100?logo=google)

**hyper-logviewer** es un visor de archivos `.log` de escritorio, ultrarrápido y *local-first*, concebido para la inspección, filtrado y diagnóstico eficiente de registros de depuración y auditoría. 

Inspirado en la estética minimalista, el andamiaje técnico y la experiencia de usuario de [Morrow](https://github.com/Aarav2709/Morrow), hyper-logviewer adopta su sistema de estilos por tokens CSS puros (modo claro/oscuro y paletas de acento), su diálogo modal de configuración y su arquitectura de navegación por pestañas (`TabBar`), incorporando un motor de renderizado virtualizado para navegar fluidamente por millones de líneas de log a 60 FPS sin bloquear la memoria ni la interfaz.

---

## Características Principales

* 📑 **Navegación por Pestañas (Multi-log):** Soporte simultáneo para múltiples fuentes de log con desplazamiento horizontal suave, atajos rápidos (`Ctrl+T`, `Ctrl+W`, `Ctrl+1..9`) y cierres individuales.
* 📂 **Triple Vía de Entrada de Logs:**
  * **Explorador Nativo:** Diálogo del sistema operativo con selección de archivo rápida (`Ctrl+O`).
  * **Arrastrar y Soltar (Drag & Drop):** Zona receptora tanto en la vista inicial como arrastrando directamente archivos sobre la barra de pestañas.
  * **Pegado Directo del Portapapeles (Clipboard Paste):** Botón superior y atajo global `Ctrl+V` que genera una pestaña en memoria con el contenido crudo formateado y numerado de forma instantánea.
* ⚡ **Visor Virtualizado de Alto Rendimiento:** Renderizado con `@tanstack/react-virtual` para garantizar 60 FPS con mínimo uso de RAM, incluso con archivos de cientos de megabytes.
* 🎨 **Estilo Visual Limpio y Temas Bimodales:** Modo Claro, Modo Oscuro (automático según preferencias del sistema operativo) y selección de colores de acento (`Ember`, `Ocean`, `Aqua`, `Violet`).
* 🌐 **Internacionalización (i18n) Bilingüe:** Inglés (`en`) como idioma predeterminado y Español (`es`) completamente integrado, con cambio en tiempo real sin recargar la aplicación.
* ⚙️ **Modal de Configuración con Pestaña «Acerca de»:** Diálogo modal flotante con selector segmentado para gestionar Idioma, Apariencia, Parser, Atajos y la vista **Acerca de** con detalles de versión y repositorio.
* 🔣 **Iconografía Tabler Icons:** Estética vectorial uniforme basada en trazos limpios (`@tabler/icons-react` con `stroke={1.5}`).

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

Este proyecto ha sido concebido y desarrollado en estrecha colaboración entre el autor principal y **Antigravity (AGY)**, el agente avanzado de ingeniería de software desarrollado por el equipo de Google DeepMind.

> **Nota de gobernanza:** Conforme a las políticas del proyecto establecidas en [`AGENTS.md`](AGENTS.md), la coautoría y créditos de AGY se reconocen formalmente en esta documentación y en la vista «Acerca de» de la interfaz gráfica, manteniéndose expresamente **fuera del historial de commits de Git** para preservar un historial de autoría unificado y estándar.
