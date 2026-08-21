# PoC de notación de batería

Fixtures técnicos originales de Aprendo para validar el importador MusicXML y el renderer web.

No son material curricular ni reproducen partituras PAS, métodos o canciones.

- `01-basic-grace-rolls.musicxml`: kit básico, dos voces, ghost note, acento, flam + kick, drag, open hi-hat y tremolo.
- `02-tuplets-meters-noteheads.musicxml`: 5/4, 7/8, 11/8, beaming, noteheads, sticking y tuplets 3:2, 5:4 y 7:4.
- `03-kit-rolls-polyrhythm-ties.musicxml`: 6/8, kit ampliado, two-note tremolo, buzz roll, polirritmo 3:2 y tie entre compases.

## Resultado provisional — 2026-08-20

Prueba real en móvil:

- renderizado funcional;
- cambio entre partituras funcional;
- play/pause funcional;
- audio correcto;
- se detectaron cabezales normales de percusión ausentes en varios pasajes y se hicieron explícitos en MusicXML;
- se hicieron explícitos los brackets/números de tuplets de la batería de prueba;
- se retiraron título/compositor de los fixtures para que el laboratorio no desperdicie espacio de pantalla.

Estado: **prometedor, pero alphaTab todavía no está adoptado definitivamente**.

Pendiente antes de cerrar la PoC:

1. repetir la prueba visual en tablet horizontal y PC;
2. comprobar los fixtures corregidos;
3. repetir la batería con MusicXML exportado por la versión concreta de MuseScore elegida para autoría;
4. revisar cualquier diferencia de notación que siga siendo material para el curso.
