---
contentId: bat-f7-u7-l3
courseId: bateria
phase: 7
unit: 7
unitSlug: fase-7-unidad-7
slug: leer-escribir-resolver
kind: lesson
order: 3
title: "Leer, escribir y resolver ciclos métricos"
summary: "Generaliza la polimetría a 2/4 sobre 3/4, calcula realineaciones mediante una unidad común y aprende a recuperar una capa sin reiniciar arbitrariamente la otra."
duration: 25–30 min
competencies: [J7, J5, J6, C1, C2, C3, C4, D4, D6, F2, K2, K3, K5]
rudiments: []
published: true
---

## Objetivo

Pasar de un ejemplo aprendido a una regla transferible:

> **si dos métricas comparten una unidad temporal, sus comienzos vuelven a coincidir cuando ambas han completado un número entero de sus ciclos.**

Trabajaremos `2/4 ↔ 3/4` para comprobar que entiendes el procedimiento y no sólo recuerdas `3/4 ↔ 4/4`.

<div data-notation-score data-score-src="/bateria/notation/f7/u7/f7-u7-polymeter-2-4-over-3-4.musicxml" data-score-title="70.U7 — Transporte polimétrico 2/4 sobre 3/4" data-score-badge="EJERCICIO ORIGINAL CREADO PARA ESTE CURSO"></div>

## Calcular con una unidad común

En este ejemplo ambas métricas usan negras del mismo valor temporal:

- `2/4` = 2 negras por barra;
- `3/4` = 3 negras por barra.

La realineación ocurre tras:

`mcm(2,3) = 6 negras`

Por tanto:

`3 barras de 2/4 = 2 barras de 3/4 = 6 negras`

El mínimo común múltiplo es una herramienta para **predecir** el punto de reencuentro. Después debes poder sentirlo y ejecutarlo.

## Comparación con 3/4 ↔ 4/4

| Capas | Unidad común | Realineación | Barras de la primera | Barras de la segunda |
|---|---|---:|---:|---:|
| `3/4 ↔ 4/4` | negra | 12 negras | 4 | 3 |
| `2/4 ↔ 3/4` | negra | 6 negras | 3 | 2 |

La lógica es la misma aunque cambie la longitud del ciclo global.

## Leer la partitura de transporte

El archivo embebido usa `3/4` como barra gráfica global porque el renderer actual requiere un único compás escrito por medida.

Interpreta:

- voz superior: ciclo métrico de `2/4`;
- voz inferior: ciclo métrico de `3/4`;
- los acentos/etiquetas `1` indican los comienzos de barra de cada capa;
- la línea de compás visible pertenece al transporte gráfico, no redefine la capa superior como `3/4`.

La realineación ocurre al comenzar la tercera barra gráfica, es decir, después de 6 negras.

## EJERCICIO ORIGINAL CREADO PARA ESTE CURSO — E: leer antes de tocar

Sin reproducir el audio:

1. localiza todos los `1` de `2/4`;
2. localiza todos los `1` de `3/4`;
3. marca dónde coinciden;
4. calcula cuántas barras completa cada capa;
5. sólo después toca.

El objetivo es que la notación sea una representación comprensible, no una animación que sigues pasivamente.

## EJERCICIO ORIGINAL CREADO PARA ESTE CURSO — F: escribir una línea temporal

Dibuja seis posiciones de negra:

`1 2 3 4 5 6`

Debajo marca comienzos de `2/4`:

`X . X . X .`

Y comienzos de `3/4`:

`X . . X . .`

El siguiente punto, posición 7 del flujo continuo, vuelve a ser `X` para ambas capas.

Después transforma esta tabla en conteo:

- `2/4`: `1 2 | 1 2 | 1 2`;
- `3/4`: `1 2 3 | 1 2 3`.

## EJERCICIO ORIGINAL CREADO PARA ESTE CURSO — G: diseñar un ejemplo sencillo

Escoge dos longitudes de barra en negras entre:

`2 / 3 / 4`

Condiciones:

- ambas comparten duración de negra;
- calcula el `mcm` antes de tocar;
- escribe los comienzos de barra de ambas capas;
- predice cuántas barras completa cada una;
- comprueba el resultado tocando o vocalizando.

No uses todavía denominadores distintos ni cambios de tempo. Eso añadiría variables que U7 no necesita para demostrar J7.

## Recuperación: conservar una capa como ancla

En polimetría puede ocurrir que pierdas una de las dos cuentas.

No intentes reconstruir ambas desde cero mientras sigues tocando.

### Protocolo

`detecta la capa perdida → conserva la capa estable → localiza su siguiente 1 → reconstruye la unidad común → reentra en la otra capa en un punto conocido`

Ejemplo `3/4 ↔ 4/4`:

- si pierdes `3/4`, mantén `4/4`;
- sigue negras comunes;
- usa tu conocimiento de la posición dentro del ciclo de 12;
- reintroduce el siguiente `1` de `3/4` correcto.

## EJERCICIO ORIGINAL CREADO PARA ESTE CURSO — H: fallo deliberado

En `2/4 ↔ 3/4`:

1. toca un ciclo correcto;
2. en el siguiente ciclo omite deliberadamente un `1` de `2/4`;
3. no detengas `3/4`;
4. recupera el próximo comienzo correcto de `2/4`;
5. continúa hasta la realineación.

Omitir un sonido no debe desplazar la métrica interna.

## Error frecuente: calcular bien pero no sentirlo

Saber que `mcm(3,4)=12` no demuestra competencia musical.

### Prueba

Toca sin contar números de posiciones. ¿Puedes anticipar el reencuentro como llegada formal?

Si no, alterna:

`calcular → contar → tocar → escuchar → tocar sin cálculo verbal`.

## Error frecuente: sentir una sola métrica y memorizar el resto

### Prueba

Detén momentáneamente los ataques de una capa pero sigue contando su métrica en voz alta. Si no puedes reentrar en su siguiente `1`, esa capa no está suficientemente representada internamente.

## Criterio de avance

Puedes calcular y ejecutar `2/4 ↔ 3/4`, leer la partitura de transporte, escribir un ejemplo sencillo, explicar dónde se realinea y recuperar una capa sin reiniciar arbitrariamente la otra.