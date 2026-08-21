import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
    unitSlug: z.string().regex(/^unidad-\d+$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    kind: z.enum(['unit', 'diagnostic', 'lesson', 'checkpoint']),
    order: z.number().int().nonnegative(),
    title: z.string().min(1),
    summary: z.string().min(1),
    duration: z.string().optional(),
    competencies: z.array(z.string()).default([]),
    rudiments: z.array(z.string()).default([]),
    published: z.boolean().default(true),
  }),
});

export const collections = { bateria };
