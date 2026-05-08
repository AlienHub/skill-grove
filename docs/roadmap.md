# Skill Grove Roadmap

> 当前目标：完成 v0.5「品牌与精致度」的第一版实现，将产品名收敛为 Skill Grove，并继续打磨个人本地 skills 资料库的安静质感。
>
> 产品方向：不做企业控制台，不做 marketplace，不做复杂账号系统。先服务个人开发者整理自己的 AI 能力库，并逐步帮助用户理解这些 skill 如何进入对话上下文、如何被真实调用。

---

## 0. 计划 TODO

### v0.2：产品调性成型

- [x] 将主页面语义从「所有技能」调整为「技能库 / Library」
- [x] 详情页改成 **Variant-first** 信息结构
- [x] 来源区域从「按 Source 展示」调整为「按内容版本 Variant 展示」
- [x] 来源 dropdown / popover 改为按 Variant 分组
- [x] 对 20+ 来源场景做聚合展示：默认只展示版本摘要，不平铺所有来源
- [x] 在 skill 详情页添加统一操作入口：打开目录、用 IDE/编辑器打开、放入废纸篓 / 删除软链
- [x] 增加安全删除能力：只允许删除单个 Source，并优先移动到系统废纸篓
- [x] 对 symlink 删除做单独文案：只删除软链，不删除目标目录
- [x] 弱化重复的「真实文件」标签，只在软链接、异常、缺失等非默认状态时突出显示
- [x] 调整文案：减少“管理 / 警告 / 错误”，增加“来源 / 内容版本 / 保持一致”

### v0.2.0a：Variant-first reading

- [x] 左侧「所有技能」改为「技能库」
- [x] 详情页顶部突出「N 个内容版本 · M 个来源」
- [x] 来源模块按 Variant 摘要展示
- [x] 来源 dropdown / popover 按 Variant 分组
- [x] 弱化「真实文件」，只突出软链接/异常

### v0.2.0b：Source actions

- [x] 增加 Source 操作菜单：打开目录、用编辑器打开
- [x] 增加「放入废纸篓 / 删除软链」确认弹窗
- [x] 后端实现 move-to-trash
- [x] symlink 只移除链接路径，不删除目标目录
- [x] 删除后自动重新扫描并刷新详情

### v0.2.1：Dark Mode & English

- [x] 增加黑暗模式基础：整理颜色 token，让页面、卡片、边框、弹层、菜单、代码块都从 CSS variables 派生
- [x] 支持系统外观跟随与手动切换：浅色、深色、跟随系统，并持久化保存用户选择
- [ ] 补齐黑暗模式下的关键状态：选中、hover、accent、危险操作、modal overlay、scrollbar、Markdown preview
- [x] 增加英文支持基础：抽离主要 UI 文案到 i18n dictionary，先支持 `zh-CN` 与 `en-US`
- [x] 支持语言切换：中文、English、跟随系统 / 默认语言，并持久化保存用户选择
- [x] 覆盖关键页面文案：技能库侧栏、详情页、来源切换、来源操作、设置、更新、空状态、错误提示
- [ ] 做双语与双主题验收：至少检查 4 组组合（中文浅色、中文深色、英文浅色、英文深色）

### v0.2.2：v0.3 设计规划

- [x] 明确 v0.3 的产品目标：给用户一个回访理由，但不把首页做成 Dashboard
- [x] 将 Since Last Visit 定义为本地快照 diff，而不是会话监控或云同步
- [x] 规划轻量 Home / Status 的信息密度和文案
- [x] 规划轻量筛选：全部、多来源、有变体、最近变更、值得看看，并默认隐藏在筛选菜单中
- [x] 规划 Worth a Look / Suggestions 的第一批规则和非告警式文案
- [x] 拆出 v0.3.0 / v0.3.1 / v0.3.2 的实现切片

### v0.3：回访理由与轻量整理

