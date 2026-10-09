import { visit } from 'unist-util-visit';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function safeMarkdown({ base, publicDir }) {
  const publicFiles = JSON.parse(readFileSync(new URL('../../../scripts/public-files.json', import.meta.url), 'utf8'));
  return (tree, file) => {
    const imageReferences = new Set();
    const linkReferences = new Set();
    visit(tree, node => {
      if (node.type === 'imageReference') imageReferences.add(node.identifier.toUpperCase());
      if (node.type === 'linkReference') linkReferences.add(node.identifier.toUpperCase());
    });
    visit(tree, node => {
      if (node.type === 'html') file.fail('Raw HTML is not allowed in Blog Markdown', node);
      if (!['link', 'image', 'definition'].includes(node.type)) return;
      const isImage = node.type === 'image' || (node.type === 'definition' && imageReferences.has(node.identifier.toUpperCase()));
      let url;
      try { url = decodeURIComponent(node.url); }
      catch { file.fail('Invalid URL encoding in Blog Markdown', node); }
      if (/[\u0000-\u0020\\]/.test(url) || url.startsWith('//')) file.fail('Unsafe URL in Blog Markdown', node);
      if (/^https?:\/\//.test(node.url)) {
        try { new URL(node.url); } catch { file.fail('Invalid external URL in Blog Markdown', node); }
        return;
      }
      if (url.startsWith('#') && !isImage) return;
      if (/^\.\.\/\.\.\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp|avif)$/.test(url)) {
        if (node.type !== 'image' && !(node.type === 'definition' && imageReferences.has(node.identifier.toUpperCase()) && !linkReferences.has(node.identifier.toUpperCase()))) file.fail('Relative asset URLs must be used as images', node);
        if (!existsSync(path.resolve(path.dirname(file.path), url))) file.fail(`Missing approved image: ${url}`, node);
        return;
      }
      if (url.startsWith('/') && !url.split(/[/?#]/).includes('..')) {
        const target = url.split(/[?#]/)[0].slice(1);
        const page = /^(?:en|zh)\/(?:|publications\/|projects\/|blog\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)?)$/.test(target);
        const asset = publicFiles.includes(target) && existsSync(path.join(publicDir, target));
        if ((page && !isImage) || asset) {
          node.url = `${base.replace(/\/$/, '')}${node.url}`;
          return;
        }
      }
      file.fail(`URL must use http/https, a site page, or an approved local resource: ${node.url}`, node);
    });
  };
}
