# Skill Grove

<p>
  简体中文 | <a href="README.md">English</a>
</p>

<p>
  <a href="https://github.com/AlienHub/skill-grove/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue.svg"></a>
  <img alt="Version" src="https://img.shields.io/badge/version-0.6.1-111827.svg">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-v2-24C8DB.svg">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6.svg">
  <img alt="Bun" src="https://img.shields.io/badge/Bun-ready-000000.svg">
  <img alt="Status" src="https://img.shields.io/badge/status-initial%20release-7C3AED.svg">
</p>

**Skill Grove 是一个开源的本地 Agent Skill 治理工作台。**

Agent Skill 正在成为一种新的软件制品。它不是 Prompt，不是 Workflow，也不只是 Tool 的包装。一个 Skill 更像是面向 Agent 的上下文能力包：它告诉 Agent 什么时候应该加载、应该读取什么、遵守什么约束，以及如何避免已知的失败模式。

Skill Grove 希望帮助用户把这些 Skill 当作长期可维护的 Agent 能力资产，而不是散落在不同目录里的本地文件。当前应用保持克制：先用一个本地桌面工作台让 Skill 资产变得可见、可读、可比较，然后逐步演进到评估、上下文成本分析和 Skill 生命周期治理。

> Prompt 是一次性指令。  
> Skill 是可维护的 Agent 能力资产。

## 目录

