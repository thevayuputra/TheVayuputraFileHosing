# How to use

This project now provides a recursive **FileListing** landing page instead of the earlier file browser. There is no Vue router; the app simply displays the full directory tree under `public/FileRoot` when you visit `/`.

- The root page (`/`) lists every folder and file beneath `public/FileRoot` as an expandable tree view.
- Entries are sorted alphabetically with directories shown before files.
- Clicking a folder toggles expansion/collapse of its children; folder names are also links to their path.
- File links and direct URLs such as `/1.png` or `/Chapter1/2.png` bypass the app and are served straight from `public/FileRoot` by custom middleware, allowing the browser to display or download them.
- No special `/api/` prefix is required for file access.
- The previous `FileBrowser.vue` component and router configuration have been removed.

1. Install

    - Fork or duplicate the repository
    - `npm install`
    - `npm run dev`

> The API endpoints `/api/list` and `/api/file` are provided by a Vite development middleware; this behavior is only available while running `npm run dev`.
