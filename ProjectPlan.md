# LLM Instructions: Build a Mac Overlay Autofill Assistant

## 👇 What You're Building
You're building a Mac desktop application that acts like a secure overlay (like Alfred or Raycast) to help users quickly search, access, and copy key information from personal documents. These documents are stored on Google Drive, and users can link directly to them. The app should allow fuzzy searching, structured display of fields (like license number or expiration), copying individual fields, and opening the linked Google Drive file. The app should be designed with a keyboard-first experience and also support mouse interaction.

---

## 🎯 Core Features to Implement

### Overlay Launcher
- Global hotkey (like `Cmd + Space`) brings up an overlay search bar.
- When the app is not running, launching it also opens the overlay.

### Fuzzy Search
- Fuzzy search across all saved documents and fields using `Fuse.js` or `MiniSearch`.
- Example: Typing `driver's license` should show relevant fields like license number and expiration date.

### Display Search Results
- Display structured results per document, like:
  - `📄 Number: A1234-56789-01234    ⇧+1`
  - `📅 Expires: 2027-05-14         ⇧+2`
  - `📁 Open File                  ⏎`
- The default field (like "number") should be copied when hitting `Enter`.
- Support keyboard shortcuts to copy individual fields (`⇧ + 1`, `⇧ + 2`, etc).

### Open Linked File
- Pressing `Enter` on the "Open File" result or clicking the button opens the linked Google Drive file in the default browser.
- File links are stored by the user and not fetched through Google Drive API initially.

### Expand View / Full Card
- Use arrow key or click to expand a full card for a document.
- Shows all stored fields with copy buttons.

### Keyboard + Mouse UX
- Keyboard navigation should be fully supported.
- Mouse hover and click-to-copy also available.
- Copy all fields button (`Cmd + C`) copies a structured string (or JSON).

### Optional Enhancements
- Clear clipboard after X seconds.
- Tag-based filtering.
- Edit values inline in the full card view.

---

## 🧱 Tech Stack

### Frontend
- **Electron**: for desktop app shell
- **React + Tailwind CSS**: for building the UI
- **Framer Motion** (optional): for smooth animations

### Search
- **Fuse.js** or **MiniSearch** for local fuzzy search

### Data
- Store user data (documents and their fields) in encrypted local format
- Options:
  - `lowdb` (simple JSON-based local DB)
  - or `SQLite` with `better-sqlite3` if performance is needed

### Security
- Encrypt the entire DB or individual fields using `libsodium` or Node’s `crypto` module
- Do not store clipboard history

### Google Drive Integration (MVP)
- Just store user-provided Google Drive share links
- On "Open File", open link via Electron’s `shell.openExternal()`

---

## 🔐 Example Data Schema
```json
{
  "type": "Driver's License",
  "defaultField": "number",
  "fields": {
    "number": "A1234-56789-01234",
    "expires": "2027-05-14"
  },
  "fileLink": "https://drive.google.com/file/d/abc123/view"
}
```

---

## 🧪 Sample User Flow (Test This End-to-End)
1. User presses global hotkey → overlay opens.
2. User types `driver's license` → app shows relevant result.
3. Pressing `Enter` → copies license number (default field).
4. Pressing `⇧ + 2` → copies expiration date.
5. Pressing `→` → expands full card.
6. Pressing `⏎` on "Open File" → opens Google Drive document.

---

## ✅ Definition of Done
- Overlay can be launched from anywhere with a hotkey
- User can add/edit documents and fields
- User can fuzzy search and copy individual fields
- User can open associated files
- Works offline, secure storage, clipboard is managed responsibly



1. Project Overview

1.1 Goal

Build a desktop application for macOS that provides quick keyboard-driven access to personal document data. The app should support:
	•	A global hotkey to bring up an overlay.
	•	Fuzzy search of local document entries.
	•	One-keystroke (or click) copying of fields (e.g., driver’s license number).
	•	Linking to relevant files stored in Google Drive.

1.2 Tech Stack (Proposed)
	•	Electron (main process / cross-platform app container)
	•	React (UI layer)
	•	Tailwind CSS (styling)
	•	Data Storage:
	•	Lightweight local JSON DB (e.g. lowdb) or SQLite (e.g. better-sqlite3)
	•	Fuzzy Search: Fuse.js or MiniSearch
	•	Encryption: libsodium or Node’s built-in crypto module
	•	Google Drive: Store shareable links initially; later integrate Google Drive API