- [x] v0.3.0：增加 Since Last Visit 本地快照
- [x] v0.3.0：展示上次打开后的变化：新增 skill、移除 skill、内容修改、来源变化、变体变化
- [x] v0.3.0：增加轻量 Home 页面承载 Welcome / Status / 最近变化，而不是 Dashboard
- [x] v0.3.1：增加轻量筛选：全部、多来源、有变体、最近变更、值得看看，并默认收进搜索旁的筛选菜单
- [x] v0.3.1：将最近变化和建议接入左侧列表排序 / filter state
- [x] v0.3.2：增加 Worth a Look / Suggestions 机制
- [ ] v0.3.2：增加 broken symlink、内容不一致、描述缺失、SKILL.md 过长等轻量提示
  - [x] 内容不一致
  - [x] 描述缺失
  - [x] SKILL.md 过长
  - [ ] broken symlink（需要扫描器记录无法解析的软链接）

### v0.4：阅读与整理体验打磨

- [x] 为长 Markdown 详情页增加 sticky mini header
- [x] 优化 Markdown preview 的标题、列表、代码块、frontmatter 展示
- [x] 增加 Open in Editor / Open in IDE 配置
- [x] 简化来源操作菜单，只保留打开、编辑器 / IDE 打开和移除此来源
- [x] 增加 Pinned Skills / 收藏
- [x] 增加 Recently Viewed / Recently Changed
- [x] 将 Home 收敛为轻量起始卡片，避免数据很少时呈现粗糙 Dashboard
- [x] 统一后续 loading 状态使用 Ripple 动画
- [ ] 对多 Variant skill 增加基础 Diff 入口（暂缓，当前阶段先保留来源切换）

### v0.5：品牌与精致度

- [x] 决定产品命名：Skill Grove
- [x] 更新 README 首屏文案
- [x] 更新 app 产品名、窗口标题和版本号到 v0.5.0
- [x] 更新内部包名、crate 名、bundle identifier、GitHub Release 地址和本地存储 key
- [ ] 更新截图、GIF
- [ ] 更新 app icon、空状态、onboarding
- [ ] 打磨 macOS 原生感：titlebar、scroll、hover、selected state、keyboard shortcuts
- [ ] 增加 Command Menu 或 Quick Switcher
- [ ] 准备第一个面向个人用户的 polished release

### v0.6：Agent Context Catalog

- [ ] v0.6.0：增加 Agent 视角的预计常驻 catalog token 统计
- [ ] 只统计 `name`、`description`、`when_to_use`、`location` / 简短引用元信息，不统计完整 `SKILL.md`
- [ ] 按 Agent 展示预计常驻 skill 数量、预计常驻 tokens、已确认 / 未确认 / 关闭自动调用拆分
- [ ] 识别 `disable-model-invocation` 与等价字段，展示哪些 skill 不进入模型自动发现 catalog
- [ ] 增加 provider capability matrix，标注每个 Agent 对自动发现、禁用模型调用、用户手动调用等字段的支持程度
- [ ] 展示 Top catalog cost skill 列表，帮助用户理解哪些 skill 的常驻描述最重
- [ ] 在 skill 详情页展示该 skill 在各 Agent 下的 catalog 状态和预计常驻 token
- [ ] v0.6.1：细化 provider 支持矩阵、路径条件、字段兼容和可信度提示
- [ ] v0.6.2：再考虑本地会话数据里的 Skill Usage Rollup
- [ ] 第一版只读分析，不自动修改 skill frontmatter

---

## 1. 产品定位

### 1.1 当前定位

Skill Grove 当前不是企业级 skill 管理平台，也不是 skill marketplace。更适合的定位是：

> 一个精致的本地 Agent Skills 资料库。

英文表达可以是：

> A beautiful local library for your Agent Skills.

更完整一点：

> Browse, inspect, compare, and keep your Agent Skills organized across Claude, Codex, Cursor, Gemini, and more.

中文表达：

> 整理、查看、比较你散落在 Claude、Codex、Cursor、Gemini 等工具里的 Agent Skills。

### 1.2 产品气质

三个关键词：

- **Beautiful**：不像 vibe coding demo，而是认真打磨过的个人 app
- **Local**：本地优先，无账号，不上传，不复杂
- **Calm**：安静、克制、可控，不做 noisy dashboard

### 1.3 不做什么

短期明确不做：

