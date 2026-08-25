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
- SQLite persiste en `/var/lib/aprendo/aprendo.sqlite`.
- Los avatares persisten en `/var/lib/aprendo/avatars` y forman parte del mismo estado lógico que SQLite.
- Antes de activar un release, con el servicio parado, el despliegue crea una copia coherente de SQLite y un snapshot de avatares con el mismo prefijo en `/var/lib/aprendo/backups`.
- Si la activación falla, SQLite y el snapshot de avatares se restauran juntos antes de volver a arrancar el release anterior.
- La retención de copias pre-deploy elimina cada pareja SQLite/avatares de forma conjunta.
- Nginx tiene el host `aprendo.molacomer.com`, escucha HTTPS y proxifica a `127.0.0.1:4321`.
- Los prefijos privados `/bateria/notation/` y `/bateria/materiales/` están protegidos por la sesión de la aplicación en Nginx.

`ops/verify-production-contract.sh` comprueba estas condiciones sobre la configuración efectiva. El despliegue debe ejecutar esa comprobación después de activar el release y recargar Nginx.

## Política de datos persistentes

SQLite y los avatares se consideran una única unidad de restauración porque `avatar_version` vive en la base de datos mientras el fichero WebP vive en el filesystem. No debe restaurarse deliberadamente una copia histórica de uno sin el snapshot correspondiente del otro.

Las copias pre-deploy son protección operativa de rollback, no una estrategia completa de disaster recovery externa. Una copia fuera del VPS puede añadirse en el futuro sin cambiar esta regla de coherencia.

## Infraestructura deliberadamente externa

No se guardan en Git:

- claves privadas, certificados o credenciales;
- valores de GitHub Actions Secrets;
- la configuración completa del firewall del servidor;
- rutas concretas de certificados administradas externamente;
- datos de usuarios, SQLite, avatares o copias de seguridad.

Tampoco se inventa una unidad systemd completa cuando el repositorio no conoce todavía de forma verificable su `User`, endurecimiento o demás opciones. En su lugar, el repositorio versiona y comprueba el contrato de `ExecStart`, estado y rutas que la aplicación necesita.

Si en el futuro se adopta una unidad systemd canónica o una configuración Nginx completamente gestionada por este repositorio, este documento debe actualizarse y la comprobación efectiva seguir siendo la fuente de verificación de deriva.
