import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { COMPETENCY_ID_PATTERN, PAS_RUDIMENTS } from './courses/bateria/curriculum';

const bateria = defineCollection({
  loader: glob({
    base: './src/courses/bateria/content/pages',
    pattern: '**/*.md',
  }),
  schema: z.object({
    contentId: z.string().regex(/^bat-f\d+-u\d+-(?:overview|s\d+|l\d+|check)$/),
    courseId: z.literal('bateria'),
    phase: z.number().int().positive(),
    unit: z.number().int().positive(),
    unitSlug: z.string().regex(/^(?:unidad-\d+|fase-\d+-unidad-\d+)$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    kind: z.enum(['unit', 'diagnostic', 'lesson', 'checkpoint']),
    order: z.number().int().nonnegative(),
    title: z.string().min(1),
    summary: z.string().min(1),
    duration: z.string().optional(),
    competencies: z.array(z.string().regex(COMPETENCY_ID_PATTERN)).default([]),
    rudiments: z.array(z.enum(PAS_RUDIMENTS)).default([]),
    rudimentNotation: z.enum(['per-rudiment', 'review-reference']).default('per-rudiment'),
    published: z.boolean().default(true),
  }),
});

export const collections = { bateria };