- 企业团队管理
- 审批流
- 账号系统
- 云同步
- Marketplace
- 公共 skill registry
- 批量 destructive 操作
- 复杂安全扫描平台
- SaaS 风格 Dashboard

---

## 2. 核心产品模型

当前最关键的产品抽象应该从：

```text
Skill
  -> Source
```

升级为：

```text
Skill
  -> Variant
    -> Source
```

### 2.1 Skill

Skill 是用户看到的主对象，比如：

```text
dws
ui-ux-pro-max
find-skills
release-skills
```

它代表一个聚合后的能力，而不是某个具体路径里的文件。

### 2.2 Variant

Variant 是内容版本。v0.2 阶段先以 `SKILL.md` 文件内容 hash 作为内容版本边界。

同名 skill 可能存在多个来源，但内容完全一致。此时它们应该属于同一个 Variant。

例如：

```text
dws
2 个内容版本 · 6 个来源

Variant A
- Agents
- Claude
- Codex
- Cursor
- Hermes

Variant B
- EagleClaw
```

用户真正关心的是：

```text
这个 skill 有几个内容版本？
这些版本分别分布在哪些 agent 里？
当前看到的是哪一版？
是否有内容不一致，值得看一眼？
```

### 2.3 Source

Source 是具体来源路径，例如：

```text
Claude  /Users/alien/.claude/skills/dws
Codex   /Users/alien/.codex/skills/dws
Cursor  /Users/alien/.cursor/skills/dws
```

Source 用于执行具体动作：

- 打开目录
- 用 IDE 打开
- 复制路径
- 移除此来源
- 查看软链接状态
- 查看文件存在性

---

## 3. 信息架构

### 3.1 主导航

建议主导航保持极简：

```text
Library
Sources
Preferences
```

中文：

```text
技能库
来源
偏好设置
```

其中当前的「设置 / 扫描目录」更像 Sources，而不是普通 Settings。

### 3.2 Library 页面

左侧列表建议从「所有技能」调整为：

```text
技能库                         243
81 个存在多个来源

搜索名称、描述或路径  [筛选]
```

不要做大 Dashboard，不要做统计卡片墙。

Home 页面可以承载轻量 welcome/status 和最近变化：

```text
上次打开后，有 2 个技能发生变化。

最近变化
- 新增 skill
- 内容修改

值得看看
- 有多个内容版本
```

或者：

```text
你的技能库看起来很干净。
```

### 3.3 Skill 详情页

详情页推荐结构：

```text
Skill title
Description
Variant / Source summary

Sources
Overview
Content
```

示例：

```text
dws
管理钉钉产品能力...
2 个内容版本 · 6 个来源

来源
版本 A · 5 个来源 · 当前
Agents · Claude · Codex · Cursor · Hermes

版本 B · 1 个来源
EagleClaw

[查看来源]

概览
名称        dws
描述        管理钉钉产品能力...
CLI 版本    >=1.0.15

说明
Markdown Preview
```

---

## 4. 来源与变体设计

### 4.1 为什么不能横向展示所有来源

有些 skill 会出现 20+ 来源。如果直接横向展示 source chip，会导致界面拥挤、难读、失控。

所以正确策略是：

> 横向展示内容版本摘要，不横向展示所有来源。

完整来源列表仍然通过 dropdown / popover / drawer 展示。

### 4.2 来源模块推荐状态

#### 单版本，多来源

```text
来源
24 个来源 · 内容一致
这个 skill 在多个 Agent 中保持同步。

当前来源：Claude
[查看来源]
```

#### 多版本，多来源

```text
来源
3 个内容版本 · 24 个来源
有几个来源的内容不一致，值得看一眼。

版本 A · 18 个来源 · 当前
版本 B · 5 个来源
版本 C · 1 个来源

[查看来源]
```

### 4.3 Dropdown / Popover 分组

来源 dropdown 不再平铺，而是按 Variant 分组：

```text
搜索 Agent 或路径

版本 A · 18 个来源 · 当前内容
  Agents        当前
  Claude
  Codex
  Cursor
  Hermes
  显示全部 18 个

版本 B · 5 个来源
  EagleClaw
  OpenClaw

版本 C · 1 个来源
  Custom
```

这样即使来源很多，用户也先理解版本分布，再进入具体路径。

