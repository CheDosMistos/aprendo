# Provisión y rotación de credenciales

Las migraciones de base de datos no deben actuar como mecanismo ordinario para gestionar contraseñas. Una instalación nueva crea los registros base sin `password_hash`; las credenciales se activan y rotan de forma explícita fuera de Git.

La única excepción histórica es la migración de compatibilidad que recupera el administrador `default/mallo` creado antes del endurecimiento de autenticación de agosto de 2026. Esa migración se ejecuta una sola vez y nunca vuelve a imponer una contraseña después de aplicada.

## Regla de compatibilidad

La política de longitud para contraseñas nuevas **no es retroactiva**. Una contraseña ya almacenada sigue siendo válida hasta que su usuario decida cambiarla. Las migraciones ordinarias y la provisión inicial no sobrescriben una contraseña existente.

## Provisión inicial

La contraseña se entrega por `stdin`, nunca como argumento de línea de comandos:

```bash
read -rsp 'Nueva contraseña: ' APRENDO_PASSWORD; printf '\n'
printf '%s' "$APRENDO_PASSWORD" | npm run provision-user -- \
  --stable-key default \
  --username mallo \
  --display-name Administrador \
  --role admin
unset APRENDO_PASSWORD
```

El comando usa `APRENDO_DB_PATH` cuando está definido y, en caso contrario, la ruta de producción configurada por la aplicación.

Para crear otro usuario se cambia `--stable-key`, `--username`, `--display-name` y `--role`. Si el `stable-key` ya tiene una contraseña, el comando aborta sin modificarla.

## Rotación o recuperación de una contraseña existente

La recuperación no se hace modificando migraciones ni escribiendo hashes a mano. Se usa el comando explícito de rotación:

```bash
read -rsp 'Nueva contraseña: ' APRENDO_PASSWORD; printf '\n'
printf '%s' "$APRENDO_PASSWORD" | npm run reset-user-password -- \
  --stable-key default
unset APRENDO_PASSWORD
```

El comando:

- exige la política vigente para contraseñas nuevas;
- cambia únicamente el `password_hash` del usuario indicado;
- no cambia login, nombre visible ni rol;
- revoca todas las sesiones anteriores de ese usuario;
- aborta si el usuario no existe;
- nunca recibe la contraseña como argumento de proceso.

El limitador de intentos de login vive en memoria del proceso. Tras una recuperación administrativa fuera de la aplicación, reinicia `aprendo.service` para descartar inmediatamente cualquier bloqueo previo:

```bash
sudo -n /usr/bin/systemctl restart aprendo.service
```

El despliegue normal también reinicia el servicio y, por tanto, limpia esos contadores de proceso.
