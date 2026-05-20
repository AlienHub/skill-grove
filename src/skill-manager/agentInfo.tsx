import { type ComponentType } from 'react'
import AmpIcon from '@lobehub/icons/es/Amp/components/Color'
import AntigravityIcon from '@lobehub/icons/es/Antigravity/components/Color'
import ClaudeCodeIcon from '@lobehub/icons/es/ClaudeCode/components/Color'
import CodexIcon from '@lobehub/icons/es/Codex/components/Color'
import CursorIcon from '@lobehub/icons/es/Cursor/components/Mono'
import GeminiCLIIcon from '@lobehub/icons/es/GeminiCLI/components/Color'
import GithubCopilotIcon from '@lobehub/icons/es/GithubCopilot/components/Mono'
import GooseIcon from '@lobehub/icons/es/Goose/components/Mono'
import HermesAgentIcon from '@lobehub/icons/es/HermesAgent/components/Mono'
import JunieIcon from '@lobehub/icons/es/Junie/components/Color'
import KiloCodeIcon from '@lobehub/icons/es/KiloCode/components/Mono'
import KimiIcon from '@lobehub/icons/es/Kimi/components/Color'
import OpenClawIcon from '@lobehub/icons/es/OpenClaw/components/Color'
import OpenHandsIcon from '@lobehub/icons/es/OpenHands/components/Color'
import QoderIcon from '@lobehub/icons/es/Qoder/components/Color'
import QwenIcon from '@lobehub/icons/es/Qwen/components/Color'
import ReplitIcon from '@lobehub/icons/es/Replit/components/Color'
import RooCodeIcon from '@lobehub/icons/es/RooCode/components/Mono'
import TraeIcon from '@lobehub/icons/es/Trae/components/Color'
import WindsurfIcon from '@lobehub/icons/es/Windsurf/components/Mono'
import ZencoderIcon from '@lobehub/icons/es/Zencoder/components/Color'
import { type AgentInfo, type SourceIcon } from './types'

const AGENT_DIRECTORY_MARKERS: Array<AgentInfo & { marker: string }> = [
  { marker: '/.codex/superpowers/skills', agentId: 'codex', agentName: 'Codex' },
  { marker: '/.gemini/antigravity/skills', agentId: 'antigravity', agentName: 'Antigravity' },
  { marker: '/.config/opencode/skills', agentId: 'opencode', agentName: 'OpenCode' },
  { marker: '/.config/agents/skills', agentId: 'amp', agentName: 'Amp' },
  { marker: '/.config/goose/skills', agentId: 'goose', agentName: 'Goose' },
  { marker: '/.config/crush/skills', agentId: 'crush', agentName: 'Crush' },
  { marker: '/.agents/skills', agentId: 'agents', agentName: 'Agents' },
  { marker: '/.codex/skills', agentId: 'codex', agentName: 'Codex' },
  { marker: '/.claude/skills', agentId: 'claude', agentName: 'Claude' },
  { marker: '/.cursor/skills', agentId: 'cursor', agentName: 'Cursor' },
  { marker: '/.continue/skills', agentId: 'continue', agentName: 'Continue' },
  { marker: '/.gemini/skills', agentId: 'gemini', agentName: 'Gemini' },
  { marker: '/.opencode/skills', agentId: 'opencode', agentName: 'OpenCode' },
  { marker: '/.eagleclaw/skills', agentId: 'eagleclaw', agentName: 'EagleClaw' },
  { marker: '/.hermes/skills', agentId: 'hermes', agentName: 'Hermes' },
  { marker: '/.kilocode/skills', agentId: 'kilo_code', agentName: 'Kilo Code' },
  { marker: '/.roo/skills', agentId: 'roo_code', agentName: 'Roo Code' },
  { marker: '/.copilot/skills', agentId: 'github_copilot', agentName: 'GitHub Copilot' },
  { marker: '/.openclaw/skills', agentId: 'openclaw', agentName: 'OpenClaw' },
  { marker: '/.craft-agent/workspaces', agentId: 'craft_agents', agentName: 'Craft Agents' },
  { marker: '/.factory/skills', agentId: 'droid', agentName: 'Droid' },
  { marker: '/.codeium/windsurf/skills', agentId: 'windsurf', agentName: 'Windsurf' },
  { marker: '/.trae-cn/skills', agentId: 'trae_cn', agentName: 'TRAE CN' },
  { marker: '/.trae/skills', agentId: 'trae', agentName: 'TRAE IDE' },
  { marker: '/.deepagents/agent/skills', agentId: 'deepagents', agentName: 'Deep Agents' },
  { marker: '/.firebender/skills', agentId: 'firebender', agentName: 'Firebender' },
  { marker: '/.augment/skills', agentId: 'augment', agentName: 'Augment' },
  { marker: '/.bob/skills', agentId: 'bob', agentName: 'IBM Bob' },
  { marker: '/.codebuddy/skills', agentId: 'codebuddy', agentName: 'CodeBuddy' },
  { marker: '/.commandcode/skills', agentId: 'command_code', agentName: 'Command Code' },
  { marker: '/.snowflake/cortex/skills', agentId: 'cortex', agentName: 'Cortex Code' },
  { marker: '/.iflow/skills', agentId: 'iflow', agentName: 'iFlow CLI' },
  { marker: '/.junie/skills', agentId: 'junie', agentName: 'Junie' },
  { marker: '/.kiro/skills', agentId: 'kiro', agentName: 'Kiro CLI' },
  { marker: '/.kode/skills', agentId: 'kode', agentName: 'Kode' },
  { marker: '/.mcpjam/skills', agentId: 'mcpjam', agentName: 'MCPJam' },
  { marker: '/.vibe/skills', agentId: 'mistral_vibe', agentName: 'Mistral Vibe' },
  { marker: '/.mux/skills', agentId: 'mux', agentName: 'Mux' },
  { marker: '/.neovate/skills', agentId: 'neovate', agentName: 'Neovate' },
  { marker: '/.openhands/skills', agentId: 'openhands', agentName: 'OpenHands' },
  { marker: '/.pi/agent/skills', agentId: 'pi', agentName: 'Pi' },
  { marker: '/.pochi/skills', agentId: 'pochi', agentName: 'Pochi' },
  { marker: '/.qoder/skills', agentId: 'qoder', agentName: 'Qoder' },
  { marker: '/.qwen/skills', agentId: 'qwen_code', agentName: 'Qwen Code' },
  { marker: '/.zencoder/skills', agentId: 'zencoder', agentName: 'Zencoder' },
  { marker: '/.adal/skills', agentId: 'adal', agentName: 'AdaL' },
]

