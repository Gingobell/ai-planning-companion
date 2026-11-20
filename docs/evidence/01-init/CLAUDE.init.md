# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` starts the Next.js dev server at http://localhost:3000 (Turbopack).
- `npm run build` creates a production build; `npm start` serves it.
- `npm run lint` runs ESLint 9 (flat config in `eslint.config.mjs`, extending `eslint-config-next` core-web-vitals and typescript).
- `npm test` runs Vitest once; `npm run test:watch` runs it in watch mode.
- Single test file: `npx vitest run path/to/file.test.ts`. Single test by name: `npx vitest run -t "test name"`.

## Next.js version warning

This project uses Next.js 16.4.6 and React 19.3, which have breaking changes compared with older Next.js versions. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, etc.) and heed deprecation notices. The block in `AGENTS.md` is generated and re-added by `next dev`; do not remove it.

## Architecture

The repository is currently a create-next-app skeleton with Vitest added. There is no feature code and no tests yet.

- App Router under `src/app/` (`layout.tsx`, `page.tsx`, `globals.css`). Layout props use the generated global `LayoutProps<"/">` type.
- Import alias `@/*` maps to `./src/*` in `tsconfig.json`. There is no `vitest.config.*`, so Vitest runs with defaults and does not resolve the `@/` alias; add a config with the alias before tests import via `@/`.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, and wires Tailwind CSS v4 through a Turbopack loader rule (`@tailwindcss/turbopack`) for `*.css` instead of PostCSS. `globals.css` uses `@import "tailwindcss"` and `@theme inline` tokens.
- TypeScript runs in `strict` mode.
- `.claude/settings.local.json` is gitignored for personal Claude Code settings.
