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
    *   [ ] Project description, features, screenshots.
    *   [ ] Installation instructions (user) - **Must include Right-Click->Open for macOS & link to GitHub Releases**. 
    *   [ ] Development setup instructions (contributor).
    *   [ ] Basic usage.
    *   [ ] License info.
    *   [ ] Contributing section link.
8.  **LICENSE File (Formerly Step 10):**
    *   [ ] Choose an OSI-approved license (e.g., MIT).
    *   [ ] Add full license text to `LICENSE` file.
9.  **CONTRIBUTING.md (Formerly Step 11):**
    *   [ ] Bug reporting & feature suggestion process.
    *   [ ] Dev environment setup details.
    *   [ ] Code style guidelines.
    *   [ ] PR submission process.
10. **CODE_OF_CONDUCT.md (Formerly Step 12):**
    *   [ ] Adopt a standard Code of Conduct (e.g., Contributor Covenant).
11. **User Guide (Optional - Formerly Step 13):**
    *   [ ] More detailed documentation (wiki, file, or website).

## Phase 4: Release & Community Setup (Steps Renumbered)

12. **Repository Setup (Formerly Step 14):**
    *   [ ] Create public repository (e.g., GitHub).
    *   [ ] Push cleaned code & docs.
    *   [ ] Configure repo settings (description, topics).
    *   [ ] Set up Issue/PR Templates.
13. **Initial Release (v1.0.0 - Formerly Step 15):**
    *   [ ] Create Git tag.
    *   [ ] Build ad-hoc signed production versions.
    *   [ ] Create GitHub Release.
    *   [ ] Write release notes.
    *   [ ] Upload ad-hoc signed binaries.
14. **Community Channels (Optional - Formerly Step 16):**
    *   [ ] Set up Discord, mailing list, etc. if desired.
