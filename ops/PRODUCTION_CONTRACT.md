# Contrato de producción de Aprendo

Este documento describe únicamente la infraestructura que el repositorio necesita y puede verificar. No pretende reconstruir decisiones externas no observadas ni guardar secretos.

## Contrato versionado

La producción debe cumplir estas condiciones:

- Node se ejecuta desde `/opt/aprendo-node/bin/node`.
- Los releases son inmutables bajo `/opt/aprendo/runtime/releases/<sha>`.
- `/opt/aprendo/runtime/current` es un enlace simbólico al release activo.
- El runtime estable de systemd termina ejecutando `server/entry.mjs` a través de `/opt/aprendo/runtime/server/entry.mjs` o `/opt/aprendo/runtime/current/server/entry.mjs`.
- `aprendo.service` está activo.
- El endpoint interno `http://127.0.0.1:4321/api/health/` responde con estado `ok`.
- SQLite persiste en `/var/lib/aprendo/aprendo.sqlite` y `aprendo.service` declara explícitamente ese mismo `APRENDO_DB_PATH`.
- Los avatares persisten en `/var/lib/aprendo/avatars`.
- Antes de activar un release, el despliegue crea mediante la API de backup de SQLite una copia coherente de la base y un snapshot de avatares con el mismo prefijo en `/var/lib/aprendo/backups`.
- La cuenta de despliegue necesita únicamente `restart`, `start` e `is-active` sobre `aprendo.service`; el flujo ordinario no requiere permiso para `stop`.
- La activación cambia atómicamente el enlace `current` y usa `systemctl restart aprendo.service`. Ese reinicio también descarta estado exclusivamente en memoria, incluidos los contadores del limitador de login.
- Si la salud del release nuevo falla, el enlace `current` vuelve al release anterior y el servicio se reinicia sobre ese código. El release fallido se elimina inmediatamente.
- Una base SQLite abierta por un proceso vivo nunca se sobrescribe durante un rollback automático. Por esta razón, todas las migraciones de despliegue deben ser compatibles hacia atrás con el release inmediatamente anterior. Las copias pre-deploy quedan disponibles para recuperación operativa deliberada, no para restauración automática bajo un proceso vivo.
- La retención de copias pre-deploy elimina cada pareja SQLite/avatares de forma conjunta.
- Los releases inactivos se podan antes de staging para impedir acumulaciones después de despliegues fallidos.
- Nginx tiene el host `aprendo.molacomer.com`, escucha HTTPS y proxifica a `127.0.0.1:4321`.
- Los prefijos privados `/bateria/notation/` y `/bateria/materiales/` están protegidos por la sesión de la aplicación en Nginx.

`ops/verify-production-contract.sh` comprueba el runtime, systemd, SQLite, credenciales estructuralmente utilizables, versión de esquema y salud interna. El workflow comprueba además el comportamiento HTTPS observable del proxy y de las rutas protegidas.

## Nginx es infraestructura estable

La configuración de Nginx no cambia con cada release de Aprendo y no se reescribe ni recarga desde el usuario de despliegue ordinario. El workflow verifica desde fuera que HTTPS, redirecciones, API y recursos privados siguen comportándose como exige la plataforma.

Si una versión futura necesita cambiar Nginx, ese cambio debe hacerse mediante un procedimiento de infraestructura explícitamente privilegiado y verificable, separado del despliegue normal de la aplicación. No se amplían permisos `sudo` del usuario de deploy solo para que una tarea release-scoped modifique infraestructura estable.

## Política de datos persistentes

SQLite y los avatares forman el estado persistente de usuario. Las copias pre-deploy son puntos de recuperación operativa y deben conservar la correspondencia entre la base y el snapshot de avatares.

El rollback automático de un release es un rollback **de código**, no una restauración en caliente de datos. Cualquier migración nueva que impida ejecutar temporalmente el release anterior viola este contrato y debe diseñarse como una transición compatible en varias fases.

Las copias pre-deploy no sustituyen una estrategia completa de disaster recovery externa. Una copia fuera del VPS puede añadirse en el futuro sin cambiar esta regla de coherencia.

## Infraestructura deliberadamente externa

No se guardan en Git:

- claves privadas, certificados o credenciales en claro;
- valores de GitHub Actions Secrets;
- la configuración completa del firewall del servidor;
- rutas concretas de certificados administradas externamente;
- datos de usuarios, SQLite, avatares o copias de seguridad.

Tampoco se inventa una unidad systemd completa cuando el repositorio no conoce todavía de forma verificable su `User`, endurecimiento o demás opciones. En su lugar, el repositorio versiona y comprueba el contrato de `ExecStart`, estado y rutas que la aplicación necesita.

Si en el futuro se adopta una unidad systemd canónica o una configuración Nginx completamente gestionada por este repositorio, este documento debe actualizarse y la comprobación efectiva seguir siendo la fuente de verificación de deriva.
