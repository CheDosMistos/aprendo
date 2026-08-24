import node from '@astrojs/node';
import { alphaTab } from '@coderline/alphatab-vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aprendo.molacomer.com',
  output: 'server',
  trailingSlash: 'always',
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    plugins: [alphaTab()],
  },
});
