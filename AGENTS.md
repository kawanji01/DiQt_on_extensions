# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` (e.g., `content_scripts.js`, `background.js`, `offscreen.js`, `style.scss`).
- Extension assets: `public/` (e.g., `manifest.json`, `options.html`, `options.js`, icons).
- Output: `dist/` (bundled JS/CSS copied from `public/`).
- Localization & fonts: `_locales/`, `fonts/`.
- Tooling: `webpack.config.js`, `.eslintrc.json`, `.env` (not committed).

## Build, Test, and Development Commands
- `npm run build`: Bundles via Webpack into `dist/`.
- `npx webpack --mode production`: One‑off production build (matches README).
- Dev mode: set `ENV=development` in `.env` to enable source maps and dev settings.
- Load locally: Chrome → Manage Extensions → Enable Developer Mode → Load unpacked → select `dist/`.

## Coding Style & Naming Conventions
- Language: ES2021 JavaScript; SCSS for styles.
- Lint: ESLint (`eslint:recommended`), module syntax enabled.
- Indentation: match existing files (2 spaces), use semicolons.
- File names: lowercase with underscores (e.g., `content_scripts.js`); variables/functions `camelCase`; classes `PascalCase`.

## Testing Guidelines
- Framework: add Jest. Example setup: `npm i -D jest babel-jest @babel/preset-env` and set `"test": "jest"` in `package.json`.
- Environment: use `testEnvironment: "jsdom"` when testing DOM logic in `content_scripts.js`.
- Locations: place tests in `__tests__/` or alongside files as `*.test.js` (e.g., `src/__tests__/searcher.test.js`).
- Keep tests deterministic; mock network calls and `chrome` APIs.

## Commit & Pull Request Guidelines
- Commits: short, imperative summaries (e.g., "Add constants.js", "Fix translation"); reference issues (`#123`) when relevant.
- PRs (checklist):
  - [ ] Clear problem/solution summary and linked issues
  - [ ] Screenshots/GIFs for UI changes
  - [ ] Manual test steps (Chrome version, OS, pages tested)
  - [ ] Build passes (`npm run build`) and loads from `dist/`
  - [ ] `manifest.json` changes explained (permissions, version)
- Keep changes focused; avoid unrelated refactors.

## Manifest Permissions & Security
- Location: `public/manifest.json` (MV3, `background.service_worker: background.js`).
- Use least privilege. Prefer `host_permissions` over broad `<all_urls>` and justify each.
- Example:
  ```json
  {
    "permissions": ["storage", "offscreen"],
    "host_permissions": ["https://www.diqt.net/", "https://cdn.diqt.net/"]
  }
  ```
- Bump `version` on publish; document permission changes in PRs.
- Secrets: `.env` keys (`DEV_ROOT_URL`, `PROD_ROOT_URL`, `API_KEY`, `SECRET_KEY`) are inlined by Webpack DefinePlugin—never commit real secrets; rotate if exposed.

## Architecture Overview (Quick Map)
- `content_scripts.js`: injected UI/DOM interactions on pages.
- `background.js`: lifecycle/events and cross‑page coordination.
- `options.html/js`: options UI under `public/`.
- `offscreen.js`: background/offscreen processing.
