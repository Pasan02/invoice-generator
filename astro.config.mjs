// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  build: {
    assets: '_assets',
    inlineStylesheets: 'auto' // Helps with performance
  }
});