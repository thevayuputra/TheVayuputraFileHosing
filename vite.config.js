import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from "url";
import fs from 'fs';
import path from 'path';

const ROOT_FOLDER = 'public/FileRoot';
const ROOT_FOLDER_NAME = path.basename(ROOT_FOLDER);

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = {
    ...process.env,
    ...loadEnv(mode, process.cwd())
  };

  return defineConfig({
    
    plugins: [
      vue(),
      {
        name: 'vite-plugin-webgl-index-rewrite',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            try {
              const orig = req.url.split('?')[0];
              // match /WebGL/<folder> with optional trailing slash and no file extension
              if (/^\/WebGL\/[^/.]+\/?$/.test(orig)) {
                const p = orig.replace(/\/$/, '');
                req.url = p + '/index.html';
              }
            } catch (e) {
              // ignore and continue
            }
            next();
          });
        }
      },
      {
        name: 'vite-plugin-file-browser',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            try {
              // Serve direct file requests from the configured root folder
              if (req.method === 'GET' && req.url && !req.url.startsWith('/api/')) {
                // strip leading slash
                const rel = decodeURIComponent(req.url.replace(/^\//, ''));
                const filePath = path.join(process.cwd(), ROOT_FOLDER, rel);
                try {
                  const stat = await fs.promises.stat(filePath);
                  if (stat.isFile()) {
                    const stream = fs.createReadStream(filePath);
                    stream.pipe(res);
                    return;
                  }
                } catch {
                  // not a file, continue on
                }
              }

              if (req.url && req.url.startsWith('/api/')) {
                const url = new URL(req.url, 'http://localhost');
                const pathname = url.pathname;

                if (pathname === '/api/tree') {
                  const dir = url.searchParams.get('path') || '';
                  const baseDir = path.join(process.cwd(), ROOT_FOLDER);
                  const start = path.join(baseDir, dir);
                  async function walk(current, relative) {
                    const items = [];
                    const entries = await fs.promises.readdir(current, { withFileTypes: true });
                    for (const e of entries) {
                      // use forward slashes regardless of OS
                      const relPath = relative ? `${relative}/${e.name}` : e.name;
                      if (e.isDirectory()) {
                        items.push({ path: relPath, isDirectory: true });
                        items.push(...await walk(path.join(current, e.name), relPath));
                      } else {
                        items.push({ path: relPath, isDirectory: false });
                      }
                    }
                    return items;
                  }
                  try {
                    const tree = await walk(start, dir);
                    res.setHeader('content-type', 'application/json');
                    res.end(JSON.stringify({ path: dir, rootFolder: ROOT_FOLDER_NAME, tree }));
                    return;
                  } catch (e) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'not found' }));
                    return;
                  }
                } else if (pathname === '/api/list') {
                  const dir = url.searchParams.get('path') || '';
                  const root = process.cwd();
                  // always operate within the configured root folder
                  const baseDir = path.join(root, ROOT_FOLDER);
                  const full = path.join(baseDir, dir);
                  try {
                    const entries = await fs.promises.readdir(full, { withFileTypes: true });
                    const list = entries.map(e => ({
                      name: e.name,
                      isDirectory: e.isDirectory()
                    }));
                    res.setHeader('content-type', 'application/json');
                    res.end(JSON.stringify({ path: dir, list }));
                    return;
                  } catch (e) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'not found' }));
                    return;
                  }
                } else if (pathname === '/api/file') {
                  const file = url.searchParams.get('path');
                  if (!file) {
                    res.statusCode = 400;
                    res.end('no path');
                    return;
                  }
                  const baseDir = path.join(process.cwd(), ROOT_FOLDER);
                  const full = path.join(baseDir, file);
                  try {
                    const content = await fs.promises.readFile(full, 'utf-8');
                    res.setHeader('content-type', 'text/plain');
                    res.end(content);
                    return;
                  } catch (e) {
                    res.statusCode = 404;
                    res.end('not found');
                    return;
                  }
                }
              }
            } catch (err) {
              // ignore and continue to next middleware
            }
            next();
          });
        }
      }
    ],
    // during development run at root, but use GH pages subpath for production
    base: mode === 'production' ? '/SimpleFileHosing/' : '/',
    resolve: {
      alias: [
        { find: "@", replacement: fileURLToPath(new URL('./src', import.meta.url)) }
      ]
    },
    css: {
      preprocessorOptions: {
        less: {
          math: "always",
          relativeUrls: true,
          javascriptEnabled: true
        }
      }
    }
  });
} 