- [为什么需要 Skill 治理](#为什么需要-skill-治理)
- [Skill Grove 当前能做什么](#skill-grove-当前能做什么)
- [设计原则](#设计原则)
- [路线方向](#路线方向)
- [快速开始](#快速开始)
- [开发验证](#开发验证)
- [配置文件](#配置文件)
- [项目结构](#项目结构)
- [贡献](#贡献)
- [许可证](#许可证)

## 为什么需要 Skill 治理

随着 Claude、Codex、Cursor、OpenCode、Goose、Kiro、Qwen、Trae 等 Agent Runtime 逐渐支持或接近 Skill 形态，用户会在本地积累越来越多的 Agent 能力资产。真正的问题不再只是“我的 Skill 在哪里”，而是：

- 我的本地 Agent 环境里到底有哪些 Skill？
- 哪些 Skill 是重复的、软链接的、过期的，或者内容不一致？
- 哪些 Skill description 太宽泛，可能导致错误路由？
- 哪些 Skill 消耗了过多上下文，但没有带来足够收益？
- 哪些 references、scripts、assets 真的构成了一个可复用能力？
- 如何把 Agent 反复犯的错误沉淀为 gotchas、examples 和 eval cases？

Skill Grove 从本地可见性开始，因为治理始于资产盘点。一个 Skill 在被评估、优化和信任之前，首先需要被发现、被阅读、被比较、被解释。

## Skill Grove 当前能做什么

Skill Grove 当前是一个独立的 Tauri v2 桌面应用，专注于 Agent Skill 治理的第一层：让本地 Skill 资产可见、可理解。

当前能力：

- 本地浏览 `SKILL.md`，适合作为 Agent Skill 的桌面索引与检查器。
- 自动发现常见 Agent 的 Skill 目录，并保留用户手动配置的目录。
- 聚合同名 Skill 的多个来源，帮助识别重复、软链接和内容变体。
- 查看 Skill 的来源、元数据、最近变化、收藏状态和阅读记录。
- 阅读长 Markdown 说明，展示 frontmatter，并保持清晰排版。
- 为来源操作配置默认编辑器或 IDE 打开方式。
- 使用 `@lobehub/icons` 展示 Agent 来源图标，并支持自定义来源图标。
- 支持 macOS 桌面应用打包，使用原生透明标题栏和自定义 app 图标。

## 设计原则

### 1. Skill 是资产，不是片段

一个有价值的 Skill 不只是 Markdown 文件。它可能包含路由描述、执行说明、references、scripts、examples、assets 和 gotchas。Skill Grove 将 Skill 视为一个能力包，而不是一段孤立文本。

### 2. 每个 Skill 都有上下文成本

Skill 越多，Agent 不一定越强。每个 Skill description 都会带来索引成本，每次加载 `SKILL.md` 都会带来上下文成本，每个模糊 reference 都会增加执行不确定性。Skill Grove 希望逐步让这些成本变得可见。

### 3. 路由准确性也是质量的一部分

好的 Skill 不只是写得清楚，还应该在正确场景下被加载，在错误场景下被避免，并明确告诉 Agent 应该读取哪些文件或参考资料。后续版本会更关注 routing clarity、重叠检测和 negative examples。

### 4. Gotcha 是 Skill 进化的最小单位

Agent 失败不应该消失在聊天历史里。重复错误可以沉淀为 gotchas、examples、evals，或者直接成为对 Skill 的补丁。Skill Grove 会探索如何把失败记忆转化为可维护的 Skill 改进。

### 5. 先本地优先，再平台化

Skill 往往分散在个人工作站、IDE、CLI 和不同 Agent Runtime 里。Skill Grove 选择 local-first，让用户先理解自己的 Skill 环境，再考虑更重的协作或平台能力。

## 路线方向

Skill Grove 还处于早期阶段。接下来会从 Skill 浏览器，逐步演进为一个小而明确的 Agent Skill 治理工作台。

计划方向：

- **Skill Quality Hints**：识别过宽 description、缺失 examples、缺失 gotchas、未引用 references、过长说明等问题。
- **Context Cost Analysis**：估算 index cost、加载正文成本和 reference footprint。
- **Routing Conflict Review**：识别 Skill 描述之间的重叠和潜在误触发风险。
- **Gotcha Capture**：帮助用户把真实 Agent 失败沉淀为候选 gotcha 和 Skill patch。
- **Eval Seeds**：基于现有 Skill 和用户反馈生成正向 / 负向路由测试用例。
- **Invocation Analytics**：在 Agent Runtime 暴露调用轨迹后，分析 Skill 的真实调用效果。

目标不是做一个很重的企业控制台，而是让 Agent Skill Engineering 变得具体、轻量、可落地。

## 快速开始

安装依赖：

```bash
bun install
```

启动 Tauri 桌面应用：

```bash
bun run tauri:dev
```

只启动 Vite 浏览器版本：

```bash
bun run dev
```

浏览器地址：

```text
http://127.0.0.1:5176
```

## 开发验证

```bash
bun run typecheck
bun run build
cd src-tauri && cargo check
```

构建 DMG：

```bash
bun run dmg
```

生成的 `.app` 位置：

```text
src-tauri/target/release/bundle/macos/Skill Grove.app
```

## 配置文件

Skill Grove 的用户配置文件位于：

```text
~/.agents/skill-manager.json
```

示例：

```json
{
  "skillDirectories": [
    "/Users/you/.agents/skills",
    "/Users/you/.codex/skills"
  ],
  "sourceIcons": {
    "/Users/you/.agents/skills": {
      "type": "dataUrl",
      "value": "data:image/svg+xml;base64,..."
    }
  }
}
```

字段说明：

- `skillDirectories`：用户手动配置的 Skill 根目录。
- `sourceIcons`：来源目录到自定义图标的映射，key 为规范化后的来源目录。
- 自定义图标优先级高于内置 `@lobehub/icons` 映射。

## 项目结构

```text
index.html                  浏览器 shell 与 favicon 引用
public/app-icon.svg         浏览器 favicon 源文件
src/pages/SkillManagerPage.tsx
                            主 React 页面
src/vite-env.d.ts           virtual module 类型定义
vite.config.ts              Vite 插件、dev/preview API、本地扫描器
src-tauri/src/lib.rs        Tauri commands 与生产扫描器
src-tauri/tauri.conf.json   Tauri 窗口与 bundle 配置
src-tauri/icons             生成后的 app 图标资源
```

## 贡献

欢迎通过 Issue 或 Pull Request 讨论下面这些方向：

- 增加新的 Agent Skill 目录候选项。
- 为更多 Agent 来源补充 `@lobehub/icons` 映射。
- 优化 Skill 资产盘点、多来源聚合和本地工作台体验。
- 探索围绕路由清晰度、上下文成本、references、examples、gotchas 和 eval seeds 的质量提示。
- 增加更多平台的打包验证。

提交前建议运行：

```bash
bun run typecheck
bun run build
cd src-tauri && cargo check
```

## 许可证

本项目基于 [Apache-2.0](LICENSE) 许可证开源。

## 备注

- dev 和 preview 模式通过 `/__skill_manager__` 暴露本地扫描 API。
- 生产模式使用 Tauri commands 完成扫描、保存目录和保存来源图标。
- 当前版本会把 Skill 内容注入 virtual state module，并引入多个 icon 组件，因此构建时出现 large chunk warning 是预期现象。
