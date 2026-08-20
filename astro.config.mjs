import { alphaTab } from '@coderline/alphatab-vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aprendo.molacomer.com',
  trailingSlash: 'always',
  vite: {
    plugins: [alphaTab()],
  },
});
