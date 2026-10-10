# 本科毕业论文公开副本构建记录

- 来源：GitHub `spaceboy202105/my_graduation_thesis`，master 提交 `d125a3ade6be3a1ae9eec31b57a5e7e1cbdc1e02`。
- 标题：基于分块的软光栅流水线系统的设计与实现。
- 英文标题：The Design and Implementation of a Tile-Based Software Rasterization Pipeline System。
- 作者：吴靖宇（Wu Jingyu）；合肥工业大学计算机与信息学院，信息安全专业；指导教师李萌副研究员。
- 年份：2024。公开副本封面固定为 2024 年 5 月，依据源配置的答辩日期；原完成日期自动使用编译当天，不适合重建历史论文。
- 通过 GitHub blob API 下载 115 个构建所需文件，全部与固定提交的 Git blob SHA 一致；原始文件保存在 source/，公开副本改动隔离在 build/。
- 构建命令：在 build/ 中执行 `latexmk -xelatex main.tex`；XeLaTeX / TeX Live 2024，macOS 字体。

## 公开副本改动

1. 清空学生学号并移除封面及内封页学号字段。
2. 去除未签署的行政签名页及声明页，保留论文正文、摘要、图表、参考文献、致谢。
3. 固定完成日期为 2024-05。
4. 删除重复 bibliography style `unsrtnat`，保留原 HFUT numerical 样式。
5. 修复 BibTeX 中 NVIDIA Ada URL 后缺失逗号；为 loop2009 显式设置空 booktitle，避免原样式因缺失字段崩溃。未补造来源、年份或出版信息。
6. 将“场景参数”表缩放到正文宽度，消除原 31.59pt 横向溢出；不改表内数据。

## 已知来源局限

原参考文献有部分缺少年份/作者及会议名称信息，BibTeX 仍给出这些元数据警告；不代表引用未解析。保留这些原文内容，未进行文献事实核验或学术修订。模板的空浮动体位置参数和未启用 pdfTeX 的 transparent 包仍有非阻断警告。

## 验证结果

- 最终文件：undergraduate-thesis.pdf，81 页 A4，38,433,414 字节。
- SHA-256：`e467b3d9d772ce0a887cd8f5c0ce93577c91c7f431c02f7181019a8ef5d65b85`。
- latexmk 成功退出；无缺字、未解析交叉引用或文献引用，无横向溢出警告。
- pdftotext 全文检查：学生学号不存在，无 Unicode 替换字符；2024 年 5 月日期正确。
- 已实际渲染并目视检查第 1、3、5、7、8、32、62、65、76、78、81 页；封面、中英文内封与摘要、公式、图像、表 5.4、结论、参考文献和致谢均可读。
- 保留双面排版的空白页 2、4、6；不是缺页。
- 此为从源文件重新编译的公开副本，未经与原提交 PDF 对照；未发现原仓库包含最终提交 PDF。未逐页审阅全部 81 页或核验科学结论。

## Research 代表图

2026-10-10 按用户要求将毕业论文移入首页 Research 及学术成果完整列表，保留 `#thesis` 锚点，标明 Undergraduate thesis。代表图 `src/assets/thesis-cover.png` 来自上述固定源提交的 `cudaraster_structure.png`，展示 CUDARaster 流水线结构；未改动公开 PDF。
