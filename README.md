# Cocoon

Visit the landing page: [https://amol-patil.github.io/cocoon/](https://amol-patil.github.io/cocoon/)

<!-- Short Description -->
> A simple macOS overlay application for quickly retrieving those Driving License numbers, Passport numbers, Health Cards and many others without needing to dig through your files (or worse Photos). Bonus: it links directly to source file(s) so you can also attached the scanned copies if and when needed!

<!-- Optional: Badges (Build Status, License, Version, etc.) -->
<!-- ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) -->
<!-- ![GitHub release (latest by date)](https://img.shields.io/github/v/release/GITHUB_USERNAME/cocoon) -->

<!-- Optional: Screenshot/GIF -->
<!-- ![Cocoon Screenshot](path/to/screenshot.png) -->

## Features

*   Quickly find IDs (License, Passport, Health Card, etc.) via fuzzy search.
*   Summon search instantly with a global keyboard shortcut (Configurable: default `Control+Option+Space`).
*   Copy details (numbers, expiry dates, etc.) to the clipboard with one click.
*   Link entries directly to source files (e.g., scanned PDFs) for easy access.
*   Add, edit, and delete your document entries.
*   Organize items as "Permanent" or "Temporary" (temporary items still searchable).
*   **Data stored locally only** in a simple JSON file within your user profile; no cloud sync or external storage.
*   Configure global shortcut, default browser for opening file links, and app behavior (Launch at startup, Show in Dock).
*   Simple, dark-themed overlay interface.

## Installation (macOS)

1.  **Download:** Go to the [Latest Release page](https://github.com/amol-patil/cocoon/releases/latest) on GitHub.
2.  Download the `.dmg` file (e.g., `Cocoon-x.y.z.dmg`).
3.  **Mount:** Double-click the downloaded `.dmg` file to open it.
4.  **Install:** Drag the `Cocoon.app` icon into your `Applications` folder.

**Important First Launch Note:**

> Cocoon is currently distributed without official Apple Developer signing due to the costs involved for free, open-source projects. 
> 
> Because of this, the first time you open Cocoon, macOS Gatekeeper will show a warning like "'Cocoon.app' can't be opened because Apple cannot check it for malicious software."
> 
> To bypass this **safely for the first launch only**:
> 
> 1.  Locate `Cocoon.app` in your `/Applications` folder.
> 2.  **Right-click** (or Control-click) the `Cocoon.app` icon.
> 3.  Choose **"Open"** from the context menu.
> 4.  A dialog will appear asking if you're sure. Click **"Open"** again.
> 
> You only need to do this the very first time you run this version of the app.

<!-- Optional: Add Windows/Linux instructions if applicable later -->

## Basic Usage

1.  **Launch:** Open Cocoon from your Applications folder.
2.  **Global Shortcut:** Press `Control+Option+Space` to show/hide the search window.
3.  **Search:** Type to search your documents.
4.  **Select/Expand:** Use arrow keys (Up/Down) and Enter, or click to select/expand a document.
5.  **Copy:** Click the copy icon (📋) next to a field in the expanded view.
6.  **Settings:** Access settings via the gear icon (⚙️) in the main window or the application menu (if Dock icon is visible).
7.  **Add/Manage:** Use the "Manage Documents" button to add, edit, or delete entries.

## Development

Interested in contributing? Great!

1.  **Prerequisites:**
    *   Node.js (e.g., v18 or later)
    *   npm (usually comes with Node.js)
    *   Git
2.  **Clone:** `git clone https://github.com/GITHUB_USERNAME/cocoon.git`
3.  **Navigate:** `cd cocoon/app`
4.  **Install Dependencies:** `npm install`
5.  **Run Development Server:** `npm run start`
6.  **Run Linters/Formatters:**
    *   `npm run lint`
    *   `npm run format`
7.  **Build:** `npm run make` (creates distributable in `app/out`)

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details on code style and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.
