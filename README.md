# 每日工作日报

每日工作日报归档仓库（private）。**一天一份 Markdown 文件**，文件名 `YYYYMMDD.md`，按时间顺序线性提交到 `main`。

- 远端：<https://github.com/AVA022hallo/daily-reports>
- 长期分支：`main`（唯一）
- 提交信息：Conventional Commits

## 目录结构

```text
daily-reports/
├── README.md                              # 本文件：仓库约定
├── .gitignore                             # 忽略系统 / 编辑器临时文件
├── .gitattributes                         # 统一换行符为 LF
├── .github/ISSUE_TEMPLATE/daily-report.md # 需要以 Issue 形式写日报时使用
└── YYYYMMDD.md                            # 每日日报正文，如 20261104.md
```

## 每日工作流

1. **新建当日日报**：复制下方模板，保存为 `YYYYMMDD.md`（如 `20261105.md`）。
2. **提交并推送**：

   ```bash
   git add 20261105.md
   git commit -m "docs(daily): 添加 2026-11-05 日报"
   git push
   ```

3. **推送前先同步**（多台机器编辑时）：

   ```bash
   git pull --rebase
   ```

## 日报模板

```markdown
# YYYY-MM-DD 工作日报

## 📋 今日完成

-

## 🚧 遇到的问题

-

## 📅 明日计划

-
```

## 提交信息规范

采用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `docs` | 日报正文、文档 | `docs(daily): 添加 2026-11-05 日报` |
| `feat` | 模板、脚本等新能力 | `feat(template): 增加"风险与求助"小节` |
| `fix` | 纠错（笔误、格式） | `fix(daily): 修正 20261104 日期笔误` |
| `chore` | 仓库配置、工具链 | `chore: 更新 .gitignore` |

## 分支约定

- **日常写日报**：直接提交 `main`。个人仓库、单文件变更，走 PR 反而是噪音。
- **结构性改动**（改模板、改 README、加工具脚本）：切分支 + PR，保证 `main` 始终可用。

  ```bash
  git switch -c feat/template-risk-section
  # 修改并提交
  git push -u origin feat/template-risk-section
  # 在 GitHub 开 PR → Squash merge → 删除分支
  ```

## 在新机器上开始

```bash
git clone https://github.com/AVA022hallo/daily-reports.git
cd daily-reports
git config user.name "AVA022hallo"
git config user.email "136121040+AVA022hallo@users.noreply.github.com"
```

> 提交身份使用 GitHub 的 noreply 邮箱，真实邮箱不会进入提交历史。

## 说明

- 仓库为 private，仅本人可见。
- 换行符由 `.gitattributes` 统一为 LF，跨系统 clone 不会产生整篇 diff。
- 需要以 Issue 形式记录某天工作时，用 GitHub 的「每日日报」模板新建 Issue `/issues/new?template=daily-report.md`。