1.3 High-Level Architecture
	1.	Electron Main Process:
	•	Handles app lifecycle, global shortcuts, updates, file system access, etc.
	2.	Renderer Process (React):
	•	Renders the overlay UI, handles user interactions.
	•	Communicates with the main process (IPC) for secure data operations.
	3.	Data Layer:
	•	Abstracted module for reading/writing the encrypted DB.
	•	Exposes methods like searchDocuments(), getDocument(id), addDocument(data), etc.
	4.	Security:
	•	Encryption at-rest (local data).
	•	Potential unlocking mechanism (Touch ID or passphrase).
	5.	Google Drive Integration:
	•	MVP: store shareable links in the dataset.
	•	Future: authenticate with Google, validate link existence, or show preview.

⸻

2. Project Phases & Milestones

Below is a sample breakdown of tasks and milestones. You can reorganize or rename phases as desired.

Phase 1: Core Framework Setup
	1.	Initialize Electron + React Project
	•	Use a boilerplate or generate from scratch (e.g., electron-react-boilerplate).
	2.	Set Up Build & Packaging
	•	Configure electron-builder or similar tool for packaging.
	•	Ensure correct codesigning / provisioning for Mac distribution (if relevant).
	3.	Implement Global Hotkey
	•	Register global shortcut (e.g., Cmd+Space).
	•	Show or hide overlay window on trigger.

Acceptance Criteria
	•	Running npm start or similar spins up the Electron app.
	•	Pressing the global hotkey toggles an empty overlay.

Phase 2: Overlay UI & Basic Search
	1.	Overlay Window & UI
	•	Position near top of screen (like Alfred).
	•	Include a search box.
	•	Basic styling with Tailwind.
	2.	Data Layer (Mock/Placeholder)
	•	Build a simple structure in memory or on-disk with sample JSON.
	•	E.g.,

{
  "type": "Driver's License",
  "defaultField": "number",
  "fields": {
    "number": "A1234-56789-01234",
    "expires": "2027-05-14"
  },
  "fileLink": "https://drive.google.com/..."
}


	3.	Fuzzy Search Implementation
	•	Integrate Fuse.js or MiniSearch.
	•	Provide a method to query the dataset and return best matches.

Acceptance Criteria
	•	Typing in the overlay search bar matches relevant records (using placeholder data).
	•	Displays a basic list of results (title, short snippet).

Phase 3: Copy & Expand View
	1.	Keyboard Navigation
	•	Up/Down arrow to highlight search results.
	•	Enter key to copy the default field to clipboard.
	•	Shortcut keys (e.g., Shift+1, Shift+2) to copy specific fields.
	2.	Expanded Card View
	•	On click or arrow key + keystroke, reveal a detail panel showing all fields.
	•	Provide “copy” icons or buttons next to each field.
	3.	Clipboard Handling
	•	Use Electron’s clipboard API to handle copying.
	•	Optional: implement auto-clear after X seconds in a future step.

Acceptance Criteria
	•	User can copy individual or multiple fields using both mouse and keyboard.
	•	Expanded card displays all properties.

Phase 4: Data Persistence & Encryption
	1.	Local Database
	•	Switch from mock data to a real persistent store:
	•	Option A: lowdb (JSON-based).
	•	Option B: better-sqlite3 (SQLite).
	2.	Encryption
	•	Integrate libsodium or Node’s crypto to encrypt local data at rest.
	•	Generate or store encryption keys securely (e.g., user passphrase, keychain usage).
	3.	Data Management UI (Optional, can push to later):
	•	Basic form or in-app “settings” page to add/modify entries.
	•	Or plan to populate the DB externally for MVP.

Acceptance Criteria
	•	New data is stored in an encrypted local file or DB table.
	•	On app start, data is decrypted for searching and display.

Phase 5: Google Drive Linking
	1.	Link Storage
	•	Keep storing the link in your document schema (e.g., fileLink).
	•	In the detail view, show a link or button to open in default browser.
	2.	Future Enhancement (optional for MVP):
	•	Implement Google OAuth for validating and previewing Drive links.

Acceptance Criteria
	•	Clicking “Open File” or pressing a corresponding key opens the link in a browser.

