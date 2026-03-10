const fs = require('fs');
const path = require('path');

async function copyRecursive(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(src, e.name);
    const destPath = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

(async () => {
  try {
    const distDir = path.join(process.cwd(), 'dist');
    const root = path.join(distDir, 'FileRoot');
    const stat = await fs.promises.stat(root).catch(() => null);
    if (stat && stat.isDirectory()) {
      await copyRecursive(root, distDir);
      await fs.promises.rm(root, { recursive: true, force: true });
      console.log('flattened FileRoot into dist');
    }
  } catch (err) {
    console.error('failed to flatten FileRoot', err);
    process.exit(1);
  }
})();