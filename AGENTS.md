# 项目开发说明

## 回复风格

请借鉴 ASD-STE100 的清晰表达原则，用清楚、具体的语言解释。不要为了显得专业而引入新的缩写、抽象标签或圈内黑话。必要术语首次出现时解释。介绍机制时说明输入、操作和输出；介绍结论时区分事实、推断与建议。信息不足时明确指出，不要用空泛描述掩盖缺失。

## 工作入口

- 开发、修改页面或验收之前，阅读[开发规范](docs/superpowers/specs/2026-10-08-personal-site-development.md)和[术语表](GLOSSARY.md)。
- 需要了解用户确认过的设计取舍时，阅读[设计说明](docs/design.md)。新增规则维护在开发规范中，避免在多份文件重复定义。
- 当前使用 Astro 和 TypeScript，完整检查入口为 `npm run verify`。Node 版本和具体命令以 `package.json` 为准，不沿用旧 Git 历史中的模板命令。

## 内容与交付

- 展示项目和首页代表作品由用户选择。`raw/` 仅作本地素材，保持 Git 忽略；构建只使用已批准的公开输入。
- 网站的中英文 CV 必须重新排版。原简历和 `raw/cv-source-sanitized.pdf` 都不是正式公开版本。
- 按开发规范检查实际页面、生成文件和 PDF 后再报告完成，明确区分规范、实现、测试和线上发布状态。
- 规范与任务使用 GitHub Issues，操作前读取 `docs/agents/issue-tracker.md`。

## Agent skills

### Issue tracker

规范与开发任务记录在 `spaceboy202105/andyng2002.github.io` 的 GitHub Issues。操作前阅读 [issue-tracker.md](docs/agents/issue-tracker.md)。

### Triage labels

使用默认五个分类标签。分类或更新任务时阅读 [triage-labels.md](docs/agents/triage-labels.md)。

### Domain docs

使用根目录术语表及按需建立的设计决定记录，采用 single-context 布局。开始探索相关内容前阅读 [domain.md](docs/agents/domain.md)。
