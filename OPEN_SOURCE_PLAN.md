# Cocoon Open Source Plan

This document outlines the steps to prepare the Cocoon application for open-source release, focusing on production readiness and polishing for public consumption.

## Phase 1: Codebase & Foundation Cleanup

1.  **Dependency Review:**
    *   [x] Audit dependencies (`dependencies` & `devDependencies`).
    *   [x] Remove unused dependencies (`electron-is-dev`, `concurrently`, `update-electron-app`).
    *   [ ] Update key dependencies (Skipped for now).
    *   [x] Run `npm audit` and fix vulnerabilities (0 found).
    *   [x] Verify license compatibility (Assumed OK for MIT).
2.  **Code Quality & Consistency:**
    *   [x] Establish/enforce strict linting (ESLint) & formatting (Prettier).
    *   [x] Add `lint` & `format` scripts to `package.json`.
    *   [x] Refactor core logic (`main.ts`, `secureStore.ts`, `settings.ts`, `App.tsx`) for clarity, efficiency, bugs (Partially addressed via linting, ongoing).
    *   [x] Improve Error Handling (Partially addressed via linting).
3.  **Security Considerations:**
    *   [ ] Sanitize user input (Review external link opening).
    *   [ ] Ensure no sensitive info is hardcoded/committed (Add `.env` to `.gitignore`).
    *   [ ] Review file system interactions (Looks OK).
4.  **Configuration Management:**
    *   [x] Review hardcoded values (Browser names noted as minor point).
    *   [x] Ensure dev vs. prod config (e.g., data paths) is robust (`app.isPackaged`).

## Phase 2: Build, Distribution & Updates

5.  **Build Process:**
    *   [ ] Ensure build (`npm run make`) is reliable & repeatable.
    *   [x] Clean up `forge.config.js` (Enabled ASAR).
    *   [ ] Test build output thoroughly.
6.  **Code Signing:**
    *   [x] **macOS:** Configured ad-hoc signing (`identity: '-'`). Notarization skipped.
    *   [ ] **Windows:** Skipped for now.

## Phase 3: Documentation & Legal (Steps Renumbered)

7.  **README.md (Essential - Formerly Step 9):**
    *   [x] Project description, features, screenshots.
    *   [x] Installation instructions (user) - **Must include Right-Click->Open for macOS & link to GitHub Releases**. 
    *   [x] Development setup instructions (contributor).
    *   [x] Basic usage.
    *   [x] License info.
    *   [ ] Contributing section link (Will link to non-existent file for now, or remove link).
8.  **LICENSE File (Formerly Step 10):**
    *   [x] Choose an OSI-approved license (MIT).
    *   [x] Add full license text to `LICENSE` file.
9.  **CONTRIBUTING.md (Formerly Step 11):**
    *   [ ] Skipped for now.
10. **CODE_OF_CONDUCT.md (Formerly Step 12):**
    *   [ ] Skipped for now.
11. **User Guide (Optional - Formerly Step 13):**
    *   [ ] Skipped for now.

## Optional Steps

12. **Create GitHub Pages Landing Site:**
    *   [ ] Choose method (Markdown, SSG, HTML).
    *   [ ] Create content (visuals, text).
    *   [ ] Configure and deploy via GitHub Pages settings.
