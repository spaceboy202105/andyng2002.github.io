const root = document.documentElement;
const preferenceKey = 'site-language';
if (root.hasAttribute('data-default-entry')) {
  let preferred = 'en';
  try { if (localStorage.getItem(preferenceKey) === 'zh') preferred = 'zh'; } catch {}
  const destination = preferred === 'zh' ? root.dataset.zhHome : root.dataset.enHome;
  if (destination) location.replace(destination);
}
for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-language]')) {
  link.addEventListener('click', () => {
    try { localStorage.setItem(preferenceKey, link.dataset.language === 'zh' ? 'zh' : 'en'); } catch {}
  });
}
