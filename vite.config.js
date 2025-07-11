import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pair: resolve(__dirname, 'heartsPair.html'),
        rain: resolve(__dirname, 'heartsRain.html'),
        rotating: resolve(__dirname, 'rotatingHeart.html')
      }
    }
  }
});