### 4.4 展示规则

建议规则：

```text
1-5 个来源：可以展示 source chips
6-12 个来源：展示前几个 + “+N”
12+ 个来源：只展示 Variant 摘要，来源列表放入 popover
```

更重要的是：

```text
来源数量越多，越要抽象。
内容版本数量越多，越要提示用户值得看一眼。
```

---

## 5. 删除设计

### 5.1 是否要做删除

要做，但不要做成粗暴的「删除 Skill」。

正确语义是：

> 移除此来源 / Move this source to Trash

因为当前产品模型是：

```text
Skill
  -> Variant
    -> Source
```

所以直接说「删除 skill」会有歧义：

- 是删除当前来源？
- 是删除当前 Variant 的所有来源？
- 是删除所有 agent 里的同名 skill？
- 是隐藏扫描结果？
- 是删除软链接，还是删除软链接指向的真实目录？

### 5.2 v0.2 删除范围

第一版只做最安全的删除：

- 只删除当前选中的 Source
- 只移动到系统废纸篓
- 不做永久删除
- 不做批量删除
- 不做删除整个 Skill group
- 不做删除整个 Variant
- 删除后自动重新扫描

### 5.3 操作入口

不要在左侧聚合 skill 列表上直接放删除。

推荐放在详情页当前 Source 操作菜单里：

```text
[打开目录] [...]

更多菜单：
- 用编辑器打开
- 在文件管理器中显示
- 复制路径
- 移除此来源...
```

也可以放在来源 popover 的每一行：

```text
Claude
/Users/alien/.claude/skills/dws
[打开] [...]

更多：
- 用编辑器打开
- 复制路径
- 移除此来源...
```

### 5.4 普通真实目录确认文案

```text
将这个来源移到废纸篓？

dws
Claude
/Users/alien/.claude/skills/dws

只会移除 Claude 中的这个来源。
其他 5 个来源不会受影响。
```

按钮：

```text
取消
移到废纸篓
```

### 5.5 Symlink 确认文案

```text
移除这个软链接？

这只会移除 Cursor 中的软链接：
/Users/alien/.cursor/skills/dws

不会删除它指向的真实目录：
/Users/alien/.agents/skills/dws
```

按钮：

```text
取消
移除软链接
```

### 5.6 被其他软链接引用时

如果当前真实目录被其他 source 的 symlink 指向，删除时需要提醒：

```text
这个目录被 3 个来源引用。

删除后，这些来源可能会失效：
- Cursor
- Codex
- Hermes
```

第一版可以选择保守策略：

```text
这个来源被其他软链接引用，请先移除相关软链接。
```

这样可以避免误删和复杂恢复逻辑。

---

## 6. 打开方式设计

Skill 详情页已经加入通过文件管理器 / IDE / 编辑器打开的能力，这个是很关键的整理闭环。

推荐统一为：

```text
Open Folder
Open in Editor
Remove This Source
```

中文：

```text
打开目录
用编辑器打开
移除此来源
```

建议主按钮只放一个：

```text
打开目录
```

其他动作放进更多菜单：

```text
...
```

保持界面干净。

---

## 7. Since Last Visit

### 7.1 目标

增加回访理由，但不做 Dashboard。

用户打开 app 时看到的是轻量状态，而不是数据面板。

示例：

```text
上次打开后，有 2 个技能发生变化。
```

或者：

```text
新增 3 个技能，1 个来源发生变化。
```

### 7.2 需要记录的快照字段

本地保存 scan snapshot：

```json
{
  "lastScanAt": "2026-xx-xxTxx:xx:xxZ",
  "skills": [
    {
      "name": "ui-review",
      "description": "...",
      "variants": [
        {
          "hash": "...",
          "sources": [
            {
              "agent": "Claude",
              "path": "/Users/alien/.claude/skills/ui-review",
              "isSymlink": false,
              "targetPath": null
            }
          ]
        }
      ]
    }
  ]
}
```

### 7.3 变化类型

第一版可以检测：

- 新增 skill
- 移除 skill
- 新增 source
- 移除 source
- 内容 hash 变化
- Variant 数量变化
- symlink 状态变化

