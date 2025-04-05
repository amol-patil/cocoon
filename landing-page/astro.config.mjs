// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Set the base path for deployment on GitHub Pages
  base: '/cocoon/',
  // Ensure the output directory is 'dist' (which is the default, but explicit is fine)
  outDir: 'dist',
  // Other Astro config options can go here
});
