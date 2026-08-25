# Aprendo

Aplicación web de aprendizaje desplegada en `https://aprendo.molacomer.com`.

El primer curso activo es `/bateria/`; la plataforma se diseña para reutilizar sus herramientas en futuros cursos como `/escalada/`.

La arquitectura acordada está documentada en [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Desarrollo

Requiere Node.js 24.15.0 o superior. `.nvmrc` fija esa versión mínima canónica para desarrollo; CI y despliegue usan la línea Node 24.

Con el lockfile versionado, instala exactamente el grafo resuelto con:

```bash
npm ci
npm run check
npm run dev
```

El build de producción se genera con:

```bash
npm run build
```