Phase 6: Polishing & Additional Features
	1.	Refine UI
	•	Tailwind-based styling improvements.
	•	Smooth transitions, minimal animations for overlay.
	2.	Search & Sorting
	•	Enhance fuzzy search to handle partial matches, synonyms, etc.
	•	Maybe rank by frequency of use or recency.
	3.	Settings Panel
	•	Let the user change the global hotkey (if needed).
	•	Let the user choose whether to auto-clear clipboard or not.
	•	Possibly store personal passphrase for encryption.
	4.	User Testing & Bug Fixes
	•	Gather feedback on speed, memory usage, usability.
	•	Optimize Electron build size, if necessary.

Acceptance Criteria
	•	Users can configure certain preferences.
	•	UI and transitions feel smooth and stable.

Phase 7: Distribution & Code Signing
	1.	Build Mac Release
	•	Configure electron-builder or similar to produce .dmg or .pkg.
	2.	Code Signing & Notarization (Mac)
	•	Sign your app with an Apple Developer certificate.
	•	Notarize for Gatekeeper compliance.
	3.	Distribute
	•	Provide a DMG download or set up auto-updates using GitHub Releases, etc.

Acceptance Criteria
	•	A signed/notarized app that can be shared with end users without security warnings.
	•	Auto-update mechanism works if included.

⸻

3. Breaking Down Tasks for an LLM

Below is an example of how you might instruct an LLM to implement each component step by step:
	1.	Setting Up the Electron + React Skeleton
	•	Prompt: “Generate an Electron + React boilerplate project with a single IPC example. Show me the folder structure and sample code for main.js, App.jsx, and index.html.”
	2.	Creating the Overlay & Global Hotkey
	•	Prompt: “Extend the existing Electron code to create an always-on-top, borderless overlay window that appears when pressing Cmd+Space. Show me the modifications required in main.js (for the globalShortcut) and App.jsx (for toggling visibility).”
	3.	Implementing Fuzzy Search
	•	Prompt: “Use Fuse.js for searching across an array of objects. Create a function searchDocuments(query) that returns matched objects. Provide the code and an example usage in React.”
	4.	Adding Encryption
	•	Prompt: “Use the crypto module to encrypt and decrypt a JSON file. Provide utility functions encryptData(data, key) and decryptData(encryptedData, key), and show me how to read/write the file.”
	5.	Handling Copy to Clipboard
	•	Prompt: “Using the Electron clipboard API, write a function that copies a string to the clipboard. Integrate this into a React component that shows multiple fields, each with a ‘copy’ button. Provide an example in JSX.”
	6.	Google Drive Link Opening
	•	Prompt: “In the detail view, add a button labeled ‘Open File’ that calls shell.openExternal(link). Show me the updated React code and any main process changes if needed.”
	7.	Packaging the App
	•	Prompt: “Configure electron-builder to produce a .dmg for macOS. Show me the required entries in package.json or electron-builder.yml. Demonstrate code signing steps.”

⸻

4. Project Management Tips
	1.	Version Control
	•	Keep your code in a repository (e.g., GitHub, GitLab).
	•	Use branches for each phase/feature.
	2.	Continuous Integration
	•	Use a CI service (e.g., GitHub Actions) to run tests or build the app on each push.
	3.	Issue Tracking
	•	Create GitHub issues or a task board for each milestone (e.g., “Implement global hotkey”).
	•	Track progress and QA within those tickets.
	4.	Documentation
	•	Maintain a README.md with clear steps for installing, running, and packaging the app.
	•	Provide instructions for environment variables (like encryption keys or passphrases), if relevant.
	5.	Security Reviews
	•	Periodically review code for potential vulnerabilities (handling passphrases, encryption keys, etc.).
	•	If you plan to store sensitive data, implement best practices for secure local storage.

⸻

5. Final Notes
	•	Scope & Iteration: This plan focuses on the MVP. You can expand each milestone with more refined tasks, acceptance tests, or user stories.
	•	LLM Guidance: Provide the LLM with short, targeted prompts for each subtask, including references to your existing codebase or library docs (where possible).
	•	Testing: Write or generate test scripts (using Jest or similar) for key functions (search, encryption, data read/write, etc.). This helps maintain stability.

By following these structured phases and providing explicit prompts, you (and the LLM) can build the complete Mac overlay application outlined in the PRD—from initial skeleton to final packaging and distribution.