const LOBE_AGENT_ICONS: Record<string, ComponentType<{ className?: string; size?: number | string; title?: string }>> = {
  amp: AmpIcon,
  antigravity: AntigravityIcon,
  claude: ClaudeCodeIcon,
  codex: CodexIcon,
  cursor: CursorIcon,
  gemini: GeminiCLIIcon,
  github_copilot: GithubCopilotIcon,
  goose: GooseIcon,
  hermes: HermesAgentIcon,
  junie: JunieIcon,
  kilo_code: KiloCodeIcon,
  kimi: KimiIcon,
  openclaw: OpenClawIcon,
  openhands: OpenHandsIcon,
  qoder: QoderIcon,
  qwen_code: QwenIcon,
  replit: ReplitIcon,
  roo_code: RooCodeIcon,
  trae: TraeIcon,
  trae_cn: TraeIcon,
  windsurf: WindsurfIcon,
  zencoder: ZencoderIcon,
}

export function getAgentInfoFromDirectory(directory: string): AgentInfo {
  const normalizedDirectory = directory.replace(/\\/g, '/')
  const marker = [...AGENT_DIRECTORY_MARKERS]
    .sort((left, right) => right.marker.length - left.marker.length)
    .find((candidate) => normalizedDirectory.includes(candidate.marker))

  if (marker) {
    return {
      agentId: marker.agentId,
      agentName: marker.agentName,
    }
  }

  return {
    agentId: 'unknown',
    agentName: '自定义来源',
  }
}

function LightningIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-foreground/64"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M13.25 2.75 5.9 13.05a.72.72 0 0 0 .59 1.14h4.06l-.77 7.05 8.32-11.38a.72.72 0 0 0-.58-1.15h-4.33l.06-5.96Z"
        fill="currentColor"
        opacity="0.92"
      />
    </svg>
  )
}

export function AgentIcon({
  agentId,
  agentIcon,
  agentName,
  size = 14,
}: AgentInfo & {
  agentIcon?: SourceIcon | null
  size?: number
}) {
  if (agentIcon?.type === 'dataUrl' && agentIcon.value) {
    return (
      <img
        alt=""
        className="shrink-0 object-contain"
        height={size}
        src={agentIcon.value}
        style={{ height: size, width: size }}
        title={agentName}
        width={size}
      />
    )
  }

  const LobeIcon = LOBE_AGENT_ICONS[agentId]
  if (LobeIcon) {
    return <LobeIcon className="shrink-0" size={size} title={agentName} />
  }

  return <LightningIcon size={size} />
}
