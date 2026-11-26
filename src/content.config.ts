import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * One Markdown file per project in src/content/projects/.
 * The build fails if front matter does not match this schema, so a new
 * or edited project cannot silently break the site.
 *
 * Status is an honesty label, not a ranking:
 *   running          works end to end today
 *   measured         evaluated, with recorded results
 *   design-complete  specified and reviewed; implementation not finished
 *   in-progress      being built, not yet at one of the above
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    pitch: z.string().max(180),
    status: z.enum(['running', 'measured', 'design-complete', 'in-progress']),
    featured: z.boolean().default(false),
    order: z.number().default(100), // lower first
    draft: z.boolean().default(false), // drafts are not built
    tags: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    context: z.string(), // e.g. "Course project, Computer Networks, FAST NUCES"
    role: z.string(), // what you personally owned
    team: z.array(z.object({ name: z.string(), part: z.string().optional() })).default([]),
    period: z.object({ start: z.string(), end: z.string().optional() }),
    // Key figures. Only put numbers here that come from a recorded result or a count.
    metrics: z.array(z.object({ label: z.string(), value: z.string(), note: z.string().optional() })).default([]),
    links: z
      .object({
        repo: z.url().optional(),
        repoVisibility: z.enum(['public', 'private']).default('public'),
        docs: z.url().optional(),
      })
      .default({ repoVisibility: 'public' }),
    demo: z
      .object({
        kind: z.enum(['replay', 'recording', 'live']),
        status: z.enum(['planned', 'available']),
        url: z.string().optional(),
        note: z.string().optional(),
      })
      .optional(),
    updated: z.coerce.date(),
  }),
});

export const collections = { projects };