展示文案：

```text
Since last visit
+ 2 个新技能
~ 1 个技能内容发生变化
- 1 个来源被移除
```

中文 UI 可以不出现英文标题，改成：

```text
上次打开后
```

### 7.4 v0.3 设计主线

v0.3 的核心不是「统计更多」，而是回答用户回到 app 时的两个问题：

```text
有什么变了吗？
有什么值得我顺手整理一下吗？
```

这两个问题都应该保持轻量：

- 先展示一句状态，而不是打开一个 Dashboard
- 先给筛选入口，而不是给复杂任务流
- 先解释变化和建议，不自动修改内容
- 所有判断只基于本地扫描结果和本地快照

### 7.5 Home / Status

增加一个轻量 Home 页面承载回访理由。它不是 Dashboard，而是打开 app 后的安静入口：展示欢迎状态、最近变化、值得看看，并允许用户点进具体 skill。

有变化时：

```text
上次打开后，3 个技能发生变化。

最近变化
- dws 内容发生变化
- ui-review 新增了一个来源
```

没有变化时：

```text
你的技能库看起来很干净。
```

有建议但没有最近变化时：

```text
有 4 个技能值得看看。

值得看看
- dws 有 2 个内容版本
- deploy-helper 缺少描述
```

Home 最多承载：

- 一句摘要
- 最近变化列表
- 值得看看列表
- 弱化的更新时间 / 扫描状态

不承载：

- 多张统计卡
- 趋势图
- 告警计数墙
- 批量修复入口

### 7.6 快照与 Diff 口径

v0.3.0 保存最近一次稳定 scan snapshot，用当前 scan result 与上一份 snapshot 做 diff。

建议快照最小字段：

- skill name
- description fingerprint
- variant hash 列表
- source path 列表
- source agent / label
- symlink 状态与 target path
- `SKILL.md` mtime / size / content hash
- snapshot schema version

Diff 输出不直接绑定 UI，先形成中间结果：

```ts
type LibraryChange =
  | { type: "skill-added"; skillName: string }
  | { type: "skill-removed"; skillName: string }
  | { type: "content-changed"; skillName: string; previousHash: string; currentHash: string }
  | { type: "source-added"; skillName: string; sourcePath: string }
  | { type: "source-removed"; skillName: string; sourcePath: string }
  | { type: "variant-count-changed"; skillName: string; previousCount: number; currentCount: number }
  | { type: "symlink-state-changed"; skillName: string; sourcePath: string };
```

UI 可以从这些变化聚合出：

```text
新增 3 个技能 · 1 个内容修改 · 2 个来源变化
```

### 7.7 v0.3 实现切片

#### v0.3.0：回访理由

只做 Since Last Visit：

- 保存上一份 scan snapshot
- 扫描后计算 changes
- Home 页面展示欢迎状态、最近变化和轻量建议
- 增加「最近变化」筛选
- 详情页可以标注该 skill 最近发生了什么

验收标准：

- 首次打开不显示误导性的「变化」
- 第二次扫描能识别新增、移除、内容变化、来源变化
- 清空或损坏 snapshot 时能安全重建
- 文案保持温和，不出现告警式提示

#### v0.3.1：轻量筛选

补齐 Library filter：

- 全部
- 多来源
- 有变体
- 最近变更
- 值得看看

筛选默认隐藏在搜索框旁边的筛选菜单中，用户可以勾选，也可以再次点击取消回到「全部」。

筛选不改变底层数据，只改变当前列表视图。搜索与筛选组合时，优先保持可预测：

```text
filter -> search -> sort
```

#### v0.3.2：值得看看

增加第一批 suggestions rule：

- 多 Variant
- broken symlink
- description 缺失
- `SKILL.md` 过长
- supporting file 缺失
- source 内容不一致

每条 suggestion 需要包含：

- `skillName`
- `sourcePath`（如适用）
- `severity`：只用于排序，不直接展示成警告等级
- `message`
- `actionLabel`
- `filterReason`

### 7.8 明确不做

v0.3 不做：

- Dashboard 首页
- 趋势统计
- 云同步
- 真实调用统计
- 自动修复
- 批量删除 / 批量合并
- 跨 Agent 自动同步
- 读取历史会话内容

