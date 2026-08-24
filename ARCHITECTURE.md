# Aprendo — Arquitectura v1.1

## Objetivo

Aprendo sustituye una combinación de documentos Markdown y hojas de cálculo por una aplicación web más cómoda, coherente y automática.

Regla principal: **hacerlo bien sin convertirlo en una plataforma innecesariamente compleja**.

## Principios

- Código limpio, legible, tipado y mantenible.
- Arquitectura simple; no microservicios ni infraestructura innecesaria.
- Plataforma y cursos desacoplados.
- Las herramientas pertenecen a la plataforma y pueden reutilizarse en cualquier curso.
- El contenido pertenece a cada curso.
- El progreso debe requerir la mínima burocracia posible.
- No implementar ahora necesidades hipotéticas; sí evitar decisiones que bloqueen una evolución razonable.

## Stack

- **Astro + TypeScript** para interfaz, contenido y rutas servidor.
- **Node.js** con el adaptador oficial de Astro en modo standalone.
- **SQLite** como almacenamiento persistente.
- **Nginx** como proxy HTTPS; la autenticación pertenece a Aprendo, no a Nginx.
- **GitHub + GitHub Actions** para código, revisión y despliegue.

No habrá un backend separado mientras Astro pueda resolver el problema limpiamente.

## Estructura lógica

```text
src/
├── platform/
│   ├── auth/
│   ├── components/
│   ├── layouts/
│   ├── styles/
│   ├── tools/
│   ├── progress/
│   ├── notation/
│   └── data/
├── courses/
│   ├── bateria/
│   │   ├── content/
│   │   ├── assets/
│   │   └── course.config.ts
│   └── escalada/              # futuro
└── pages/
    ├── index.astro
    ├── login.astro
    ├── bateria/
    └── api/
```

La estructura física definitiva se ajustará a las convenciones de Astro, manteniendo esta separación conceptual.

## Rutas

- `/login/` — única entrada pública de usuario.
- `/` — entrada autenticada de Aprendo.
- `/bateria/` — curso de batería.
- `/escalada/` — futuro curso de escalada.
- `/api/` — operaciones dinámicas de la plataforma.
- `/api/health/` — health check público sin datos de usuario.

## Diseño

- Responsive.
- Dispositivo principal de validación: tablet Lenovo en horizontal.
- Debe funcionar correctamente también en portátil, móvil y tablet vertical.
- Touch-first: ninguna función esencial dependerá de hover.
- Tema `Sistema / Claro / Oscuro`.
- Por defecto se respeta `prefers-color-scheme`.
- Colores definidos mediante tokens semánticos para que ambos temas sean equivalentes.
- Contraste, foco, zoom y reducción de movimiento se tendrán en cuenta desde el inicio.

## Contenido

- Lecciones y texto: Markdown/MDX con metadatos estructurados.
- Los contenidos se validan durante build.
- Cada entidad curricular tendrá un ID estable independiente de su título, archivo o URL.
- GitHub es la fuente del contenido publicado y del código.
- No habrá CMS en v1.

## Datos y progreso

SQLite será la fuente de verdad de los datos operativos.

El archivo de base de datos estará fuera del webroot, por ejemplo:

```text
/var/lib/aprendo/aprendo.sqlite
```

El modelo soporta varios usuarios y todo progreso/evidencia se asocia al usuario autenticado. No existe registro público ni gestión visible de usuarios en esta etapa.

El registro de progreso será deliberadamente mínimo. Sólo se almacenará lo necesario para reconstruir el historial y decidir el siguiente paso; las notas serán opcionales y de texto.

Principio: **registrar automáticamente lo que pueda deducirse y preguntar sólo lo que tenga valor real**.

La aplicación accederá a SQLite mediante una pequeña capa de repositorios/servicios; los componentes de interfaz no ejecutarán SQL directamente.

## Autenticación

Aprendo posee su propia autenticación de plataforma.

- Todas las páginas y APIs de usuario quedan bloqueadas por middleware de Astro.
- `/login/`, su endpoint de autenticación, los assets necesarios y `/api/health/` son las únicas excepciones públicas.
- No existe formulario de registro, recuperación de contraseña ni opción «recordarme».
- Las contraseñas se almacenan mediante `scrypt`; nunca en texto plano.
- Las sesiones usan tokens aleatorios opacos y SQLite sólo conserva un hash SHA-256 del token.
- La cookie de sesión es `HttpOnly`, `Secure`, `SameSite=Strict` y de sesión de navegador.
- La expiración servidor de una sesión es limitada y se comprueba en cada petición protegida.
- Nginx termina HTTPS y reenvía las peticiones al runtime Node; no mantiene Basic Auth en producción una vez activada esta capa.

