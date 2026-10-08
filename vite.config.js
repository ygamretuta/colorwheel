import path from 'node:path';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // React Compiler memoizes components automatically, so no hand-written useMemo/useCallback.
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: { environment: 'jsdom', include: ['src/**/*.test.{js,jsx}'], globals: true },
});
