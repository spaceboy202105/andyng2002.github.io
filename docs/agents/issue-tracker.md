# Issue tracker: GitHub

本项目的规范和开发任务记录在 GitHub Issues。目标仓库固定为 `spaceboy202105/andyng2002.github.io`，使用 `gh` CLI 操作；命令显式指定该仓库，避免在其他工作目录中写错目标。

## 操作约定

- 创建：将完整正文写入临时 UTF-8 文件，再运行 `gh issue create --repo spaceboy202105/andyng2002.github.io --title "<标题>" --body-file "<正文文件>"`。
- 阅读：运行 `gh issue view <编号> --repo spaceboy202105/andyng2002.github.io --comments`，同时读取正文、标签与讨论。
- 列表：使用 `gh issue list --repo spaceboy202105/andyng2002.github.io`，按需要加入状态和标签过滤。
- 评论：使用 `gh issue comment <编号> --repo spaceboy202105/andyng2002.github.io --body-file "<正文文件>"`，保留实际换行。
- 标签：使用 `gh issue edit <编号> --repo spaceboy202105/andyng2002.github.io --add-label "<标签>"` 或 `--remove-label`；标签含义见 [triage-labels.md](triage-labels.md)。
- 关闭：任务达到验收条件并留下验证结果后，使用 `gh issue close <编号> --repo spaceboy202105/andyng2002.github.io`。对包含实现要求的任务，仅完成文档时保持打开；文档任务在其验收条件全部满足后可关闭。
- 每项任务单独建立 Issue，正文写明产出、验收条件和阻塞任务，不把多个任务塞进一个长 Issue。
- 阻塞关系优先使用 GitHub 原生 issue dependencies；不可用时在正文用 `Blocked by: #编号` 列明。只有全部前置任务完成后，才能开始该任务。
- `ready-for-agent` 表示任务描述充分，不表示前置任务已经完成，也不表示允许上线。
- 发布任务不自动关闭或修改其父 Issue。

## 技能指令的含义

- “publish to the issue tracker”：向上述仓库创建 GitHub Issue。
- “fetch the relevant ticket”：读取对应 Issue 的完整正文、标签和评论。
- 本地开发规范及实施计划保留在仓库文档中；Issue 用于分配、讨论和追踪执行。变更要求时同步相关文档，避免两处相互矛盾。

## Pull requests as a triage surface

**PRs as a request surface: no.**
