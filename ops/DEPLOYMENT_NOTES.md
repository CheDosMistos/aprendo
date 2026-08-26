# Deployment notes

## 2026-08-26 — Fase 2 U1 L2

`Deploy aprendo` is triggered by pushes to `main`. During publication of `20.U1.L2 — Fluidez binaria sin memorizar dibujos`, the squash merge and a low-level ref-only empty commit did not create a GitHub Actions push run through the integration in use. This documentation commit was created through the GitHub Contents API to produce a normal content push without changing application runtime or curriculum behavior.
