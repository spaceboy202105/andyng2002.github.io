# 中英文个人学术主页 Implementation Plan

执行状态更新于 2026-10-09。T01 至 T06 已集成并验收，T07 的本地发布检查通过，远端验证和部署待完成。以下保留原计划的步骤和预期结果；实际配置、命令和版本以 `package.json` 及 `README.md` 为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付可维护的中英文个人学术网站，包含已批准的简介、论文、项目、Blog、联系入口和重新制作的中英文 CV。

**Architecture:** 使用 Astro 将已批准的 Markdown 内容生成静态页面，浏览器只处理语言偏好和必要导航。论文、项目和文章各自读取经过校验的内容，首页只组合其结果。正式 CV 由独立 LaTeX 源稿生成，公开文件与本地素材隔离。

**Tech Stack:** 计划采用 Astro 7.3.7、TypeScript、原生 CSS、Astro 内容集合、Playwright、Node 内置测试工具；文章采用 Astro 的 unified Markdown 处理器、内置 Shiki、remark-math 与 rehype-katex；CV 使用 XeLaTeX、latexmk、CTEX 与 Fandol 字体。Node 最低 22.12.0，计划在本地和持续集成使用 Node 24。当前未安装这些项目依赖。

**Spec:** [中英文个人学术主页开发规范](../specs/2026-10-08-personal-site-development.md)。执行者同时阅读本计划、规范与项目术语表。

## Global Constraints

