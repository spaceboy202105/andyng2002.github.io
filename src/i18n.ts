export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export type LocalizedText = Record<Locale, string>;
export type PageTarget =
  | { kind: 'home' }
  | { kind: 'publications' }
  | { kind: 'projects' }
  | { kind: 'blog' }
  | { kind: 'article'; storyId: string };

export function assetHref(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function pageHref({ locale, target }: { locale: Locale; target: PageTarget }): string {
  switch (target.kind) {
    case 'home': return assetHref(`${locale}/`);
    case 'publications': return assetHref(`${locale}/publications/`);
    case 'projects': return assetHref(`${locale}/projects/`);
    case 'blog': return assetHref(`${locale}/blog/`);
    case 'article': return assetHref(`${locale}/blog/${encodeURIComponent(target.storyId)}/`);
  }
}

export const ui = {
  en: { home: 'Home', contact: 'Contact', menu: 'Menu', navigation: 'Main navigation', skip: 'Skip to content', missing: 'Page not found', returnHome: 'Back to home', missingText: 'This address does not point to a page. Return to the homepage to continue.' },
  zh: { home: '首页', contact: '联系', menu: '菜单', navigation: '主导航', skip: '跳到正文', missing: '页面不存在', returnHome: '返回首页', missingText: '此地址没有对应页面。请返回首页继续浏览。' },
} satisfies Record<Locale, Record<string, string>>;
