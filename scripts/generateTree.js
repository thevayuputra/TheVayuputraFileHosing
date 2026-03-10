const fs = require('fs');
const path = require('path');

// Walk a directory recursively and collect path & isDirectory
async function walk(current, relative = '') {
  const items = [];
  const entries = await fs.promises.readdir(current, { withFileTypes: true });
  for (const e of entries) {
    const relPath = relative ? `${relative}/${e.name}` : e.name;
    items.push({ path: relPath, isDirectory: e.isDirectory() });
    if (e.isDirectory()) {
      const sub = await walk(path.join(current, e.name), relPath);
      items.push(...sub);
    }
  }
  return items;
}

(async () => {
  try {
    const root = path.join(process.cwd(), 'public', 'FileRoot');
    const tree = await walk(root);
    const outputPath = path.join(process.cwd(), 'public', 'tree.json');
    await fs.promises.writeFile(outputPath, JSON.stringify({ tree }, null, 2));
    console.log('tree.json generated with', tree.length, 'items');
  } catch (err) {
    console.error('failed to generate tree', err);
    process.exit(1);
  }
})();