---

## 8. Agent Context Catalog

### 8.1 目标

v0.6.0 先只回答一个问题：

```text
每个 Agent 的 skill catalog 预计常驻多少 token？
```

这里的 catalog 指 Agent Skills 标准中的轻量 skill 列表，而不是完整 `SKILL.md`。常规对话中，Agent 通常先看到 skill 的 `name`、`description`、`when_to_use` 和简短引用信息，再按需激活完整 skill。

v0.6.0 不做真实调用统计，也不统计完整 instructions。它只帮助用户理解：

```text
哪些 skill 描述预计常驻在上下文 catalog 里？
这些常驻描述大约占多少 token？
哪些 skill 已关闭模型自动调用，所以不进入自动发现 catalog？
哪些 Agent 对这些字段的支持还未确认？
```

这不是企业监控台，也不是成本审计系统。它是一个本地反馈面板，让个人开发者知道自己的 skill catalog 是否过重、哪些控制字段被 Agent 支持、哪些规则还需要确认。

### 8.2 v0.6.0 支持范围

只做：

- Agent 视角
- 读取 `SKILL.md` frontmatter
- 统计 `name`、`description`、`when_to_use`、`location` / 简短引用元信息的预计 token
- 识别 `disable-model-invocation` 与 provider 等价字段
- 建立 provider capability matrix
- 展示预计常驻 tokens 总数
- 拆分已确认、未确认、关闭自动调用三类
- 展示 Top catalog cost skill 列表
- 在 skill 详情页展示该 skill 在各 Agent 下的 catalog 状态

不做：

- 完整 `SKILL.md` token
- supporting files token
- 调用后 activation token
- 手动调用统计
- 本地会话日志统计
- 历史趋势
- 成本金额换算
- 自动优化或批量修改 skill frontmatter

第一版只读分析，保持：

```text
Detect -> Explain
```

不进入：

```text
Suggest -> Edit -> Rewrite frontmatter
```

### 8.3 数据模型

建议按 Agent 建立 catalog profile：

```json
{
  "agent": "Claude Code",
  "skills": [
    {
      "name": "document-writer",
      "variantHash": "...",
      "sourcePath": "/Users/alien/.claude/skills/document-writer",
      "catalogDisclosure": "included",
      "modelInvocation": "enabled",
      "userInvocation": "enabled",
      "residentCatalogTokens": 92,
      "includedInEstimate": true,
      "sourceField": "description",
      "filteredReason": null,
      "confidence": "high"
    }
  ],
  "lastCheckedAt": "2026-xx-xxTxx:xx:xxZ"
}
```

`catalogDisclosure` 第一版可以先分成：

- `included`：预计进入该 Agent 的 skill catalog
- `disabled`：头部或等价配置关闭模型自动调用，不进入自动发现 catalog
- `invalid`：缺少必要字段，或 frontmatter 无法解析
- `unknown`：Agent 规则或字段支持未确认，但仍计入预计总量并标低可信
- `unsupported`：该来源不参与 Agent Skills catalog 机制

### 8.4 Token 口径

v0.6.0 只统计预计常驻 catalog token：

```text
常驻 token = name + description + when_to_use + location / 简短引用元信息
```

不统计：

```text
完整 SKILL.md
supporting files
调用后 activation token
手动选择成本
会话里的真实调用成本
```

如果 provider 规则未确认，仍计入预计总量，但必须明确提示：

```text
预计常驻：45 个 · 约 4.0k tokens
已确认：38 个 · 约 3.4k tokens
未确认：7 个 · 约 620 tokens
关闭自动调用：4 个 · 原本约 360 tokens
```

总数文案使用「预计常驻」，不要使用「已确认常驻」。如果包含低可信项目，显示：

```text
约 4.0k tokens · 含 7 个未确认项
```

### 8.5 Provider Capability Matrix

不同 Agent 对自动发现和关闭模型调用的支持不统一。v0.6.0 需要一个 provider capability matrix，而不是只读取字段名。

第一版至少标注：

