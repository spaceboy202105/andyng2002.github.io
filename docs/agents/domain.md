# Domain docs

本项目采用 single-context，即一份项目术语表和一个设计决定记录目录。

## 阅读规则

- 开始探索或讨论项目概念前，读取根目录的 `GLOSSARY.md`。
- 触及已有重要设计决定时，读取 `docs/adr/` 中相关的 ADR。ADR 是说明某项设计决定及其原因的记录。
- 查开发要求时读取 [开发规范](../superpowers/specs/2026-10-08-personal-site-development.md)；查实施步骤时读取 [实施计划](../superpowers/plans/2026-10-08-personal-site-implementation.md)。
- 某份术语表或 ADR 尚不存在时，直接继续工作，不创建空文件或把缺失视为错误；在术语或重要决定形成后再记录。

## 布局

- 术语表：根目录 `GLOSSARY.md`。
- 设计决定：`docs/adr/`，按编号与主题命名，按需创建。
- 当前没有多模块领域布局，不创建 `GLOSSARY-MAP.md`。

## 使用规则

- Issue 标题、开发说明和测试名称使用术语表定义的称呼，如学术成果、个人项目、Blog 文章、译文、代表作品和 CV。
- 术语表只记录词义，不写入实现计划或配置细节。
- 与已有 ADR 冲突时，明确指出冲突并说明理由，不能静默覆盖原决定。
