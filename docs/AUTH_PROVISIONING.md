# Provisión de credenciales

Las migraciones de base de datos no contienen contraseñas utilizables. Una instalación nueva crea los registros base sin `password_hash`; las credenciales se activan de forma explícita fuera de Git.

## Regla de compatibilidad

La política de longitud para contraseñas nuevas **no es retroactiva**. Una contraseña ya almacenada sigue siendo válida hasta que su usuario decida cambiarla. Ni las migraciones ni el comando de provisión sobrescriben una contraseña existente.

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