- 是否支持 Agent Skills catalog
- 是否支持 `description` / `when_to_use` 进入 catalog
- 是否支持 `disable-model-invocation`
- 是否存在等价字段，例如 Codex 的 `policy.allow_implicit_invocation`
- 是否支持 `user-invocable`
- 是否支持 `paths` 或类似路径条件
- 字段支持是否来自官方文档、实际检测、第三方资料或未知推断

示例：

```json
{
  "provider": "claude-code",
  "supportsCatalog": true,
  "supportsWhenToUse": true,
  "supportsDisableModelInvocation": true,
  "implicitInvocationField": "disable-model-invocation",
  "supportLevel": "native",
  "evidence": "official-docs"
}
```

### 8.6 展示方式

v0.6.0 的主视角以 Agent 为主。

```text
Claude Code
预计常驻：45 个 · 约 4.0k tokens
已确认：38 个 · 约 3.4k tokens
未确认：7 个 · 约 620 tokens
关闭自动调用：4 个 · 原本约 360 tokens

Top catalog cost
- ui-ux-pro-max       420 tokens
- dws                 310 tokens
- document-writer      92 tokens
```

Skill 详情页只补一块轻量信息：

```text
常驻上下文
Claude Code    约 92 tokens · 预计进入 catalog
Cursor         约 92 tokens · 字段支持未确认
Codex          关闭自动调用 · 未进入 catalog
```

这里的重点不是做图表墙，而是让用户能回答：

```text
哪个 Agent 的 skill catalog 最重？
哪些 skill 的常驻描述占得最多？
哪些禁用模型自动调用的字段真的被这个 Agent 支持？
哪些统计只是预计，需要用户谨慎理解？
```

### 8.7 后续版本

v0.6.0 之后再扩展：

- v0.6.1：细化 provider 支持矩阵、路径条件、字段兼容和可信度提示
- v0.6.2：分析用户授权的本地会话数据，统计 skill 在各 Agent 的真实调用情况
- v0.6.2 之后再考虑趋势、建议、修改入口和更完整的 usage rollup

### 8.8 数据边界

这类能力必须保持克制：

- 只读取用户授权的本地目录
- 不上传会话内容
- 不做键盘监听或实时行为监控
- v0.6.0 不读取历史会话内容
- 不自动修改 `SKILL.md` 或 provider 配置
- 对未知 provider 明确显示「未确认」，不要假装精确
- 对未知格式明确显示「无法确认」，不要假装精确

---

## 9. Worth a Look / Suggestions

### 9.1 目标

提供轻量整理建议，不制造焦虑。

不使用：

```text
Errors
Warnings
Alerts
Problems
```

使用：

```text
Worth a look
Suggestions
值得看看
建议
```

### 9.2 第一批规则

可以先做非常轻的规则：

- 有多个 Variant
- 某个 source 是 broken symlink
- 同名 skill 内容不一致
- 缺少 description
- description 过于泛化
- SKILL.md 过长
- 引用了不存在的 supporting file
- 包含 shell 脚本或明显危险命令
- 来源路径来自自定义目录，且没有 provenance metadata

### 9.3 文案示例

```text
dws 有 2 个内容版本，值得看一眼。
```

```text
ui-review 在 Claude 和 Codex 中内容不一致。
```

```text
deploy-helper 包含 shell 命令，编辑前建议确认来源。
```

```text
pdf skill 的说明较长，可以考虑拆分 supporting files。
```

---

## 10. UI / UX 调性

### 10.1 首页不是 Dashboard

不要做：

- 统计卡片墙
- 环形图
- 趋势图
- 告警墙
- 复杂运营指标

要做：

- Library 默认页
- 顶部轻量 welcome/status
- 清爽列表
- 明确的当前 skill 详情
- 温和的建议

### 10.2 文案风格

避免：

```text
管理
控制
警告
错误
冲突
危险
```

优先：

```text
整理
来源
内容版本
保持一致
值得看看
最近变化
移除此来源
```

### 10.3 Badge 规则

当前每行都有紫色来源 badge，容易有点噪。建议：

- 单来源不显示 badge，或显示极弱灰色
- 多来源显示弱提示
- 多 Variant 才使用更明显的紫色
- 当前选中项可强化 badge

