<template>
  <section class="file-listing">
    <header class="page-header">
      <h1>Simple File Hosting</h1>
      <p class="page-subtitle">Browse folders, copy links, and download files from one place.</p>
    </header>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-else class="tree-shell">
      <ul v-if="tree.length" class="tree-root">
        <TreeNode
          v-for="node in tree"
          :key="node.path"
          :node="node"
          :level="0"
          @copy-url="copyFileUrl"
          @download="downloadFile"
        />
      </ul>
      <p v-else class="empty-state">No files found.</p>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, h, onMounted, PropType, ref } from 'vue';

type TreeItem = {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeItem[];
};

const TreeNode = defineComponent({
  name: 'TreeNode',
  emits: ['copy-url', 'download'],
  props: {
    node: { type: Object as PropType<TreeItem>, required: true },
    level: { type: Number, required: true }
  },
  setup(props, { emit }) {
    const expanded = ref(props.level === 0);

    const toggle = () => {
      if (props.node.isDirectory) {
        expanded.value = !expanded.value;
      }
    };

    const handleCopy = () => emit('copy-url', props.node.path);
    const handleDownload = () => emit('download', props.node.path);

    return () => {
      const rowClass = props.node.isDirectory ? 'tree-row tree-row--folder' : 'tree-row tree-row--file';
      const rowContent = props.node.isDirectory
        ? h(
            'button',
            {
              type: 'button',
              class: 'folder-toggle',
              onClick: toggle
            },
            [
              h('span', { class: 'folder-caret' }, expanded.value ? 'v' : '>'),
              h('span', { class: 'folder-name' }, props.node.name)
            ]
          )
        : [
            h('span', { class: 'file-label' }, props.node.name),
            h('div', { class: 'file-actions' }, [
              h(
                'button',
                {
                  type: 'button',
                  class: 'action-button',
                  onClick: handleCopy
                },
                'Copy URL'
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'action-button action-button--primary',
                  onClick: handleDownload
                },
                'Download'
              )
            ])
          ];

      return h('li', { class: 'tree-node' }, [
        h(
          'div',
          {
            class: rowClass,
            style: { paddingLeft: `${props.level * 20}px` }
          },
          rowContent
        ),
        props.node.isDirectory && expanded.value && props.node.children.length
          ? h(
              'ul',
              { class: 'tree-children' },
              props.node.children.map(child =>
                h(TreeNode, {
                  key: child.path,
                  node: child,
                  level: props.level + 1,
                  onCopyUrl: (path: string) => emit('copy-url', path),
                  onDownload: (path: string) => emit('download', path)
                })
              )
            )
          : null
      ]);
    };
  }
});

export default defineComponent({
  name: 'FileListing',
  components: { TreeNode },
  setup() {
    const tree = ref<TreeItem[]>([]);
    const error = ref('');
    const rootFolderName = ref('FileRoot');

    function buildTree(items: { path: string; isDirectory: boolean }[]) {
      const root: TreeItem[] = [];

      items.forEach(item => {
        const normalizedPath = item.path.replace(/\\+/g, '/');
        const parts = normalizedPath.split('/').filter(Boolean);
        let currentLevel = root;
        let currentPath = '';

        parts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          let node = currentLevel.find(entry => entry.path === currentPath);

          if (!node) {
            node = {
              name: part,
              path: currentPath,
              isDirectory: index < parts.length - 1 || item.isDirectory,
              children: []
            };
            currentLevel.push(node);
          }

          if (index === parts.length - 1) {
            node.isDirectory = item.isDirectory;
          }

          currentLevel = node.children;
        });
      });

      const sortNodes = (nodes: TreeItem[]) => {
        nodes.sort((left, right) => {
          if (left.isDirectory !== right.isDirectory) {
            return left.isDirectory ? -1 : 1;
          }
          return left.name.localeCompare(right.name);
        });

        nodes.forEach(node => sortNodes(node.children));
      };

      sortNodes(root);
      return root;
    }

    const toPublicUrl = (filePath: string) => {
      // strip leading slashes or hash fragments (in case URL has been mangled)
      const normalized = filePath.replace(/^\/+/, '').replace(/^#\/+/, '');
      // always include the base URL prefix so GH‑Pages subpath is respected
      const base = import.meta.env.BASE_URL || '/';
      return new URL(`${base}${normalized}`, window.location.origin).toString();
    };

    const copyFileUrl = async (filePath: string) => {
      const publicUrl = toPublicUrl(filePath);

      try {
        await navigator.clipboard.writeText(publicUrl);
      } catch (copyError) {
        error.value = copyError instanceof Error ? copyError.message : 'Unable to copy file URL.';
      }
    };

    const downloadFile = (filePath: string) => {
      const publicUrl = toPublicUrl(filePath);
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    async function load() {
      try {
        error.value = '';
        // in production there's no server middleware, so use pre‑generated JSON
        const url = `${import.meta.env.BASE_URL}tree.json`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        rootFolderName.value = data.rootFolder || 'FileRoot';
        tree.value = [
          {
            name: rootFolderName.value,
            path: '',
            isDirectory: true,
            children: buildTree(data.tree)
          }
        ];
      } catch (loadError: unknown) {
        error.value = loadError instanceof Error ? loadError.message : String(loadError);
      }
    }

    onMounted(load);

    return { copyFileUrl, downloadFile, error, tree };
  }
});
</script>

<style scoped>
.file-listing {
  max-width: 1040px;
  margin: 0 auto;
  padding: 40px 24px 56px;
  color: #132238;
}

.page-header {
  margin-bottom: 28px;
}

h1 {
  margin: 0;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1;
  letter-spacing: -0.03em;
}

.page-subtitle {
  margin: 12px 0 0;
  max-width: 640px;
  font-size: 16px;
  line-height: 1.6;
  color: #56657d;
}

.tree-shell {
  border: 1px solid #d7dfec;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(44, 120, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f7faff 100%);
  box-shadow: 0 24px 60px rgba(23, 50, 94, 0.1);
  padding: 24px;
}

.tree-root,
.tree-children {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tree-node + .tree-node {
  margin-top: 10px;
}

.tree-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  border: 1px solid #e3eaf5;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  padding: 10px 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.tree-row:hover {
  border-color: #bfd2f6;
  box-shadow: 0 12px 24px rgba(29, 78, 216, 0.08);
}

.tree-row--folder {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.tree-row--file {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
}

.folder-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.folder-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #e8f0ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.folder-name,
.file-label {
  overflow-wrap: anywhere;
}

.folder-name {
  font-weight: 700;
}

.file-label {
  min-width: 0;
  font-weight: 600;
  color: #1b2b42;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.action-button {
  border: 1px solid #c8d6ee;
  border-radius: 999px;
  background: #fff;
  color: #1d3557;
  padding: 9px 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.action-button--primary {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #fff;
}

.tree-children {
  margin-top: 10px;
}

.error {
  border: 1px solid #f3c6c3;
  border-radius: 16px;
  background: #fff3f2;
  color: #b42318;
  margin-top: 12px;
  padding: 14px 16px;
}

.empty-state {
  margin: 0;
  color: #51627f;
  padding: 12px 4px;
}

@media (max-width: 640px) {
  .file-listing {
    padding: 24px 14px 40px;
  }

  .tree-row {
    min-height: auto;
  }

  .tree-row--file {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .file-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .action-button {
    flex: 1 1 140px;
  }

  .tree-shell {
    padding: 16px;
  }
}
</style>
