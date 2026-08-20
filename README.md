# Aprendo

Aplicación web de aprendizaje desplegada en `https://aprendo.molacomer.com`.

El primer curso activo es `/bateria/`; la plataforma se diseña para reutilizar sus herramientas en futuros cursos como `/escalada/`.

La arquitectura acordada está documentada en [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Desarrollo

Requiere Node.js 22 o superior.

```bash
npm install
npm run check
npm run dev
```

El build de producción se genera con:

```bash
npm run build
```
