# Color Wheel

A mobile-first web app for building color palettes. Pick a color from a photo, screenshot or by hand, explore wheel harmonies and suggested pairings, then see your palette used in poster, fashion and branding mock-ups (including a 60-30-10 example).

Built with React and TypeScript (strict), Vite, Tailwind and shadcn/ui, with BEM-named custom CSS on an 8pt grid.

## Scripts

```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm test         # Vitest, once in the terminal
npm run test:ui  # Vitest web view (watch mode); open the link it prints
npm run typecheck  # TypeScript, no emit
npm run format     # Prettier, rewriting files
npm run format:check  # Prettier, only checking (what CI runs)
npm run lint       # ESLint (typescript-eslint, strict and type-aware)
npm run lint:fix   # same, applying the safe automatic fixes
npm run build    # type check, then production build in dist/
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm run format:check`, `npm run lint`, `npm test` and `npm run build` (which type-checks first) on every push to `main` and on every pull request. Node version comes from `.nvmrc`.

## Formatting

Prettier owns formatting (`.prettierrc.json`: 100 columns, single quotes, trailing commas), so nobody has to think about it in review. Run `npm run format` before committing; CI fails if a file isn't formatted. ESLint doesn't check formatting (`eslint-config-prettier` switches off anything that would conflict). Prettier doesn't rewrap comments, so keep comments within 100 columns by hand. After `npx shadcn add`, run `npm run format` to bring the generated files in line.

The big formatting commit is listed in `.git-blame-ignore-revs`, so `git blame` skips it (GitHub does this automatically; locally run `git config blame.ignoreRevsFile .git-blame-ignore-revs`).

## Linting

`eslint.config.ts` uses ESLint's recommended rules, typescript-eslint's `strictTypeChecked` and `stylisticTypeChecked` presets (type-aware, so it catches things like unawaited promises), the React Hooks rules (including the React Compiler ones) and Fast Refresh safety. Where a rule is relaxed, the config says why. Formatting is deliberately not linted here; that belongs to Prettier.

`typescript` is pinned to `~6.0.3` because typescript-eslint supports TypeScript `>=4.8.4 <6.1.0`. TypeScript 7's native compiler does not expose the API the linter needs. Check typescript-eslint's `typescript` peer range before raising the pin.

## Structure

```
src/
  features/   one folder per capability (color-source, color-picker, harmony,
              suggestions, pick-colors, palette, examples, stepper)
  shared/     color math, swatches, DOM helpers, shadcn/ui components
  styles/     Tailwind, theme and spacing tokens
```
