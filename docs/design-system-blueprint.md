# 设计系统蓝图 · `@najafi/design-system`

> 目标：把当前 App（`skill-grove`）里已成熟的视觉语言，提炼成一个**独立、可跨项目复用**的设计系统包，
> 让本 App 和未来的 vibe coding 项目都吃同一套 token + 组件 + AI 契约，从根上消除「改一处就崩、UI 不一致」。
>
> 包名 `@najafi/design-system` 为暂名，可一键替换。

## 一、定位与原则

- **一个独立包，单一事实来源**：各项目 `import` 它，而不是各自复制粘贴（复制必然漂移）。
- **不重造，只提炼**：token 直接复用现有 `src/index.css`（已是高质量设计语言），重点补三块缺口：组件原语、AI 契约、分发机制。
- **AI-first**：每个产物都为「让 codex/claude 每次照着用」服务 —— 稳定的 token 词汇表 + 现成积木 + 明确规则。

## 二、现状诊断（基于真实代码）

✅ **已有且质量高 —— Token 层**（`src/index.css`，1410 行，Tailwind v4 CSS-first）：
- 「6 基色」哲学：`--background --surface --foreground --accent --info --success --destructive`，其余全部派生。
- oklch 色彩空间 + `color-mix` 派生、`--foreground-1.5…95` 透明阶梯、shadow token、shadcn 兼容层。
- 字体（sans/serif/mono）、布局变量、完整 `--z-base…--z-titlebar`（14 级语义层级）、container/shadow 尺寸。
- 组件里几乎不用裸色值（仅 3 处 `text-red-*` 违规），纪律好。

❌ **真正的缺口**：

| 缺口 | 现状 | 后果 |
|---|---|---|
| 组件原语 | 无统一 Button/Card/Input/Badge/Table/Dialog，全靠手写 className | 间距已漂移：`px-3 py-2`×21、`px-4 py-3`×15，还有散落的 `px-2 py-0`/`px-3 py-3` |
| 跨项目分发 | token 锁死在 App 的 `index.css` | 其他项目用不了，只能复制 → 漂移 |
| AI 契约 | 无「该用哪个 token/组件」的规则文档 | codex/claude 每次重新猜 → 不一致 |

## 三、布局决策：低风险 monorepo（App 留根）

不把 App 移到 `apps/`，因为 Tauri（`tauri.conf.json` 的 `frontendDist: ../dist`、`beforeBuildCommand`、`Cargo.toml`）和 63KB 自定义 `vite.config.ts` 含大量硬编码路径，移动风险高、收益为零。

```
skill-grove/                      # 根 = workspace root，同时仍是 App（Tauri 不受影响）
├── package.json                  # 加 "workspaces": ["packages/*"]，依赖 @najafi/design-system
├── src/                          # App 源码，原地不动
├── src-tauri/                    # Tauri，原地不动
├── vite.config.ts                # 原地不动
└── packages/
    └── design-system/
        ├── package.json          # name: @najafi/design-system, exports, peer: react
        ├── src/
        │   ├── tokens/
        │   │   ├── base.css      # :root 6基色 + 派生 + foreground阶梯 + shadow + 字体 + z-index
        │   │   ├── dark.css      # .dark 覆盖
        │   │   └── theme.css     # @theme inline（暴露 --color-* / --container-* / --shadow-*）
        │   ├── styles.css        # 唯一入口：@import "tailwindcss" + tokens + 组件层
        │   ├── primitives/       # React 原语（纯 props，零业务依赖）
        │   │   ├── Button.tsx Card.tsx Input.tsx Badge.tsx Table.tsx Dialog.tsx ...
        │   │   └── index.ts
        │   └── index.ts
        ├── AGENTS.md             # 给 AI 的设计系统使用契约（核心资产）
        └── README.md
```

> 将来若想要 `apps/` 整洁布局，等设计系统稳定后再迁，风险更低。

## 四、Token 层（直接复用，零重造，命名全保留）

| 类别 | token |
|---|---|
| 6 基色 | `--background --surface --foreground --accent --info --success --destructive` |
| 派生 | `--surface-muted/subtle`、`--foreground-1.5…95`、`--*-text` |
| 阴影 | `--shadow-minimal/-flat/-modal-small` + opacity 变量 |
| shadcn 兼容 | `--card --popover --secondary --muted --border --input --ring` |
| 字体 | `--font-sans/serif/mono`、`--font-size-base` |
| 层级 | `--z-base…--z-titlebar`（14 级） |
| 暴露给 TW | `@theme inline` 的 `--color-* / --container-* / --shadow-*` |

