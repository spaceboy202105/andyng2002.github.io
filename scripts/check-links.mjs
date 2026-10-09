import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';

function srcsetUrls(value) {
  const urls = [];
  while (value.trim()) {
    value = value.replace(/^[\s,]+/, '');
    const url = value.match(/^\S+/)?.[0];
    if (!url) break;
    urls.push(url.replace(/,+$/, ''));
    value = value.slice(url.length);
    if (!url.endsWith(',')) value = value.replace(/^[^,]*(?:,|$)/, '');
  }
  return urls;
}

export async function checkLocalLinks(settings, files) {
  const pages = new Map();
  for (const file of Object.keys(files).filter(file => file.endsWith('.html'))) {
    const page = { ids: new Set(), links: [] };
    function walk(node) {
      for (const { name, value } of node.attrs ?? []) {
        if (name === 'id' || (node.tagName === 'a' && name === 'name')) page.ids.add(value);
        if (['href', 'src', 'srcset'].includes(name)) page.links.push(...(name === 'srcset' ? srcsetUrls(value) : [value]));
      }
      for (const child of node.childNodes ?? []) walk(child);
    }
    walk(parse(await readFile(path.join(settings.outDir, file), 'utf8')));
    pages.set(file, page);
  }
  const errors = [];
  for (const [file, page] of pages) {
    const pageUrl = new URL(`${settings.base}${file.replace(/index\.html$/, '')}`, settings.site);
    for (const value of page.links) {
      let url;
      try { url = new URL(value, pageUrl); }
      catch { errors.push(`Invalid local URL in ${file}: ${value}`); continue; }
      if (url.origin !== settings.site || !['http:', 'https:'].includes(url.protocol)) continue;
      if (!url.pathname.startsWith(settings.base)) {
        errors.push(`Local URL escapes deployment base in ${file}: ${value}`);
        continue;
      }
      let target;
      try { target = decodeURIComponent(url.pathname.slice(settings.base.length)); }
      catch { errors.push(`Invalid URL encoding in ${file}: ${value}`); continue; }
      if (!target || target.endsWith('/')) target += 'index.html';
      if (!Object.hasOwn(files, target)) {
        errors.push(`Missing local target in ${file}: ${value}`);
        continue;
      }
      if (url.hash && pages.has(target)) {
        let anchor;
        try { anchor = decodeURIComponent(url.hash.slice(1)); }
        catch { errors.push(`Invalid anchor encoding in ${file}: ${value}`); continue; }
        if (anchor && !pages.get(target).ids.has(anchor)) errors.push(`Missing local anchor in ${file}: ${value}`);
      }
    }
  }
  return errors;
}
