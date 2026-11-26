import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Set `site` to the final URL (needed for the sitemap and canonical links).
// For GitHub Pages project sites also set `base: '/portfolio'`.
export default defineConfig({
  site: 'https://furqan-2006.github.io',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
