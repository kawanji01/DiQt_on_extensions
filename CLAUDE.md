# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DiQt Chrome Extension - A browser extension that enables DiQt dictionary functionality on web browsers. The extension allows users to look up words, translate sentences, and review vocabulary while browsing the web.

## Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build
# or
npx webpack --mode production

# Build for development (requires .env file with DEV_ROOT_URL)
ENV=development npx webpack --mode development

# Run ESLint (note: chrome and process globals need to be configured)
npx eslint src/*.js
```

## Architecture

### Core Components

- **Content Script** (`src/content_scripts.js`): Injected into web pages to provide dictionary functionality. Handles UI rendering, text selection, and communication with background script.

- **Background Script** (`src/background.js`): Service worker that manages API communication with DiQt servers, handles authentication, and coordinates between content scripts and offscreen documents.

- **Offscreen Document** (`src/offscreen.js`): Handles audio playback for word pronunciations using Chrome's offscreen API.

- **Options Page** (`public/options.html`, `public/options.js`): Settings page for user configuration including dictionary preferences and display options.

### Key Features Implementation

- **Word Search** (`src/word.js`, `src/searcher.js`): Implements dictionary lookup with support for multiple languages and word forms.

- **Sentence Translation** (`src/sentence.js`, `src/translator.js`): Provides sentence translation capabilities.

- **AI Search** (`src/ai_searcher.js`): AI-powered search functionality for enhanced word lookup.

- **Review System** (`src/review.js`): Vocabulary review and learning management.

### Build Configuration

- Uses Webpack for bundling with separate entry points for content script, background script, offscreen, and options page
- SCSS compilation with MiniCssExtractPlugin
- Environment variables loaded from `.env` file for API keys and endpoints
- Assets (fonts, icons, locales) copied via CopyPlugin

### Extension Permissions

- `storage`: For saving user preferences
- `unlimitedStorage`: For caching dictionary data
- `offscreen`: For audio playback
- Host permissions for DiQt API endpoints

### Development Notes

- Environment variables required in `.env`:
  - `DEV_ROOT_URL` / `PROD_ROOT_URL`: API endpoints
  - `API_KEY`: DiQt API key
  - `SECRET_KEY`: Authentication secret

- ESLint configuration needs globals for Chrome extension APIs (`chrome`, `process`)

- Manifest V3 service worker architecture for background script

- Localization support via `_locales/` for Japanese and English