# Aprendo — Arquitectura v1.0

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
- **Node.js** con el adaptador oficial de Astro en modo standalone cuando se active el backend.
- **SQLite** como almacenamiento persistente.
- **Nginx** como proxy HTTPS y protección actual mediante Basic Auth.
- **GitHub + GitHub Actions** para código, revisión y despliegue.

No habrá un backend separado mientras Astro pueda resolver el problema limpiamente.

## Estructura lógica

```text
src/
├── platform/
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
    ├── bateria/
    └── api/
```

La estructura física definitiva se ajustará a las convenciones de Astro al inicializar el proyecto, manteniendo esta separación conceptual.

## Rutas

- `/` — entrada de Aprendo.
- `/bateria/` — curso de batería.
- `/escalada/` — futuro curso de escalada.
- `/api/` — operaciones dinámicas de la plataforma.

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

La aplicación se diseñará para varios usuarios desde el modelo de datos, pero en v1 habrá un único usuario interno y **no habrá login, grupos ni interfaz de permisos**.

Nginx Basic Auth seguirá protegiendo toda la aplicación hasta que exista autenticación propia.

El registro de progreso será deliberadamente mínimo. Sólo se almacenará lo necesario para reconstruir el historial y decidir el siguiente paso; las notas serán opcionales y de texto.

Principio: **registrar automáticamente lo que pueda deducirse y preguntar sólo lo que tenga valor real**.

La aplicación accederá a SQLite mediante una pequeña capa de repositorios/servicios; los componentes de interfaz no ejecutarán SQL directamente.

## Offline

Aprendo v1 será una aplicación web online.

- No PWA.
- No sincronización offline.
- No resolución de conflictos entre dispositivos.

Cualquier dispositivo conectado verá el mismo estado porque el VPS es la fuente de verdad.

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

V1 mantiene la protección actual de Nginx Basic Auth.

La arquitectura no impedirá añadir posteriormente:

- usuarios reales;
- autenticación propia;
- roles `student` y `admin`;
- sesiones seguras.

No se implementará esa funcionalidad hasta que exista una necesidad real.

Nunca se almacenarán secretos, SQLite, backups o datos personales dentro del repositorio público/privado de código.

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
- API básica;
- lógica de progreso cuando exista;
- herramientas con lógica relevante.

Observabilidad mínima:

- logs de aplicación útiles;
- health check;
- errores controlados;
- logs de despliegue.

No se perseguirá cobertura de tests alta ni un sistema complejo de monitorización.

## Despliegue

GitHub Actions seguirá siendo el punto de despliegue.

Cuando Aprendo pase de HTML estático a aplicación Node:

1. build;
2. tests básicos;
3. backup previo si existe una migración de datos;
4. migraciones SQLite versionadas;
5. despliegue;
6. health check.

El despliegue nunca podrá borrar ni sobrescribir la base SQLite.

## Fuera de alcance de v1

- PostgreSQL/MySQL.
- Redis.
- Microservicios.
- PWA/offline.
- CMS.
- Login propio.
- Gestión visible de usuarios/roles.
- Subida de fotos/audio/vídeo.
- Hosting propio de vídeo.
- Monitorización compleja.
- Formularios extensos de progreso.

## Criterio de diseño

> Aprendo debe sentirse como una versión mucho mejor de unos Markdown + una hoja de cálculo, no como administrar un LMS.
