export const SPECIALIZATION_ENTRY_STAGES = [
  'PUEDES EXPLORARLA YA',
  'INICIO PARALELO RAZONABLE',
  'ESPECIALIZACIÓN SERIA',
] as const;

export type SpecializationEntryStage = (typeof SPECIALIZATION_ENTRY_STAGES)[number];

export interface SpecializationTrack {
  id: string;
  title: string;
  summary: string;
  forWhom: string;
  notMeaning: readonly string[];
  competencies: readonly string[];
  phases: readonly string[];
  entry: Readonly<Record<SpecializationEntryStage, string>>;
  contents: readonly string[];
  transfer: readonly string[];
  resources: readonly { title: string; use: string; url: string }[];
  progress: readonly string[];
}

export const SPECIALIZATION_TRACKS: readonly SpecializationTrack[] = [
  {
    id: 'pies-doble-pedal',
    title: 'Técnica avanzada de pies y doble pedal',
    summary: 'Control, balance, articulación, resistencia útil y vocabulario musical de uno y dos pies de bombo.',
    forWhom: 'Metal, extreme metal, progressive, fusion y bateristas que quieran ampliar el lenguaje del bombo sin convertir velocidad en el único objetivo.',
    notMeaning: ['Double bass no equivale a metal.', 'Heel-toe, slide o swivel no son una checklist obligatoria.', 'No existe un objetivo curricular de tocar los 40 PAS con los pies.'],
    competencies: ['H1', 'H2', 'C1', 'C2', 'H4', 'A7', 'K2'],
    phases: ['F4: técnica básica de bombo y coordinación', 'F5: groove y estilos', 'F6+: integración y repertorio'],
    entry: {
      'PUEDES EXPLORARLA YA': 'Escucha, lectura, subdivisión y análisis de usos del doble bombo. Sin pedal, no se simula un volumen físico alto de pedaleo.',
      'INICIO PARALELO RAZONABLE': 'Con kit/pedal, H1 y H2 en mínimo y C1/C2 suficientemente estables.',
      'ESPECIALIZACIÓN SERIA': 'H2 funcional, H4 funcional en patrones básicos y capacidad de mantener balance, dinámica y relajación entre ambos pies.',
    },
    contents: ['Ergonomía y configuración', 'Singles por pie y leading foot', 'Balance bilateral y dinámica', 'Subdivisiones binarias y ternarias', 'Doubles seleccionados', 'Cambios de densidad y endurance contextual', 'Técnicas especializadas cuando resuelvan un problema real', 'Grooves, fills, repertorio y polirritmia aplicada'],
    transfer: ['C2 → subdivisión de pies', 'B1/B2 → patrones seleccionados', 'H5 → groove', 'D4/D5 → lectura', 'K2 → diagnóstico técnico'],
    resources: [
      { title: 'Joe Franco — Double Bass Drumming', use: 'Sistema progresivo de double bass; seleccionar material según objetivo.', url: 'https://www.alfred.com/products/double-bass-drumming-00-el03835' },
      { title: 'George Kollias — Double Bass / Extreme Double Bass', use: 'Contrastar material introductorio y avanzado del autor; no tratar su técnica como estándar universal.', url: 'https://hudsonmusic.com/instructors/george-kollias/' },
    ],
    progress: ['precisión', 'balance entre pies', 'sonido', 'dinámica', 'relajación', 'continuidad', 'recuperación', 'transferencia a groove/repertorio'],
  },
  {
    id: 'rudimental-lineal-manos-pies',
    title: 'Vocabulario rudimental, lineal y manos-pies',
    summary: 'Transforma vocabulario de manos en lenguaje de drumset mediante orquestación, sustitución de voces, permutaciones y distribución entre extremidades.',
    forWhom: 'Funk, fusion, progressive, metal y bateristas interesados en fraseo de kit más allá del sticking puramente manual.',
    notMeaning: ['No es “los 40 rudimentos con los pies”.', 'Lineal no significa tocar siempre una sola voz.', 'Una permutación compleja no es automáticamente musical.'],
    competencies: ['B7', 'B8', 'G2', 'H4', 'H6', 'C2', 'G5'],
    phases: ['F1–F3: transformación en pad', 'F4: sustitución y orquestación inicial', 'F5–F6: aplicación estilística y repertorial'],
    entry: {
      'PUEDES EXPLORARLA YA': 'En pad: cambia sticking, acentos, subdivisión y posición; imagina sustituciones de voz sin fingir cuatro extremidades.',
      'INICIO PARALELO RAZONABLE': 'Con kit, B7 y G2 en mínimo y H4 en mínimo.',
      'ESPECIALIZACIÓN SERIA': 'B7 y H4 funcionales, con B8/H6 suficientemente estables para mantener forma y sonido al distribuir la frase.',
    },
    contents: ['Orquestación de material de manos', 'Sustitución de voces', 'Sticking y footing explícitos', 'Leading limb', 'Permutaciones', 'Fraseo lineal', 'Manos-pies en groove y fill', 'Ostinatos y transferencia estilística'],
    transfer: ['B6/B7 → vocabulario conocido', 'G2 → transformación', 'D5 → lectura nueva', 'H6 → fills', 'G5 → orquestación'],
    resources: [
      { title: 'Benny Greb — The Language of Drumming', use: 'Vocabulario y transformación; usar por competencias.', url: 'https://hudsonmusic.com/product/the-language-of-drumming-book/' },
      { title: 'David Garibaldi — Future Sounds', use: 'Lenguaje lineal, niveles de sonido, groove y permutaciones.', url: 'https://www.alfred.com/products/future-sounds-00-16921' },
    ],
    progress: ['precisión', 'sonido', 'continuidad', 'forma', 'liderazgo de extremidad', 'dinámica', 'transferencia a groove/fill'],
  },
  {
    id: 'independencia-ostinatos',
    title: 'Independencia avanzada, ostinatos y cuatro extremidades',
    summary: 'Mantener funciones estables en unas extremidades mientras otras leen, improvisan o transforman material sin perder pulso, feel ni forma.',
    forWhom: 'Jazz, Afro-Cuban, Brazilian, fusion, progressive y cualquier batería interesado en capas funcionalmente independientes.',
    notMeaning: ['Coordinación difícil no equivale a independencia musical.', 'Cuatro patrones simultáneos no son polirritmia por definición.', 'La independencia no justifica sacrificar el groove.'],
    competencies: ['H4', 'H7', 'C2', 'D4', 'D5', 'G3', 'J6'],
    phases: ['F4: coordinación básica', 'F5: independencia dentro de estilos', 'F6–F7: sistemas, capas y aplicación avanzada'],
    entry: {
      'PUEDES EXPLORARLA YA': 'Canta una voz mientras las manos ejecutan otra, lee capas y explora relaciones sencillas como 3:2 sin llamarlas incorrectamente polimetría.',
      'INICIO PARALELO RAZONABLE': 'H4 funcional y C2 funcional; D4/D5 al menos en mínimo ayuda mucho.',
      'ESPECIALIZACIÓN SERIA': 'H7 en mínimo/funcional y capacidad de variar una capa conservando continuidad, dinámica y recuperación musical.',
    },
    contents: ['Funciones por extremidad', 'Ostinatos simples', 'Lectura sobre ostinato', 'Sustitución de voz', 'Independencia dinámica', 'Ostinatos estilísticos/métricos', 'Improvisación sobre capa fija', 'Polirritmia real entre capas', 'Repertorio'],
    transfer: ['C2 → rejilla temporal', 'D5 → lectura', 'G3 → improvisación restringida', 'H5 → groove', 'J6 → relaciones polirrítmicas'],
    resources: [
      { title: 'Dahlgren & Fine — 4-Way Coordination', use: 'Coordinación e independencia progresiva; seleccionar secciones.', url: 'https://www.alfred.com/products/4-way-coordination-00-hab00019' },
      { title: 'Gary Chester — The New Breed', use: 'Sistemas de coordinación, lectura y variación; no convertir “systems” en currículo paralelo.', url: 'https://www.halleonard.com/product/6620100/the-new-breed' },
    ],
    progress: ['estabilidad de ostinato', 'independencia dinámica', 'tiempo', 'continuidad', 'recuperación', 'lectura', 'transferencia estilística'],
  },
  {
    id: 'jazz-brushes',
    title: 'Jazz avanzado y brushes',
    summary: 'Profundiza time, ride language, comping, interacción, forma, independencia, charts, brushes, solo e improvisación.',
    forWhom: 'Bateristas que quieran desarrollar jazz más allá de la introducción estilística troncal.',
    notMeaning: ['Jazz no es solo un patrón de ride.', 'Brushes no significa simplemente tocar más bajo.', 'Comping no es rellenar todos los huecos.'],
    competencies: ['C2', 'H5', 'H7', 'I2', 'D5', 'D7', 'F3', 'E5'],
    phases: ['F5 U5: base jazz troncal', 'F6: integración estilística y repertorio'],
    entry: {
      'PUEDES EXPLORARLA YA': 'Escucha, forma, swing feel conceptual y canto/análisis del ride language.',
      'INICIO PARALELO RAZONABLE': 'C2 ternario funcional, H5 mínimo, lectura básica y base jazz de F5 U5.',
      'ESPECIALIZACIÓN SERIA': 'Time estable, comping básico, H7 mínimo, D7 emergente y repertorio suficiente para aplicar la técnica en contexto.',
    },
    contents: ['Time y ride language', 'Comping', 'Independencia coordinada', 'Interacción', 'Forma y charts', 'Brushes: sweep/tap, articulación y textura', 'Solo e improvisación', 'Repertorio y transcripción'],
    transfer: ['D5/D7 → lectura', 'E5/F3 → forma', 'H7 → independencia', 'G3 → improvisación', 'I3/I4 → repertorio'],
    resources: [
      { title: 'John Riley — The Art of Bop Drumming', use: 'Time, comping, solo, brushes y charts dentro de un método de jazz.', url: 'https://www.alfred.com/products/the-art-of-bop-drumming-00-mmbk0056cd' },
      { title: 'Berklee Jazz Drums — Casey Scheuerell', use: 'Jazz integral: swing, ride, independencia, brushes, solos y charts.', url: 'https://www.halleonard.com/product/50449612/berklee-jazz-drums' },
      { title: 'Ulysses Owens Jr. — Jazz Brushes for the Modern Drummer', use: 'Subruta específica de brushes con contexto jazzístico.', url: 'https://www.halleonard.com/product/298188/jazz-brushes-for-the-modern-drummer' },
    ],
    progress: ['time/feel', 'articulación', 'dinámica', 'comping', 'independencia', 'forma', 'lectura de charts', 'interacción y repertorio'],
  },
  {
    id: 'metal-extreme',
    title: 'Metal y extreme metal',
    summary: 'Vocabulario y control para metal de distintas densidades: riffs, articulación, fills, double bass, blast-beat families, forma y resistencia musical.',
    forWhom: 'Bateristas interesados en metal y extreme metal como lenguaje estilístico, no solo como reto de velocidad.',
    notMeaning: ['Metal no significa tocar siempre fuerte.', 'Extreme metal no se define por un BPM.', 'Blast beat no es una única técnica.', 'Doble pedal por sí solo no constituye esta trayectoria.'],
    competencies: ['H2', 'H5', 'H6', 'I2', 'I3', 'C2', 'D5', 'A7'],
    phases: ['F5 U7: base metal troncal', 'T1: pies/doble pedal como apoyo técnico', 'F6: repertorio e integración'],
    entry: {
      'PUEDES EXPLORARLA YA': 'Escucha, estructura, subdivisión, análisis de riffs y familias de blast beats sin perseguir velocidad.',
      'INICIO PARALELO RAZONABLE': 'H5 mínimo, H2 funcional y base metal de F5 U7; T1 puede avanzar en paralelo.',
      'ESPECIALIZACIÓN SERIA': 'Continuidad en canciones, balance pies/manos y control dinámico a densidades crecientes sin deterioro técnico.',
    },
    contents: ['Riff awareness', 'Grooves y articulación', 'Double bass funcional', 'Blast-beat families', 'Transiciones y fills', 'Odd-time según repertorio', 'Endurance contextual', 'Interpretación completa'],
    transfer: ['T1 → pies', 'T2 → fraseo manos-pies', 'T3 → coordinación', 'I3/I4 → repertorio', 'J → métricas cuando la música lo exija'],
    resources: [
      { title: 'George Kollias — Intense Metal Drumming I/II', use: 'Fuente de autor para blasts, double bass, control, balance, fills y conceptos de metal.', url: 'https://hudsonmusic.com/product/intense-metal-drumming-ii/' },
    ],
    progress: ['precisión', 'articulación', 'dinámica', 'balance', 'resistencia útil', 'continuidad', 'forma', 'transferencia a repertorio'],
  },
  {
    id: 'afro-cuban',
    title: 'Afro-Cuban drumset',
    summary: 'Comprender y aplicar capas, patrones guía, coordinación, clave cuando corresponda, formas y vocabulario Afro-Cubano sin reducirlo a un groove aislado.',
    forWhom: 'Bateristas interesados en repertorio Afro-Cubano, jazz latino, fusion y coordinación basada en capas.',
    notMeaning: ['Afro-Cuban no es sinónimo de “Latin”.', 'Clave no es una decoración opcional cuando estructura el lenguaje.', 'Un patrón aislado no sustituye repertorio, escucha y función musical.'],
    competencies: ['H4', 'H7', 'C2', 'I2', 'E5', 'F3', 'I3'],
    phases: ['F5 U6: base troncal', 'F6: integración y repertorio', 'T3: independencia/ostinatos como apoyo'],
    entry: {
      'PUEDES EXPLORARLA YA': 'Escucha, canto/palmas de capas, identificación de forma y funciones instrumentales antes del kit.',
      'INICIO PARALELO RAZONABLE': 'H4 funcional, C2 funcional y base Afro-Cuban de F5 U6.',
      'ESPECIALIZACIÓN SERIA': 'Ostinatos y forma suficientemente estables para variar otras voces sin perder feel ni función.',
    },
    contents: ['Escucha y contexto', 'Patrones guía y clave cuando corresponda', 'Funciones instrumentales', 'Adaptación al drumset', 'Ostinatos', 'Coordinación de capas', 'Variación e improvisación', 'Repertorio/transcripción'],
    transfer: ['E5/F3 → forma', 'H4/H7 → capas', 'T3 → ostinatos', 'I3 → repertorio', 'D5/E6 → lectura y transcripción'],
    resources: [
      { title: 'Ed Uribe — The Essence of Afro-Cuban Percussion & Drum Set', use: 'Método especializado para instrumentos, ritmos, song styles y aplicaciones al drumset.', url: 'https://www.alfred.com/products/the-essence-of-afro-cuban-percussion-drum-set-00-perc9620cd' },
    ],
    progress: ['feel', 'estabilidad de capas', 'articulación', 'forma', 'independencia', 'interacción', 'repertorio'],
  },
  {
    id: 'brazilian',
    title: 'Brazilian drumset',
    summary: 'Comprender y aplicar ritmos, song styles, capas y funciones de tradiciones brasileñas preservando feel, articulación y contexto.',
    forWhom: 'Bateristas interesados en músicas brasileñas, jazz/fusion y coordinación derivada de capas de percusión.',
    notMeaning: ['Brazilian no es intercambiable con Afro-Cuban.', 'No basta con memorizar un ostinato.', 'La notación no sustituye escucha, articulación y repertorio.'],
    competencies: ['H4', 'H7', 'C2', 'I2', 'E5', 'F3', 'I3'],
    phases: ['F5 U6: base troncal', 'F6: integración y repertorio', 'T3: independencia/ostinatos como apoyo'],
    entry: {
      'PUEDES EXPLORARLA YA': 'Escucha, forma, pulso/subdivisión, canto de capas y análisis de funciones antes de coordinar el drumset completo.',
      'INICIO PARALELO RAZONABLE': 'H4 funcional, C2 funcional y base Brazilian de F5 U6.',
      'ESPECIALIZACIÓN SERIA': 'Capas y feel suficientemente estables para sostener repertorio y variaciones con intención estilística.',
    },
    contents: ['Escucha y contexto', 'Ritmos y song styles', 'Funciones de percusión', 'Adaptación al drumset', 'Ostinatos', 'Coordinación', 'Articulación y feel', 'Repertorio/transcripción'],
    transfer: ['E5/F3 → forma', 'H4/H7 → capas', 'T3 → ostinatos', 'I3 → repertorio', 'D5/E6 → lectura y transcripción'],
    resources: [
      { title: 'Ed Uribe — The Essence of Brazilian Percussion & Drum Set', use: 'Método especializado para instrumentos, ritmos, song styles y aplicaciones al drumset.', url: 'https://www.alfred.com/the-essence-of-brazilian-percussion-drum-set/p/00-EL03920CD/' },
    ],
    progress: ['feel', 'articulación', 'estabilidad de capas', 'forma', 'independencia', 'repertorio'],
  },
] as const;

export const PROGRESSIVE_CORE_ROUTE = {
  id: 'ruta-progresiva',
  title: 'Ruta progresiva / ritmo avanzado',
  classification: 'TRONCAL AVANZADO — no es una trayectoria duplicada',
  sequence: ['C1/C2', 'F2/D4', 'J1/J2', 'J3/J4', 'J5/J6', 'J7/J8', 'J9'],
  note: 'Desde F1 pueden aparecer agrupaciones 3+3+2, 5/4, 7/8, quintillos y 3:2 como ventanas de exploración. La profundización permanece en J1–J9/F7.',
} as const;
