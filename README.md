# Color Wheel

A mobile-first web app for building color palettes. Pick a color from a photo, screenshot or by hand, explore wheel harmonies and suggested pairings, then see your palette used in poster, fashion and branding mock-ups (including a 60-30-10 example).

Built with React (JSX), Vite, Tailwind and shadcn/ui, with BEM-named custom CSS on an 8pt grid.

## Scripts

```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm test         # Vitest, once in the terminal
npm run test:ui  # Vitest web view (watch mode); open the link it prints
npm run build    # production build in dist/
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm test` and `npm run build` on every push to `main` and on every pull request. Node version comes from `.nvmrc`.

## Structure

```
src/
  features/   one folder per capability (color-source, color-picker, harmony,
              suggestions, pick-colors, palette, examples, stepper)
  shared/     color math, swatches, DOM helpers, shadcn/ui components
  styles/     Tailwind, theme and spacing tokens
```