**唯一改动**：App 专用 token（`--step-*` 引导步骤、`--md-bullets`、react-pdf/sonner 相关）剥出留在 App 自己的 css，保证包通用。

## 五、组件原语清单（核心新增工作）

从 App 现有手写 className 提炼成标准件，用 `variant`/`size` 收敛间距漂移；**纯 props 驱动、零业务依赖**（不碰 Tauri/preferences/Skill 类型）。

| 原语 | 变体 / props | 提炼来源 |
|---|---|---|
| `Button` | `variant: solid/ghost/outline/destructive`、`size: sm/md/lg`、`loading` | `.send-btn .panel-header-btn .header-icon-btn .entity-row-btn` |
| `IconButton` | 方形图标按钮 | `.header-icon-btn .input-toolbar-btn` |
| `Card` / `Panel` | `surface/muted/subtle`、`shadow` | 大量 `rounded-* shadow-minimal` 块 |
| `Input` / `Textarea` | `ring/error` 状态 | 现有 input-container |
| `Badge` / `Tag` | `tone: accent/success/info/destructive` | `text-accent`、`surface-muted` |
| `Table` / `DefinitionTable` | 键值排版 | `DefinitionTable`、`SkillInfoTables` |
| `Dialog` / `Popover` | `--z-modal/-popover` + portal | 现有 overlay/portal |
| `Spinner` / `Ripple` | loading 态 | 已有 `.spinner .ripple-loader` |

## 六、AI 契约（`packages/design-system/AGENTS.md`，决定一致性成败）

给 codex/claude 的强制规则：
1. **颜色只许用语义 token**：用 `bg-surface / text-foreground-50 / border-border`，禁止裸 `bg-slate-100`（现有 3 处违规顺手清掉）。
2. **间距/圆角走规范**：列允许的 `size` 阶梯，禁止随手 `px-2 py-0`。
3. **组件优先**：需要按钮就 `<Button>`，不手拼 className；附每个原语最小示例。
4. **类名词汇表**：枚举真实 token 名（这正是将来 design-sync 同步到 claude.ai/design 所需的 conventions header）。

> 根 `AGENTS.md`（UI 踩坑笔记）保留，加一条指向本契约；两者职责不同、并存。

## 七、落地步骤（分阶段，每阶段可独立验证）

| 阶段 | 产出 | 风险 |
|---|---|---|
| **0. 脚手架** | 根加 `workspaces`，建空 `packages/design-system`（不动 App 引用，现有构建零影响） | 低 |
| **1. Token 包** | 拆 tokens 三件套 + 包入口；App 改为 `@import` 包；验证视觉零回归 | 低 |
| **2. AI 契约** | 写包内 `AGENTS.md` + 清 3 处裸色 | 低 |
| **3. 原语组件** | 按清单逐个提炼，App 内渐进替换手写 className | 中 |
| **4. 分发** | 配 build（ESM + d.ts），发 npm / git 依赖；其他项目接入 | 低 |
| **5.（可选）** | 对这个干净的包跑 design-sync → 接入 claude.ai/design | 低 |

**关键收益**：到阶段 5，最初「同步到 Design」的诉求自然成立 —— 那时它真的是一个组件库，不再是 App。

## 八、进度与下一步（截至 2026-06-17，分支 `feat/design-system`）

| 阶段 | 状态 | 备注 |
|---|---|---|
| 0 脚手架 | ✅ 完成 | bun workspace + 包骨架，零回归 |
| 1 Token 包 | ✅ 完成 | token 三件套抽入包，App 改 `@import`，构建逐字节零回归 |
| 2 AI 契约 | ✅ 完成 | `packages/design-system/AGENTS.md` + 清裸色 |
| 3 组件原语 | 🟢 组件库已就位 | Claude Design 定稿的 14 个原语已引入包（Button/IconButton/Ripple/Card/Input/Textarea/Badge/Switch/SegmentedControl/Checkbox/Radio/Select/Table/Dialog）+ `primitives.css`；构建/类型/token 校验全过。App 内批量替换待做 |
| 4 分发 | ⏸️ 暂不做 | 决定先只在本仓库用，暂不发布 npm |

**下一步：** 组件规范已在 Claude Design 定稿并引入包。剩余是把 app 里手写的 className 逐文件替换为这些原语（~53 按钮 + 卡片/输入/表格等），每步构建验证 + `bun run dev` 肉眼确认。

**待清理：** App `src/index.css` 仍有 `.ripple-loader`/`.spinner`/`.animate-shimmer-loading` 与包 `primitives.css` 重复定义（内容相同、无害）；待 app 改用包内 `Ripple` 后移除 app 侧定义。
