import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Deployment target comes from the environment (set in .github/workflows/deploy.yml).
// Moving to a custom domain later: set SITE_URL to the domain and BASE_PATH to '/'.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://furqan-2006.github.io',
  base: process.env.BASE_PATH ?? '/',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
