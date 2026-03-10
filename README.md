# Simple File Hosting

This lightweight Vue app lets you browse the contents of `public/FileRoot` in a recursive tree, copy direct file URLs, and download individual files. It was designed to run locally during development and deploy easily to GitHub Pages (or any static file host).

## Features

- Expandable folder tree showing every folder and file under `public/FileRoot`.
- Alphabetical sorting with directories before files.
- Clicking a folder toggles its children; file names are displayed with adjacent “Copy” and “Download” links.
- **Copy URL** puts a fully-qualified link on the clipboard; a toast confirms success.
- **Download** link points at the actual file so browsers download or display it directly.
- In dev (`npm run dev`), middleware serves files directly from `public/FileRoot`.
- In production, the contents of `FileRoot` are flattened into `dist/` so that URLs like `/3.jpg` work.
- No Vue Router is used; routing is purely server‑based or static.

## Local development

```bash
npm install
npm run dev  # rebuilds tree.json each run
```

Open <http://localhost:5173> (or whatever port Vite picks) and the file explorer will appear. A small `favicon.ico` stub is placed in `public/` so the browser no longer logs a 404 for it.

## Building for production

```bash
npm run build
```

The build performs several preparatory steps:

1. `npm run gen-tree` generates `public/tree.json` containing the file hierarchy.
2. Vite builds the app with `base` configured dynamically (`'/'` in dev, `'/SimpleFileHosing/'` in production).
3. After the build, a script flattens `dist/FileRoot/*` into the root of `dist` so that files are accessible by their relative paths.

The resulting `dist/` directory is ready to publish to GitHub Pages. Asset links and file URLs are prefixed correctly thanks to Vite's `base` setting.

## GitHub Pages deployment

- Set the `homepage` field in `package.json` to `https://<your‑user>.github.io/<repo>/`.
- The `vite.config.js` base option already switches based on `mode`.
- Push the contents of `dist/` to the `gh-pages` branch or use a deployment action.

## Notes

- There is no server-side code in production; everything is static. Dynamic features (like `/api/tree`) are replaced by the compiled `tree.json` file.
- Edit the `file root` by placing files inside `public/FileRoot` and rerun the dev server or build script.
- The app does not support writing; it's a read-only browser.

Happy hosting! Let me know if you want help automating deployment or adding authentication.