- 首页顺序为简介、代表论文、代表项目、最新文章和联系方式。
- 项目和代表作品由用户选择。已存在的素材、简历中的条目和测试样例都不能自动获得展示资格。
- 视觉方案已确定为第二轮原型 A，基准提交 `7c20ee6`。按[开发规范的已选视觉方案](../specs/2026-10-08-personal-site-development.md#已选视觉方案)实现；B、C、风格切换条和示例内容不进入正式页面。
- 简介、论文说明和项目说明必须具有中英文版本。正式题名、作者顺序、机构名称及发表信息保留准确的原始记录。
- 中文和英文 CV 的入口同时存在，不因为界面语言而隐藏另一份。
- 已有简历及其删除私人字段后的副本仅作资料参考，不得替代正式 CV。
- 原始素材保持本地保存，并通过 Git 忽略规则排除。构建只读取明确批准的公开输入，不能递归复制原始素材目录。
- 内容校验或构建失败时停止发布，保留已经在线的版本，并输出可定位的错误。
- 当前工作树的旧站删除尚未提交；开始隔离开发前，先单独保存这些已授权删除，避免新工作树从旧提交恢复旧站。不得用全量暂存夹带本地素材。
- 本文描述未来执行步骤和预期结果，不代表命令已运行。本轮按 implement-spec 以隔离工作树执行七项任务，在单一集成分支汇总并部署到已核对的 GitHub Pages 地址。

## Review Focus

1. 浏览器禁止本地存储，或保存的中文偏好与英文直达链接冲突：直达链接有效，当前切换不报错。归属 Task 1 的语言测试。
2. 站点托管在子目录：导航、照片、文章与 CV 不跳到域名根目录。Task 1 定义路径规则，Task 7 用子目录完整复测。
3. 同一文章有两个语言文件：内容集合 ID 不覆盖，译文用独立关联字段对应；缺译文不漏文章。归属 Task 4。
4. 带中文、百分号、下划线或长链接的 CV 内容：LaTeX 编译成功、文字不丢失、两种 PDF 对应正确。归属 Task 6。
5. 测试样例或未引用的本地素材被复制到发布目录：即使页面看起来正确也必须检测失败。Task 1 建立输出隔离，Task 7 验证发布检查。

---

## 任务与责任分配

| 任务 | 阻塞任务 | 负责范围 | 独立交付 |
| --- | --- | --- | --- |
| T01 | 无 | 页面基础与共享接口负责人 | 可构建、可浏览的双语个人首页 |
| T02 | T01 | 学术成果负责人 | 从 Markdown 到中英文论文列表 |
| T03 | T01 | 个人项目负责人 | 只展示获选项目的中英文列表 |
| T04 | T01 | Blog 负责人 | 可阅读的单语和双语研究文章 |
| T05 | T02、T03、T04 | 内容整合负责人 | 首页精选、最新文章及跨内容关联 |
| T06 | T01 | CV 负责人 | 两份重新排版的 CV 及下载入口 |
| T07 | T05、T06 | 发布与验收负责人 | 检查通过后才允许更新站点的流程 |

这是一组职责，不预设七个人同时工作。T01 完成后，T02、T03、T04、T06 在逻辑上可以并行；若并行，使用独立工作树，由整合负责人合并共享配置的修改。当前仓库很小，建议先采用主代理顺序实现、最后统一独立审阅的方式。

真实项目和代表论文名单、CV 最终条目、发布地址及 Pages 权限是外部输入。缺少输入时用非公开测试样例验收功能，明确标记真实内容未交付，不擅自选择。

## 文件职责与接口约定

以下均为计划创建的路径；当前没有网站源代码。责任文件随所属任务建立，不一次性生成空模块。

| 路径 | 职责／归属 |
| --- | --- |
| `package.json`、`package-lock.json`、`astro.config.mjs`、`tsconfig.json`、`.nvmrc` | 项目工具、依赖锁定、静态构建；T01 创建，之后由整合负责人维护 |
| `src/content.config.ts` | 注册实际存在的内容集合，使用 `glob` 与 `astro/zod`；T01 创建，T02–T04 各增一项注册 |
| `src/content/`、`src/assets/` | 明确批准的 Markdown 与网站图片，绝不从本地素材目录批量导入 |
| `src/features/profile/`、`src/features/publications/`、`src/features/projects/`、`src/features/blog/` | 各自的集合定义、内容读取及呈现部件 |
| `src/i18n.ts`、`src/scripts/language.ts` | 双语文案、带部署前缀的地址，以及本地语言选择 |
| `src/layouts/SiteLayout.astro`、`src/components/ContactLinks.astro`、`src/styles/global.css` | 共享页面、联系入口及少量统一样式值 |
| `src/pages/index.astro`、`src/pages/[lang]/index.astro`、`src/pages/404.astro` | 默认入口、双语首页和错误页；T01 创建，T05 汇总首页内容 |
| `src/pages/[lang]/publications/index.astro`、`src/pages/[lang]/projects/index.astro` | T02 与 T03 的完整列表 |
| `src/pages/[lang]/blog/index.astro`、`src/pages/[lang]/blog/[storyId].astro` | T04 的列表和独立文章页 |
| `cv/zh.tex`、`cv/en.tex`、`cv/style.tex`、`cv/manifest.json` | CV 可编辑源稿、共享排版及来源校验；T06 |
| `scripts/build-cv.mjs`、`public/cv/zh.pdf`、`public/cv/en.pdf` | 编译 CV 和两份最终公开文件；T06 |
| `scripts/check-artifacts.mjs` | 输出清单、CV 来源及禁止公开内容检查；T01 建立，T06/T07 扩展 |
| `playwright.config.ts`、`tests/e2e/`、`tests/build/`、`tests/artifacts/`、`tests/fixtures/` | 浏览器验收及少量构建边界检查 |
| `.github/workflows/verify.yml`、`.github/workflows/deploy.yml`、`README.md` | T07 的完整检查、发布方式和维护说明 |

### 共用规则

- `Locale = 'en' | 'zh'`，`LocalizedText = Record<Locale, string>`，均由 `src/i18n.ts` 导出。
- `PageTarget` 是五种情况的联合：`{ kind: 'home' }`、`{ kind: 'publications' }`、`{ kind: 'projects' }`、`{ kind: 'blog' }`、`{ kind: 'article'; storyId: string }`。
- `pageHref({ locale, target }: { locale: Locale; target: PageTarget }): string`、`assetHref(path: string): string` 同样由 `src/i18n.ts` 导出，统一使用 Astro 配置中的部署前缀，禁止各组件手工拼接前缀。
- 文章页面地址使用界面语言和 `storyId`，不使用显示标题。集合条目 ID 包含文件语言，`storyId` 单独关联译文。
- 内容类型来自集合 schema 和 `CollectionEntry`，不再手写重复的数据接口。`approved` 和 `featured` 默认为 `false`，只有已批准条目能进入页面读取函数。
- 联系方式协议允许 `https:`、`http:`、`mailto:`；论文、项目与图片的外部地址只允许 `https:` 或 `http:`。本地资源须位于批准的资源目录且目标存在。
- 所有内容列表显式排序：时间倒序，相同时间以稳定 ID 升序；项目无可靠时间时按稳定 ID 升序。不得依赖文件系统顺序。
- `SITE_URL` 与 `SITE_BASE_PATH` 是构建配置输入；本地默认分别为 `http://127.0.0.1:4321` 和 `/`。正式部署要求显式设置，不能从 Git remote 推导。
- `SITE_CONTENT_DIR` 默认 `src/content`，测试指定 `tests/fixtures/content`；`SITE_PUBLIC_DIR` 默认 `public`，测试指定 `tests/fixtures/public`；`SITE_OUTPUT_DIR` 默认 `dist`，浏览器测试指定 `.test-dist`。T06 增加 `CV_SOURCE_DIR`，默认 `cv`，测试指定 `tests/fixtures/cv`，manifest 始终位于该目录。所有配置由 Astro 配置或实际读取资源的边界统一解析，输入输出不得指向本地原始素材目录。
- Playwright 的 `webServer.env` 将上述测试目录同时传给构建和预览；配置 `reuseExistingServer: false`，显式设置 `use.baseURL` 和用于就绪检查的页面 URL。默认配置忽略 `cv-missing.spec.ts` 和 `release.spec.ts`，它们由独立配置运行，不能与默认根目录测试混用输出或端口。下文一般测试片段针对根目录；子目录测试独立断言固定的 `/preview/` 前缀，不调用产品路径函数计算预期结果。

### 计划建立的命令

| 命令 | 确定行为 |
| --- | --- |
| `npm run check` | 运行 `astro check` |
| `npm run build` | 运行 `astro build`，默认产出正式输入对应的 `dist` |
| `npm run preview` | 运行 `astro preview --host 127.0.0.1 --port 4321` |
| `npm run test:e2e` | 运行 `playwright test`；其 webServer 用独立测试输入构建并预览 `.test-dist`，禁止复用已有服务器 |
| `npm run test:content` | `node --test tests/build/*.test.mjs`；测试通过临时内容目录触发实际构建，验证错误信息和退出码 |
| `npm run check:artifacts` | `node scripts/check-artifacts.mjs`，检查当前正式构建输出 |
| `npm run test:artifacts` | `node --test tests/artifacts/*.test.mjs`，使用非私人样例验证检查脚本 |
| `npm run build:cv` | `node scripts/build-cv.mjs`，仅在 T06 建立 |
| `npm run test:cv-missing` | `playwright test --config playwright.cv-missing.config.ts`；T06 建立，端口 4322、输出 `.test-dist-cv-missing` |
| `npm run test:subpath` | `playwright test --config playwright.release.config.ts`；T07 建立，固定 `/preview/` 前缀、端口 4323、输出 `.test-dist-subpath` |
| `npm run verify` | 顺序执行 check、test:content、test:artifacts、test:e2e、build、check:artifacts；T06 在正式 build 前加入 test:cv-missing，T07 再加入 test:subpath；任一步失败即停止 |
| `npm run verify:release` | verify 成功后执行 `node scripts/check-artifacts.mjs --release`，要求两份最终 CV、正式发布参数和真实获准内容；T07 建立 |

## Task 1: 双语个人首页可完整浏览

**Blocked by:** 无。

**Visual reference:** 使用已选原型 A 的中英文桌面与手机截图对照实现。品牌标识读取 `profile.brand`，正式姓名读取 `profile.name`。视觉选择已完成，正式实现及验收仍待执行。

**Files:** 创建上述项目配置、`src/features/profile/collection.ts`、`src/features/profile/content.ts`、`src/content/profile/main.md`、`src/assets/portrait.jpg`、共享布局与语言文件、三个基础页面、`playwright.config.ts`、`scripts/check-artifacts.mjs`、`tests/e2e/home.spec.ts`、`tests/build/profile.test.mjs`、`tests/artifacts/exclusion.test.mjs` 和对应公开测试样例；修改 `.gitignore`。本任务不创建其他内容模块的空文件。

**Interfaces:** 消费已经允许公开的个人资料。产出上述语言与路径接口，以及 `getProfile(): Promise<CollectionEntry<'profile'>>`。profile schema 包含 `approved: boolean`、`brand: string`（已确认值为 `andy`）、`name/bio: LocalizedText`、`portrait` 图片、`portraitAlt: LocalizedText`、`contacts: { label: string; href: string }[]`。`SiteLayout` 属性为 `{ locale: Locale; title: string; target: PageTarget }`；`ContactLinks` 属性为 `{ locale: Locale; contacts: Profile['data']['contacts'] }`，其中 `Profile = CollectionEntry<'profile'>`，在 profile content 模块导出。

- [ ] **Step 1: 建立可运行空站和测试入口。** 先保存已授权的旧站删除，再按隔离工作树技能建立执行环境。建立 Node 24 配置，安装并锁定 `astro@7.3.7`、TypeScript、`@astrojs/check`、`@playwright/test`，安装 Chromium 测试浏览器。移除旧的 npm 锁文件忽略规则，保留原始素材忽略，新增构建和测试输出忽略。让空首页可返回响应，用于下一步产生真实页面断言失败。
- [ ] **Step 2: 写失败的访客行为测试。** 在 `home.spec.ts` 写 `home defaults to English and remembers explicit choice`，固定断言如下；另写 `explicit URL wins over stored preference` 和 `language works when storage is denied`，通过浏览器禁止存储验证当前切换仍可用。

```ts
await page.goto('/');
await expect(page).toHaveURL(/\/en\/$/);
await expect(page.getByRole('heading', { name: 'Test Researcher', level: 1 })).toBeVisible();
await page.getByRole('link', { name: '中文', exact: true }).click();
await expect(page).toHaveURL(/\/zh\/$/);
await page.reload();
await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
await page.goto('/');
await expect(page).toHaveURL(/\/zh\/$/);
```

- [ ] **Step 3: 运行红灯检查。** `npm run test:e2e -- tests/e2e/home.spec.ts`。预期由于空首页缺少目标内容或语言行为而失败；不能把缺依赖、服务器未启动或端口冲突当成有效红灯。
- [ ] **Step 4: 实现首页完整路径。** `getProfile` 要求恰好一份获准简介，并在集合读取时检查双语字段、协议及图片；页面使用该记录渲染照片、简介、联系链接。`pageHref` 生成携带前缀的地址；`language.ts` 对默认入口应用保存偏好，显式语言地址保持不变，仅捕获本地存储访问失败。照片由 Astro 图片管线优化，不复制本地素材目录。只显示已经存在的页面导航，CV 尚未生成时不显示入口。
- [ ] **Step 5: 完成与验证边界。** 在本任务测试中加入窄屏无整页溢出、可见键盘焦点、图标名称、减少动态效果及 404 返回入口；profile 构建测试用无效邮箱协议和缺少中文简介触发可定位错误；产物检查测试用虚构原始资料标记证明未引用文件也不能公开。运行 `npm run verify`，预期退出码 0；人工检查桌面与手机首页。建立 `tests/build/base-path.test.mjs`，以 `SITE_BASE_PATH=/preview/` 构建并检查首页生成的导航和照片地址，完整的子目录浏览器验收在 T07 建立。
- [ ] **Step 6: 提交独立交付。** 仅暂存本任务的配置、源文件和测试，提交 `feat: build bilingual profile homepage`。记录实际截图和命令结果，不把其他任务占位计为完成。

## Task 2: Markdown 论文进入中英文成果列表

**Blocked by:** T01。

**Files:** 创建 `src/features/publications/collection.ts`、`src/features/publications/content.ts`、`src/features/publications/PublicationList.astro`、`src/pages/[lang]/publications/index.astro`、`tests/e2e/publications.spec.ts`、`tests/build/publications.test.mjs` 和论文测试样例；扩展 `src/content.config.ts` 与 SiteLayout 的成果导航。获准真实记录放入 `src/content/publications/`。

**Interfaces:** 消费 T01 的 Locale、LocalizedText、pageHref 和 SiteLayout。产出 `getPublications(): Promise<CollectionEntry<'publications'>[]>`，只返回 approved 条目；`PublicationList` 属性为 `{ locale: Locale; entries: CollectionEntry<'publications'>[] }`。schema 字段为 `approved/featured: boolean`、`title: string`、`authors: string[]`、`year: number`、`status: 'preprint' | 'submitted' | 'accepted' | 'published'`、`summary: LocalizedText`，可选 `venue`、`paperUrl`、`codeUrl`、`cover/coverAlt`。有图片时必须有双语替代文字。

- [ ] **Step 1: 写失败测试。** 以一项获准精选论文、一项获准普通论文和一项未批准论文为样例，测试 `publication list excludes unapproved work and keeps official title`；检查正式题名不随界面语言变化，贡献说明变化，缺代码地址时不出现 Code 链接。

```ts
await page.goto('/en/publications/');
await expect(page.getByRole('heading', { name: 'Sample Published Paper' })).toBeVisible();
await expect(page.getByText('Unapproved Paper', { exact: true })).toHaveCount(0);
await page.getByRole('link', { name: '中文', exact: true }).click();
await expect(page).toHaveURL(/\/zh\/publications\/$/);
await expect(page.getByText('示例研究贡献', { exact: true })).toBeVisible();
```

- [ ] **Step 2: 运行红灯检查。** `npm run test:e2e -- tests/e2e/publications.spec.ts`，预期缺少列表或数据规则导致断言失败。
- [ ] **Step 3: 实现条目到页面。** schema 使用 `astro/zod`，以年份倒序、ID 升序排序；通过 SiteLayout 和 PublicationList 生成两种列表页。缺中英文 summary 的条目构建失败，status 原样解释为正确语言，不根据链接猜测录用状态。
- [ ] **Step 4: 验证内容更新和失败。** `publications.test.mjs` 通过临时 Markdown 增加条目并重新构建，检查 HTML 中出现新题名；删除中文 summary 或填写 `javascript:` 地址时构建失败并指出字段。运行 `npm run verify`，预期全部通过；主页面不因未配置真实论文而自动导入简历候选。
- [ ] **Step 5: 提交。** 提交 `feat: publish bilingual research listings`，仅包含本任务变更。

## Task 3: 用户选定的项目进入中英文列表

**Blocked by:** T01。

**Files:** 创建 `src/features/projects/collection.ts`、`src/features/projects/content.ts`、`src/features/projects/ProjectGrid.astro`、`src/pages/[lang]/projects/index.astro`、`tests/e2e/projects.spec.ts`、`tests/build/projects.test.mjs` 和项目样例；扩展 `src/content.config.ts` 与 SiteLayout 的项目导航。获准真实记录放入 `src/content/projects/`。

**Interfaces:** 消费 T01 的页面和语言接口。产出 `getProjects(): Promise<CollectionEntry<'projects'>[]>`；`ProjectGrid` 属性为 `{ locale: Locale; entries: CollectionEntry<'projects'>[] }`。schema 字段为 `approved/featured: boolean`、`name/summary/role: LocalizedText`、`cover`、`coverAlt: LocalizedText`，可选真实日期 `date` 及 `codeUrl/demoUrl`；不可靠的日期直接缺省，不填假日期。

- [ ] **Step 1: 写失败测试。** `projects show only owner-selected work` 使用获准及未批准项目，断言列表、职责、截图和可选链接行为；两种语言与手机尺寸都执行。

```ts
await page.goto('/zh/projects/');
await expect(page.getByRole('heading', { name: '已选项目' })).toBeVisible();
await expect(page.getByRole('img', { name: '已选项目截图' })).toBeVisible();
await expect(page.getByText('未选项目', { exact: true })).toHaveCount(0);
await expect(page.getByRole('link', { name: /演示|Demo/ })).toHaveCount(0);
```

- [ ] **Step 2: 运行红灯检查。** `npm run test:e2e -- tests/e2e/projects.spec.ts`，预期列表或选择规则尚未实现导致失败。
- [ ] **Step 3: 实现项目路径。** `getProjects` 读取校验后的获准条目，日期有效者倒序、缺日期者排后，同时间或均无日期按 ID 升序。ProjectGrid 显示用途与个人职责，链接直达外部资源；不创建项目详情页。
- [ ] **Step 4: 验证拒绝和更新。** 构建测试检查缺少中文职责、危险协议和不存在截图会明确失败；增加获准 Markdown 后列表更新。运行 `npm run verify`，预期通过。真实项目清单尚未由用户指定时，只完成样例验收，不给任何候选补上 approved。
- [ ] **Step 5: 提交。** 提交 `feat: display selected personal projects`。

## Task 4: Blog 从 Markdown 到完整研究文章阅读

**Blocked by:** T01。

**Files:** 创建 `src/features/blog/collection.ts`、`src/features/blog/content.ts`、`src/features/blog/ArticleLayout.astro`、两个 Blog 路由、`tests/e2e/blog.spec.ts`、`tests/build/blog.test.mjs` 和文章样例；扩展 `src/content.config.ts`、`astro.config.mjs` 与 SiteLayout 的 Blog 导航，安装并锁定 `@astrojs/markdown-remark`、`remark-math`、`rehype-raw`、`rehype-sanitize`、`rehype-katex`、`katex`。真实文章位于 `src/content/blog/`。

**Interfaces:** 消费 T01 的语言路径接口。产出 `getBlogEntries(): Promise<CollectionEntry<'blog'>[]>` 和 `selectArticle({ entries, storyId, locale }: { entries: CollectionEntry<'blog'>[]; storyId: string; locale: Locale }): CollectionEntry<'blog'> | undefined`。先选指定语言，否则选同一 storyId 的现有原文；同一 storyId 与语言重复时构建失败。schema 含 `approved`、`storyId`、`lang: Locale`、`originalLang: Locale`、`title`、`publishedAt`、可选 `updatedAt`、`tags: string[]`、可选摘要及 `relatedPublications/relatedProjects: string[]`。storyId 只含小写字母、数字与连接词的短横线，不能含路径分隔符；日期使用有效的 `YYYY-MM-DD`，列表按 publishedAt 倒序和 storyId 升序排列。

- [ ] **Step 1: 写失败测试。** `single-language story stays visible in both interfaces` 和 `translated story retains identity` 覆盖中英列表集合相同、正文语言标记、正确译文及文章刷新。另准备含数学公式、长代码、图片后相邻图注段落和三级标题的长文。

```ts
await page.goto('/en/blog/chinese-only/');
await expect(page.locator('html')).toHaveAttribute('lang', 'en');
await expect(page.locator('article')).toHaveAttribute('lang', 'zh');
await expect(page.getByText('这篇文章只有中文正文。', { exact: true })).toBeVisible();
await page.getByRole('link', { name: '中文', exact: true }).click();
await expect(page).toHaveURL(/\/zh\/blog\/chinese-only\/$/);
```

- [ ] **Step 2: 运行红灯检查。** `npm run test:e2e -- tests/e2e/blog.spec.ts`，预期文章地址或正文选择尚不存在导致失败。
- [ ] **Step 3: 实现内容与渲染。** glob ID 保留语言区分，不用相同 frontmatter slug 覆盖两个文件。`getStaticPaths` 为每个获准 storyId 生成两种界面地址；使用 `render(entry)` 的 Content 和 headings。Astro 7 配置 `markdown.processor`，调用从 `@astrojs/markdown-remark` 导入的 `unified`，接入 `remark-math` 与 `rehype-katex`；高亮样式须与 Markdown 过滤和内容安全策略兼容；可采用 Prism 的 CSS 类主题替代内联高亮样式，实际浏览器检查着色，阅读页加载 KaTeX 样式。图注使用图片后紧邻的说明段落，不引入通用富文本编辑器或目录插件。
- [ ] **Step 4: 验证阅读及内容错误。** 浏览器检查公式呈现、代码高亮、图注相邻关系、目录跳转、日期及标签，在窄屏中代码和公式局部滚动。构建测试验证重复 storyId/lang、非法日期、updatedAt 早于 publishedAt 明确失败；修改正文后产物更新。运行 `npm run verify`，预期通过。
- [ ] **Step 5: 提交。** 提交 `feat: add bilingual research blog reading`。

## Task 5: 首页精选与论文、项目、文章相互关联

**Blocked by:** T02、T03、T04。

**Files:** 创建 `src/features/related.ts`、`tests/e2e/related.spec.ts`、`tests/build/relations.test.mjs`；修改双语首页、ArticleLayout、PublicationList、ProjectGrid。

**Interfaces:** 消费 T02–T04 的公开内容读取函数。产出 `resolveRelated({ article, publications, projects }: { article: CollectionEntry<'blog'>; publications: CollectionEntry<'publications'>[]; projects: CollectionEntry<'projects'>[] }): { publications: CollectionEntry<'publications'>[]; projects: CollectionEntry<'projects'>[] }`。引用不存在或非公开条目时，错误带文章 ID 和关联 ID。反向关联由文章引用计算，不在论文与项目里维护第二份关联数组。

- [ ] **Step 1: 写失败测试。** `homepage combines only featured work and latest approved stories` 检查首页固定顺序、只出现 featured 论文与项目、最新三篇获准文章，空精选区不出现；`related reading preserves locale` 检查列表到相关文章、文章到论文或项目列表相应锚点，并保留语言。

```ts
await page.goto('/zh/');
await expect(page.getByText('普通非精选项目', { exact: true })).toHaveCount(0);
await page.getByRole('link', { name: '示例研究文章', exact: true }).click();
await expect(page).toHaveURL(/\/zh\/blog\/sample-study\/$/);
await page.getByRole('link', { name: '相关论文：Sample Published Paper' }).click();
await expect(page).toHaveURL(/\/zh\/publications\/#sample-paper$/);
```

- [ ] **Step 2: 运行红灯检查。** `npm run test:e2e -- tests/e2e/related.spec.ts`，预期首页汇总或关联导航尚未建立导致失败。
- [ ] **Step 3: 实现首页组合与关联。** 首页复用既有列表部件；论文、项目集合的稳定 ID 用作锚点。文章的获准关联显示链接，列表可列出反向关联的文章。首页只组合已批准内容，不复制维护第二份内容。
- [ ] **Step 4: 验证无效引用。** 构建测试包含关联缺失条目及未公开条目，要求失败并定位；删除文章关联后页面入口同步消失。运行 `npm run verify`，预期通过，并检查手机端三类内容的排列。
- [ ] **Step 5: 提交。** 提交 `feat: connect featured work and related articles`。

## Task 6: 重新制作中英文 CV 并提供正确下载入口

**Blocked by:** T01。真实 CV 的成果及项目条目仍需用户选择；这项输入不由开发者代选。

**Files:** 创建 `cv/zh.tex`、`cv/en.tex`、`cv/style.tex`、`cv/manifest.json`、`scripts/build-cv.mjs`、两份最终 PDF、`src/features/profile/cv.ts`、`tests/e2e/cv.spec.ts`、`tests/e2e/cv-missing.spec.ts`、`playwright.cv-missing.config.ts`、`tests/artifacts/cv.test.mjs` 及合成 CV 样例；修改 ContactLinks、package scripts 与产物检查脚本。

**Interfaces:** 消费 T01 的 `assetHref` 及联系入口部件。新增 `src/features/profile/cv.ts`，导出 `getCvLinks(): Partial<Record<Locale, string>>`；从 SITE_PUBLIC_DIR 读取 PDF，从 CV_SOURCE_DIR 读取 manifest，只为实际存在且 PDF 哈希匹配的版本返回部署前缀下的地址。`build-cv.mjs` 从当前工作目录的 `cv` 编译两份源稿，成功后才更新 `public/cv` 和 manifest；manifest 记录源稿及 PDF 的 SHA-256，不记录私人原始资料。产物检查额外比对源稿哈希，防止忘记重编译；编译或更新失败时恢复已有正式文件。

- [ ] **Step 1: 写失败测试。** `both CV links resolve to distinct final PDFs` 断言两种界面均可见两个版本，下载响应是 PDF；`missing final CV hides only that entry` 另起独立 Playwright 配置，SITE_PUBLIC_DIR 和 CV_SOURCE_DIR 指向对应缺文件样例，端口使用 4322，不修改正在使用的测试或真实资源。产物测试在临时目录验证源稿变化而未重编译时拒绝旧 manifest，并以临时工作目录中的无效 TeX 输入验证已有 PDF 哈希不变。

```ts
await page.goto('/en/');
const zh = page.getByRole('link', { name: '中文 CV', exact: true }).first();
const en = page.getByRole('link', { name: 'English CV', exact: true }).first();
await expect(zh).toHaveAttribute('href', '/cv/zh.pdf');
await expect(en).toHaveAttribute('href', '/cv/en.pdf');
expect((await request.get('/cv/zh.pdf')).headers()['content-type']).toContain('application/pdf');
```

- [ ] **Step 2: 运行红灯检查。** `npm run test:e2e -- tests/e2e/cv.spec.ts`，预期正式文件和入口缺失导致失败。测试用 PDF 必须是明确标注的非公开样例，不能把简历参考副本改名凑通过。
- [ ] **Step 3: 制作真实排版和生成流程。** 两种 CV 共用白底、单栏样式，各以两页为目标，使用已核实存在的 XeLaTeX、latexmk、CTEX/Fandol。执行器用 Node `spawnSync` 的参数数组调用 `latexmk -xelatex -halt-on-error -interaction=nonstopmode`，输出到临时生成目录；两份都成功后才替换公开文件并更新 manifest。原始参考版和旧证件照不复制到正式 CV，首版只收录已有公开链接的成果。
- [ ] **Step 4: 验证实际文件。** `npm run build:cv` 预期两份 PDF 成功；用 `pdftotext` 核对中英文事实、状态和特殊字符，用 `pdftoppm` 逐页渲染目视检查分页与长链接。测试样例覆盖中文、`%`、`_` 及长 URL。随后运行 `npm run verify`，预期下载及 manifest 检查通过。照片是否进入 CV 不自行增加，本版按纯文字学术简历排版。
- [ ] **Step 5: 提交。** 提交 `feat: publish rebuilt Chinese and English CVs`，仅包含已批准的源稿、正式输出、生成工具与验证。真实内容未确认时保留任务未完成状态。

## Task 7: 检查通过后才允许自动更新站点

**Blocked by:** T05、T06。外部条件为用户确认真实内容、正式站点地址和部署操作范围；当前 Git remote 不替代这些输入。

**Files:** 创建 `.github/workflows/verify.yml`、`.github/workflows/deploy.yml`、`playwright.release.config.ts`、`tests/e2e/release.spec.ts`、`tests/artifacts/release.test.mjs`、`README.md`；扩展 package scripts、产物检查脚本和 Git 忽略规则中实际产生的输出项。工作流只在用户最终选择 GitHub Pages 时启用；其他托管目标需要改写此任务的部署部分。

**Interfaces:** 消费 T01–T06 的全部命令与产物。`check-artifacts.mjs --release` 要求显式 SITE_URL/SITE_BASE_PATH、正确的两份最终 CV、非测试内容输入及获准内容清单。先检查并报告禁止文件，再检查正式发布参数和 CV；错误输出包含所有发现的违规类别，任一违规导致非零退出。测试命令只写各自 `.test-dist` 目录或临时目录，上传任务只取 `dist`。

- [ ] **Step 1: 写失败测试。** 用虚构私密标记、参考稿文件名、测试输入记录、陈旧 CV manifest 和缺少部署参数分别构造临时产物，执行 release 检查必须非零退出并指出原因。用完整两语言页面、文章、图片与 CV 执行子目录路由测试。

```js
const fixtureDir = mkdtempSync(join(tmpdir(), 'site-release-'));
mkdirSync(join(fixtureDir, 'raw'));
writeFileSync(join(fixtureDir, 'raw', 'private.txt'), 'do-not-publish');
const result = spawnSync(process.execPath,
  ['scripts/check-artifacts.mjs', '--release'],
  { env: { ...process.env, SITE_OUTPUT_DIR: fixtureDir,
    SITE_URL: 'https://example.invalid', SITE_BASE_PATH: '/' }, encoding: 'utf8' });
assert.notEqual(result.status, 0);
assert.match(result.stderr, /unapproved artifact/);
```

- [ ] **Step 2: 运行红灯检查。** `npm run test:artifacts --`，预期尚未实现的 release 规则无法拒绝样例，测试失败；不是因缺少临时文件目录而失败。
- [ ] **Step 3: 实现最终检查和维护入口。** 建立 `verify:release`，在 README 写明内容字段、用户选定条目的操作、CV 重新生成、Node/TeX 版本和实际检查命令。浏览器检查直接点击联系链接目标、404、两种 CV、移动端阅读和无存储语言切换；外部链接单独核验并记录受限情况，不伪报可用。
- [ ] **Step 4: 配置受控发布。** 若选择 GitHub Pages，按执行当天官方文档核验 Actions 版本与权限；验证任务使用 Node 24，并安装锁定的 npm 依赖、Playwright Chromium 及 T06 所需的 XeLaTeX、latexmk、CTEX/Fandol 和 Poppler。用工具版本与字体查询确认可用，缺失时失败而不是跳过 PDF 检查。运行 verify:release，成功后上传且仅上传 dist。部署任务以验证成功为前提，采用 `contents: read`、`pages: write` 和 `id-token: write` 所需最小权限，使用 github-pages 环境。初次启用先保留人工触发；用户授权自动发布并核对目标后，再打开对发布分支提交的触发。
- [ ] **Step 5: 验证完整交付。** `npm ci`、`npm run verify:release` 全部成功。`npm run test:subpath` 独立构建前缀为 `/preview/` 的站点，覆盖全部栏目、文章、图片和 CV 的实际链接；故意加入一个无效内容样例时，验证失败且部署任务不会运行。获得部署授权后，以一项批准的微小内容更新验证从提交到线上更新的完整过程。未验证线上状态时只报告发布准备完成。
- [ ] **Step 6: 提交。** 提交 `ci: verify and deploy approved site artifacts`，保留执行记录、页面截图和 PDF 检查结果；不以配置文件存在代替实际部署证明。

## 覆盖与交接

| 规范验收 | 负责任务 |
| --- | --- |
| B01、B02 语言偏好与页面位置 | T01 定义规则；T02–T04 在各列表和文章验证；T07 复查子目录 |
| B03 单语文章与译文 | T04 |
| B04 已批准条目与首页精选 | T02、T03、T05 |
| B05 正式中英文 CV | T06 |
| B06 链接、缺失内容与 404 | T01–T06 各自负责入口；T07 整体验证 |
| B07 Markdown 更新 | T02–T04；T07 验证发布更新 |
| B08、B09 阅读、手机、键盘与动态效果 | T01 共享布局；T04 长文；T05 组合；T07 最终复查 |
| B10 内容校验与失败不发布 | T01–T05 内容边界；T06 编译原子替换；T07 发布依赖 |

已完成计划自查：核对七项任务的前置关系、schema 与函数接口、B01–B10 覆盖、五项 Review Focus 的负责测试、测试输出隔离及本地文档链接。自查修正了初期导航指向未实现页面、缺 CV 测试共享真实资源、子目录测试与默认路径冲突，以及 CI 缺少 TeX 工具导致检查无法运行的风险。本计划尚未作为实现执行。

任务草案见[任务拆分](2026-10-08-personal-site-ticket-breakdown.md)。正式发布任务前由用户确认颗粒度、阻塞关系和是否拆并，再配置 Issue tracker。

建议执行方式为主代理依次实现，结束后由独立代理审阅整组改动；原因是共享内容注册、首页和发布接口很集中，顺序执行可以减少合并冲突。用户也可以选择逐任务由独立实现者与审阅者执行。两种方式都在计划审阅后开始。

## 技术依据

以下为 2026-10-08 核对的官方资料，执行时仍需核对兼容性并保存实际锁文件：

- [Astro 发行元数据](https://registry.npmjs.org/astro/latest)：核对到 7.3.7，Node 最低 22.12.0、npm 最低 9.6.5。
- [Astro 内容集合](https://docs.astro.build/en/guides/content-collections/)：glob、schema、CollectionEntry、getCollection、render 和唯一 ID。
- [Astro 配置参考](https://docs.astro.build/en/reference/configuration-reference/)：多语言、部署前缀、unified 处理器与内置 Shiki。
- [数学插件官方仓库](https://github.com/remarkjs/remark-math)：remark-math 与 rehype-katex。
- [Astro 图片](https://docs.astro.build/en/guides/images/)：源图片优化及 public 原样复制的区别。
- [Astro GitHub Pages 部署](https://docs.astro.build/en/guides/deploy/github/)与[GitHub 自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)：正式地址、工作流权限与上传产物。
- [Playwright webServer](https://playwright.dev/docs/test-webserver)：测试独立构建站点，显式设置 baseURL 并禁止误连旧服务。

本地只读核对发现 Node 25.8.0、npm 11.16.0、XeLaTeX/TeX Live 2024、latexmk 4.83 和 Poppler 可用，CTEX 与 Fandol 字体存在。尚未运行项目依赖安装或 CV 编译。