### 10.4 「真实文件」标签

「真实文件」是默认状态，不需要每行都突出。

建议只突出非默认状态：

- 软链接
- 断开的软链接
- 缺失
- 不可读
- 自定义来源

默认真实文件可以不显示，或者在详情 tooltip 中显示。

---

## 11. 阅读体验

### 11.1 Markdown Preview

当前 Markdown preview 是产品的重要体验之一，应该继续打磨。

建议增强：

- 标题层级
- 列表间距
- code block 样式
- frontmatter 可折叠展示
- supporting files 列表
- 长文阅读宽度控制

### 11.2 Sticky Mini Header

当用户滚动长 SKILL.md 时，右侧顶部应该保留轻量上下文：

```text
ui-ux-pro-max · 5 个来源 · 当前：Claude
```

或者：

```text
ui-ux-pro-max · 2 个内容版本
```

这样用户不会在长文阅读中丢失当前 skill 信息。

---

## 12. 命名方向

v0.5.0 已确定产品名为 Skill Grove。这个名字更接近个人本地 skill garden / library 的方向。

可选方向：

### 12.1 Skill Grove

```text
Skill Grove
A beautiful local library for your Agent Skills.
```

优点：

- 看得出和 skill 有关
- 有个人 skill garden 的感觉
- 比 Studio 更安静

### 12.2 Glade

```text
Glade
A calm local library for your Agent Skills.
```

优点：

- 更像精致独立 app
- 更轻、更安静
- 品牌感强

缺点：

- 单独看不够直观，需要 subtitle 解释

### 12.3 Grove

```text
Grove
A local home for your Agent Skills.
```

优点：

- 品牌感强
- 可以从 Skill Grove 逐步演化而来

缺点：

- 单独看解释成本较高

### 12.4 推荐排序

如果优先可理解性：

```text
Skill Grove > Glade > Grove
```

如果优先品牌感：

```text
Glade > Grove > Skill Grove
```

---

## 13. README 首屏建议

Skill Grove 首屏方向：

```markdown
# Skill Grove

A beautiful local library for your Agent Skills.

Browse, inspect, compare, and keep your skills organized across Claude, Codex, Cursor, Gemini, and more.
```

中文：

```markdown
# Skill Grove

一个安静的本地 Agent Skills 资料库。

整理、查看、比较你散落在 Claude、Codex、Cursor、Gemini 等工具里的 Agent Skills。
```

---

## 14. 开发原则

### 14.1 小步快跑

这是个人项目，不追求一次性做全。

优先顺序：

```text
Detect -> Explain -> Suggest -> Safe Action -> Reversible Action
```

不要一开始做大量自动修改。

### 14.2 所有 destructive 操作必须可恢复

第一阶段所有删除都应该进入系统废纸篓。

需要避免：

```text
rm -rf
批量删除
删除聚合 skill
删除所有来源
```

### 14.3 先做好阅读和理解，再做编辑和同步

用户先要能理解：

```text
这个 skill 是什么？
有哪些版本？
来自哪里？
当前看到哪一版？
```

然后才需要：

```text
编辑
删除
同步
合并
```

---

## 15. 下一步最小执行清单

v0.3.0 已完成第一版回访理由与轻量整理。下一步建议补齐需要扫描器支持的边缘状态：

- [ ] 扫描器记录 broken symlink 和不可读来源，而不是直接跳过
- [ ] 将 broken symlink 接入 Worth a Look
- [ ] 为最近变化补一组 fixture / 单元测试，覆盖新增、移除、内容变化和来源变化
- [ ] 为 suggestions 补一组 fixture / 单元测试，覆盖多变体、描述缺失、长说明、自定义来源
- [ ] 再做一次双语与双主题视觉验收

完成这些后，v0.3.x 会从「知道哪里变了」再进一步变成「知道哪些来源状态需要轻轻看一眼」。

---

## 16. 一句话目标

v0.3 的核心目标：

> 让用户每次回到 Skill Grove 时，都能轻松知道：哪些 skill 变了，哪些值得看看。

长期目标：

> 让个人开发者愿意反复打开它，整理自己的 AI 能力库，并获得一种“干净、安静、可控”的感觉。