## Offline

Aprendo v1 será una aplicación web online.

- No PWA.
- No sincronización offline.
- No resolución de conflictos entre dispositivos.

Cualquier dispositivo conectado verá el mismo estado del usuario porque el VPS es la fuente de verdad.

## Herramientas

Todas las herramientas son reutilizables y pertenecen a `platform/tools`.

Ejemplos:

- metrónomo;
- temporizador;
- reproductor de audio;
- visor/reproductor de partituras;
- futuras herramientas comunes.

Los cursos sólo proporcionan configuración y contenido a esas herramientas.

## Partituras

Decisión basada en `INVESTIGACION_TECNICA_PARTITURAS_WEB_2026.md`.

Arquitectura prevista:

- **MusicXML 4.0** como formato canónico musical.
- JSON tipado de Aprendo como metadata pedagógica separada.
- `.mscz` conservado cuando exista como fuente de autoría.
- **alphaTab** como primer renderer/player a evaluar.
- **Verovio** como alternativa estratégica.
- VexFlow sólo para widgets o excepciones de bajo nivel.
- MuseScore para autoría y, inicialmente, PDF/A4 cuando sea necesario.

El renderer estará detrás de una interfaz propia de Aprendo para poder sustituirlo sin reescribir el curso.

**alphaTab no se considera adoptado hasta superar una PoC de batería real** con flams, drags, rolls, ghost notes, noteheads de percusión, varias voces, tuplets y métricas irregulares.

## Multimedia

El contenido multimedia pesado se alojará externamente y se enlazará o incrustará desde Aprendo.

No se utilizará Git ni el VPS como repositorio de vídeo.

## Seguridad

- La autenticación propia sustituye a Nginx Basic Auth.
- El middleware de aplicación es la frontera principal de acceso a páginas y APIs.
- Los datos de progreso se resuelven siempre contra el usuario de la sesión actual.
- Las escrituras mantienen comprobación same-origin además de sesión válida.
- Nunca se almacenarán secretos, contraseñas en claro, SQLite, backups o datos personales dentro del repositorio de código.
- La gestión de credenciales de usuarios existentes se realizará fuera de la interfaz pública mientras no exista una necesidad real de administración visible.

La arquitectura permite añadir posteriormente roles como `student` y `admin` sin cambiar el modelo de cursos.

## Backups

- Backup consistente de SQLite una vez por semana.
- Retención máxima: las últimas **3 copias**.
- Copia externa manual ocasional en Google Drive.
- Google Drive no es una dependencia de ejecución de Aprendo.

## Tests y observabilidad

Tests básicos centrados en permitir cambios seguros:

- build;
- lectura/escritura de SQLite;
- migraciones;
- autenticación y expiración de sesiones;
- frontera de acceso sin sesión;
- API básica;
- lógica de progreso;
- herramientas con lógica relevante.

Observabilidad mínima:

- logs de aplicación útiles;
- health check;
- errores controlados;
- logs de despliegue.

No se perseguirá cobertura de tests alta ni un sistema complejo de monitorización.

## Despliegue

GitHub Actions seguirá siendo el punto de despliegue.

Aprendo se ejecuta como aplicación Node renderizada en servidor:

1. check y tests;
2. build;
3. migraciones SQLite versionadas al arrancar;
4. despliegue del runtime;
5. health check directo;
6. validación segura de la configuración Nginx;
7. comprobación HTTPS de la frontera de autenticación.

El despliegue nunca podrá borrar ni sobrescribir la base SQLite.

## Fuera de alcance de v1

- PostgreSQL/MySQL.
- Redis.
- Microservicios.
- PWA/offline.
- CMS.
- Registro público de usuarios.
- Recuperación automática de contraseña.
- Gestión visible de usuarios/roles.
- Hosting propio de vídeo.
- Monitorización compleja.
- Formularios extensos de progreso.

## Criterio de diseño

> Aprendo debe sentirse como una versión mucho mejor de unos Markdown + una hoja de cálculo, no como administrar un LMS.
