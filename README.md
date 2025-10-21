# Wisp Messenger (local dev)

A simple Vite + React demo app. Quick setup notes for this repository.

Prerequisites
- Node.js LTS (tested with Node 22.x)
- npm (will be installed with Node; recommended npm 11.x)

Setup
1. Install dependencies:

   ```powershell
   npm install
   ```

2. Start the dev server:

   ```powershell
   npm run dev
   ```

Notes
- If `npm` is not recognized on Windows, ensure `C:\Program Files\nodejs` is on your PATH or install Node.js from https://nodejs.org/.
- On PowerShell, if execution policy prevents loading your profile, you can run npm by calling `npm.cmd` directly or use the shim in your PowerShell profile.

Troubleshooting
- If install fails due to locked files or permission errors, try deleting `node_modules` and `package-lock.json` then re-run `npm install`.
- For global npm updates: `npm install -g npm@latest` (requires appropriate permissions).

Enjoy developing!
