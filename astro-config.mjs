import { defineConfig } from 'astro/config';

export default defineConfig({
  // Enable server-side rendering to support API routes
  output: 'server',
  
  // Site configuration
  site: 'https://swecha.org',
  
  // Build options
  build: {
    format: 'file'
  },
  
  // Server options for development
  server: {
    port: 3000,
    host: true
  }
});