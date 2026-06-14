import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { basename, dirname, resolve, relative } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { createHash } from 'crypto'
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'fs'
import { homedir, tmpdir } from 'os'
import matter from 'gray-matter'

type SourceIcon = {
  type: 'dataUrl'
  value: string
}

type LocalSkill = {
  id: string
  slug: string
  name: string
  description: string
  content: string
  location: string
  sourceDirectory: string
  skillDirectory: string
  resolvedSourceDirectory: string
  resolvedSkillDirectory: string
  contentHash: string
  agentId: string
  agentName: string
  agentIcon: SourceIcon | null
  metadata: Record<string, unknown>
}

type BuiltInDirectoryState = {
  agentId: string
  agentName: string
  directory: string
  installed: boolean
  directoryExists: boolean
  scanEnabled: boolean
}

type DirectoryOpenTarget = {
  id: string
  label: string
  category: string
  appPath: string | null
  bundleId: string | null
  icon: SourceIcon | null
}

type SkillManagerState = {
  configuredDirectories: string[]
  shareTargetDirectories: string[]
  userConfiguredDirectories: string[]
  disabledScanDirectories: string[]
  builtInDirectories: BuiltInDirectoryState[]
  discoveredDirectories: string[]
  sourceIcons: Record<string, SourceIcon>
  openDirectoryTargets: DirectoryOpenTarget[]
  primarySkillRepository: string
  skills: LocalSkill[]
}

type SkillManagerConfig = {
  skillDirectories?: unknown
  disabledScanDirectories?: unknown
  sourceIcons?: unknown
  primarySkillRepository?: unknown
}

type BuiltInSkillDirectory = {
  path: string
  agentId: string
  agentName: string
  commands: readonly string[]
  appNames: readonly string[]
}

const STATIC_BUILT_IN_SKILL_DIRECTORIES = [
  { path: resolve(homedir(), '.agents/skills'), agentId: 'agents', agentName: 'Agents', commands: [], appNames: [] },
  { path: resolve(homedir(), '.codex/skills'), agentId: 'codex', agentName: 'Codex', commands: ['codex'], appNames: ['Codex'] },
  { path: resolve(homedir(), '.claude/skills'), agentId: 'claude', agentName: 'Claude Code', commands: ['claude'], appNames: ['Claude'] },
  { path: resolve(homedir(), '.cursor/skills'), agentId: 'cursor', agentName: 'Cursor', commands: ['cursor'], appNames: ['Cursor'] },
  { path: resolve(homedir(), '.config/opencode/skills'), agentId: 'opencode', agentName: 'OpenCode', commands: ['opencode'], appNames: [] },
  { path: resolve(homedir(), '.gemini/antigravity/skills'), agentId: 'antigravity', agentName: 'Antigravity', commands: ['antigravity'], appNames: ['Antigravity', 'Google Antigravity'] },
  { path: resolve(homedir(), '.config/agents/skills'), agentId: 'amp', agentName: 'Amp', commands: ['amp'], appNames: [] },
  { path: resolve(homedir(), '.kilocode/skills'), agentId: 'kilo_code', agentName: 'Kilo Code', commands: ['kilocode', 'kilo-code', 'kilo'], appNames: ['Kilo Code'] },
  { path: resolve(homedir(), '.roo/skills'), agentId: 'roo_code', agentName: 'Roo Code', commands: ['roo', 'roo-code'], appNames: ['Roo Code'] },
  { path: resolve(homedir(), '.config/goose/skills'), agentId: 'goose', agentName: 'Goose', commands: ['goose'], appNames: ['Goose'] },
  { path: resolve(homedir(), '.gemini/skills'), agentId: 'gemini', agentName: 'Gemini', commands: ['gemini'], appNames: [] },
  { path: resolve(homedir(), '.copilot/skills'), agentId: 'github_copilot', agentName: 'GitHub Copilot', commands: ['github-copilot'], appNames: ['GitHub Copilot'] },
  { path: resolve(homedir(), '.openclaw/skills'), agentId: 'openclaw', agentName: 'OpenClaw', commands: ['openclaw'], appNames: [] },
  { path: resolve(homedir(), '.factory/skills'), agentId: 'droid', agentName: 'Droid', commands: ['droid', 'factory'], appNames: ['Factory'] },
  { path: resolve(homedir(), '.codeium/windsurf/skills'), agentId: 'windsurf', agentName: 'Windsurf', commands: ['windsurf'], appNames: ['Windsurf'] },
  { path: resolve(homedir(), '.trae/skills'), agentId: 'trae', agentName: 'TRAE IDE', commands: ['trae'], appNames: ['Trae', 'TRAE'] },
  { path: resolve(homedir(), '.deepagents/agent/skills'), agentId: 'deepagents', agentName: 'Deep Agents', commands: ['deepagents', 'deep-agent', 'deep'], appNames: ['Deep Agents'] },
  { path: resolve(homedir(), '.firebender/skills'), agentId: 'firebender', agentName: 'Firebender', commands: ['firebender'], appNames: ['Firebender'] },
  { path: resolve(homedir(), '.augment/skills'), agentId: 'augment', agentName: 'Augment', commands: ['augment'], appNames: ['Augment'] },
  { path: resolve(homedir(), '.bob/skills'), agentId: 'bob', agentName: 'IBM Bob', commands: ['bob'], appNames: ['IBM Bob'] },
  { path: resolve(homedir(), '.codebuddy/skills'), agentId: 'codebuddy', agentName: 'CodeBuddy', commands: ['codebuddy'], appNames: ['CodeBuddy'] },
  { path: resolve(homedir(), '.commandcode/skills'), agentId: 'command_code', agentName: 'Command Code', commands: ['commandcode', 'command-code'], appNames: ['Command Code'] },
  { path: resolve(homedir(), '.snowflake/cortex/skills'), agentId: 'cortex', agentName: 'Cortex Code', commands: ['cortex'], appNames: ['Cortex'] },
  { path: resolve(homedir(), '.config/crush/skills'), agentId: 'crush', agentName: 'Crush', commands: ['crush'], appNames: [] },
  { path: resolve(homedir(), '.iflow/skills'), agentId: 'iflow', agentName: 'iFlow CLI', commands: ['iflow'], appNames: [] },
  { path: resolve(homedir(), '.junie/skills'), agentId: 'junie', agentName: 'Junie', commands: ['junie'], appNames: ['Junie'] },
  { path: resolve(homedir(), '.kiro/skills'), agentId: 'kiro', agentName: 'Kiro CLI', commands: ['kiro'], appNames: ['Kiro'] },
  { path: resolve(homedir(), '.kode/skills'), agentId: 'kode', agentName: 'Kode', commands: ['kode'], appNames: [] },
  { path: resolve(homedir(), '.mcpjam/skills'), agentId: 'mcpjam', agentName: 'MCPJam', commands: ['mcpjam'], appNames: [] },
  { path: resolve(homedir(), '.vibe/skills'), agentId: 'mistral_vibe', agentName: 'Mistral Vibe', commands: ['vibe'], appNames: ['Mistral Vibe'] },
  { path: resolve(homedir(), '.mux/skills'), agentId: 'mux', agentName: 'Mux', commands: ['mux'], appNames: [] },
  { path: resolve(homedir(), '.neovate/skills'), agentId: 'neovate', agentName: 'Neovate', commands: ['neovate'], appNames: ['Neovate'] },
  { path: resolve(homedir(), '.openhands/skills'), agentId: 'openhands', agentName: 'OpenHands', commands: ['openhands'], appNames: ['OpenHands'] },
  { path: resolve(homedir(), '.pi/agent/skills'), agentId: 'pi', agentName: 'Pi', commands: ['pi'], appNames: ['Pi'] },
  { path: resolve(homedir(), '.pochi/skills'), agentId: 'pochi', agentName: 'Pochi', commands: ['pochi'], appNames: [] },
  { path: resolve(homedir(), '.qoder/skills'), agentId: 'qoder', agentName: 'Qoder', commands: ['qoder'], appNames: ['Qoder'] },
  { path: resolve(homedir(), '.qwen/skills'), agentId: 'qwen_code', agentName: 'Qwen Code', commands: ['qwen', 'qwen-code'], appNames: ['Qwen Code'] },
  { path: resolve(homedir(), '.trae-cn/skills'), agentId: 'trae_cn', agentName: 'TRAE CN', commands: ['trae-cn', 'trae'], appNames: ['Trae CN', 'TRAE CN'] },
  { path: resolve(homedir(), '.zencoder/skills'), agentId: 'zencoder', agentName: 'Zencoder', commands: ['zencoder'], appNames: ['Zencoder'] },
  { path: resolve(homedir(), '.adal/skills'), agentId: 'adal', agentName: 'AdaL', commands: ['adal'], appNames: [] },
  { path: resolve(homedir(), '.hermes/skills'), agentId: 'hermes', agentName: 'Hermes', commands: ['hermes'], appNames: ['Hermes'] },
] as const satisfies readonly BuiltInSkillDirectory[]
const OPEN_APP_CANDIDATES = [
  { id: 'vscode', label: 'Visual Studio Code', category: 'ide', appName: 'Visual Studio Code' },
  { id: 'cursor', label: 'Cursor', category: 'ide', appName: 'Cursor' },
  { id: 'antigravity', label: 'Antigravity', category: 'ide', appName: 'Antigravity' },
  { id: 'xcode', label: 'Xcode', category: 'ide', appName: 'Xcode' },
  { id: 'typora', label: 'Typora', category: 'editor', appName: 'Typora' },
  { id: 'zed', label: 'Zed', category: 'editor', appName: 'Zed' },
  { id: 'sublime_text', label: 'Sublime Text', category: 'editor', appName: 'Sublime Text' },
] as const
const SKILL_MANAGER_CONFIG_PATH = resolve(homedir(), '.agents', 'skill-manager.json')
const SKILL_MANAGER_API_BASE = '/__skill_manager__'
const VIRTUAL_SKILL_MANAGER_STATE = 'virtual:skill-manager-state'
const RESOLVED_VIRTUAL_SKILL_MANAGER_STATE = '\0virtual:skill-manager-state'
const projectRoot = dirname(fileURLToPath(import.meta.url))
const PACKAGE_JSON_PATH = resolve(projectRoot, 'package.json')
let loginShellPathDirectories: string[] | null = null

function sendJson(res: NodeJS.WritableStream & {
  statusCode?: number
  setHeader?: (name: string, value: string) => void
  end: (chunk?: string) => void
}, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function devSkillUsageState() {
  return {
    version: 1,
    countsBySkillMdPath: {} as Record<string, number>,
    countsBySkillMdPathBySource: {} as Record<string, Record<string, number>>,
    lastScanAt: null as string | null,
    scanNote:
      'Web preview: usage counting runs only in the desktop app and scans Claude Code, Codex, OpenClaw, and Craft Agents transcripts.',
  }
}

function readAppVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { version?: unknown }
    return typeof packageJson.version === 'string' && packageJson.version.trim()
      ? packageJson.version.trim()
      : '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function expandHomeDirectory(input: string) {
  if (input === '~') {
    return homedir()
  }

  if (input.startsWith('~/')) {
    return resolve(homedir(), input.slice(2))
  }

  return input
}

function normalizeConfiguredDirectories(directories: string[]) {
  const seen = new Set<string>()

  return directories
    .map((directory) => directory.trim())
    .filter(Boolean)
    .map((directory) => resolve(expandHomeDirectory(directory)))
    .filter((directory) => {
      if (seen.has(directory)) {
        return false
      }

      seen.add(directory)
      return true
    })
}

function readCraftAgentSkillDirectories(): BuiltInSkillDirectory[] {
  const configPath = resolve(homedir(), '.craft-agent/config.json')
  let parsed: { workspaces?: unknown }
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8')) as { workspaces?: unknown }
  } catch {
    return []
  }

  if (!Array.isArray(parsed.workspaces)) {
    return []
  }

  const seen = new Set<string>()
  return parsed.workspaces.flatMap((workspace): BuiltInSkillDirectory[] => {
    if (!workspace || typeof workspace !== 'object') {
      return []
    }

    const rootPath = (workspace as { rootPath?: unknown }).rootPath
    if (typeof rootPath !== 'string' || !rootPath.trim()) {
      return []
    }

    const expanded = expandHomeDirectory(rootPath.trim())
    const absolute = expanded.startsWith('/') ? expanded : resolve(homedir(), expanded)
    const workspaceRoot = (() => {
      try {
        return realpathSync(absolute)
      } catch {
        return absolute
      }
    })()
    const path = resolve(workspaceRoot, 'skills')
    if (seen.has(path)) {
      return []
    }

    seen.add(path)
    return [{
      path,
      agentId: 'craft_agents',
      agentName: 'Craft Agents',
      commands: ['craft-agents', 'craft-agent', 'craft'],
      appNames: ['Craft Agents', 'Craft'],
    }]
  })
}

function builtInSkillDirectories(): BuiltInSkillDirectory[] {
  return [...STATIC_BUILT_IN_SKILL_DIRECTORIES, ...readCraftAgentSkillDirectories()]
}

function isBuiltInDirectory(directory: string) {
  return builtInSkillDirectories().some((builtInDirectory) => builtInDirectory.path === directory)
}

function commandExists(command: string) {
  const commandDirectories = new Set<string>()
  for (const directory of process.env.PATH?.split(':') ?? []) {
    if (directory) {
      commandDirectories.add(directory)
    }
  }

  for (const directory of [
    resolve(homedir(), '.local/bin'),
    resolve(homedir(), '.bun/bin'),
    resolve(homedir(), '.cargo/bin'),
    resolve(homedir(), '.opencode/bin'),
    resolve(homedir(), 'Library/pnpm'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
  ]) {
    commandDirectories.add(directory)
  }

  for (const directory of readLoginShellPathDirectories()) {
    commandDirectories.add(directory)
  }

  const nvmVersionsPath = resolve(homedir(), '.nvm/versions/node')
  try {
    for (const version of readdirSync(nvmVersionsPath)) {
      commandDirectories.add(resolve(nvmVersionsPath, version, 'bin'))
    }
  } catch {
    // nvm is optional.
  }

  return [...commandDirectories].some((directory) => existsSync(resolve(directory, command)))
}

function readLoginShellPathDirectories() {
  if (loginShellPathDirectories) {
    return loginShellPathDirectories
  }

  const result = spawnSync('/bin/zsh', ['-lc', 'print -r -- "$PATH"'], { encoding: 'utf8' })
  loginShellPathDirectories = result.status === 0
    ? result.stdout.trim().split(':').filter(Boolean)
    : []

  return loginShellPathDirectories
}

function appExists(appName: string) {
  const appDirectory = appName.endsWith('.app') ? appName : `${appName}.app`

  return [
    resolve('/Applications', appDirectory),
    resolve(homedir(), 'Applications', appDirectory),
  ].some((directory) => {
    try {
      return existsSync(directory) && statSync(directory).isDirectory()
    } catch {
      return false
    }
  })
}

function isBuiltInAgentInstalled(directory: BuiltInSkillDirectory) {
  if (directory.agentId === 'agents' || directory.agentId === 'craft_agents') {
    try {
      return existsSync(directory.path) && statSync(directory.path).isDirectory()
    } catch {
      return false
    }
  }

  return directory.commands.some(commandExists) || directory.appNames.some(appExists)
}

function readDisabledScanDirectories() {
  const config = readSkillManagerConfig()
  const disabledDirectories = Array.isArray(config.disabledScanDirectories)
    ? config.disabledScanDirectories.filter((directory): directory is string => typeof directory === 'string')
    : []

  return normalizeConfiguredDirectories(disabledDirectories)
}

function getBuiltInDirectoryStates(disabledScanDirectories = readDisabledScanDirectories()): BuiltInDirectoryState[] {
  const disabledSet = new Set(disabledScanDirectories)

  return builtInSkillDirectories()
    .map((directory) => {
      let directoryExists = false
      try {
        directoryExists = existsSync(directory.path) && statSync(directory.path).isDirectory()
      } catch {
        directoryExists = false
      }

      const installed = isBuiltInAgentInstalled(directory)

      return {
        agentId: directory.agentId,
        agentName: directory.agentName,
        directory: directory.path,
        installed,
        directoryExists,
        scanEnabled: installed && directoryExists && !disabledSet.has(directory.path),
      }
    })
}

function readSkillManagerConfig(): SkillManagerConfig {
  if (!existsSync(SKILL_MANAGER_CONFIG_PATH)) {
    return {}
  }

  try {
    const raw = readFileSync(SKILL_MANAGER_CONFIG_PATH, 'utf8')
    return JSON.parse(raw) as SkillManagerConfig
  } catch {
    return {}
  }
}

function scanDirectoriesFromStates(
  userConfiguredDirectories: string[],
  builtInDirectories: BuiltInDirectoryState[],
  disabledScanDirectories: string[]
) {
  const disabledSet = new Set(disabledScanDirectories)

  return normalizeConfiguredDirectories([
    ...userConfiguredDirectories.filter((directory) => !disabledSet.has(directory)),
    ...builtInDirectories
      .filter((directory) => directory.scanEnabled)
      .map((directory) => directory.directory),
  ])
}

function shareTargetDirectoriesFromStates(
  configuredDirectories: string[],
  builtInDirectories: BuiltInDirectoryState[]
) {
  return normalizeConfiguredDirectories([
    ...configuredDirectories,
    ...builtInDirectories
      .filter((directory) => directory.installed)
      .map((directory) => directory.directory),
  ])
}

function readShareTargetDirectories() {
  const disabledScanDirectories = readDisabledScanDirectories()
  return shareTargetDirectoriesFromStates(
    readUserConfiguredDirectories(),
    getBuiltInDirectoryStates(disabledScanDirectories)
  )
}

function readUserConfiguredDirectories() {
  const config = readSkillManagerConfig()
  const configuredDirectories = Array.isArray(config.skillDirectories)
    ? config.skillDirectories.filter((directory): directory is string => typeof directory === 'string')
    : []

  return normalizeConfiguredDirectories(configuredDirectories).filter((directory) => !isBuiltInDirectory(directory))
}

function readConfiguredDirectories() {
  const disabledScanDirectories = readDisabledScanDirectories()
  return scanDirectoriesFromStates(
    readUserConfiguredDirectories(),
    getBuiltInDirectoryStates(disabledScanDirectories),
    disabledScanDirectories
  )
}

function normalizeSourceIcons(sourceIcons: unknown) {
  const normalized: Record<string, SourceIcon> = {}
  if (!sourceIcons || typeof sourceIcons !== 'object' || Array.isArray(sourceIcons)) {
    return normalized
  }

  for (const [directory, icon] of Object.entries(sourceIcons)) {
    if (!icon || typeof icon !== 'object' || Array.isArray(icon)) {
      continue
    }

    const candidate = icon as { type?: unknown; value?: unknown }
    if (candidate.type !== 'dataUrl' || typeof candidate.value !== 'string' || !candidate.value.trim()) {
      continue
    }

    const [normalizedDirectory] = normalizeConfiguredDirectories([directory])
    if (normalizedDirectory) {
      normalized[normalizedDirectory] = { type: 'dataUrl', value: candidate.value }
    }
  }

  return normalized
}

function readSourceIcons() {
  return normalizeSourceIcons(readSkillManagerConfig().sourceIcons)
}

function defaultPrimarySkillRepositoryPath(): string {
  const [normalized] = normalizeConfiguredDirectories([resolve(homedir(), '.agents', 'skills')])
  return normalized ?? resolve(homedir(), '.agents', 'skills')
}

function readPrimarySkillRepository(): string {
  const config = readSkillManagerConfig()
  const raw = config.primarySkillRepository
  if (typeof raw === 'string' && raw.trim()) {
    const [normalized] = normalizeConfiguredDirectories([raw.trim()])
    if (normalized) {
      return normalized
    }
  }

  return defaultPrimarySkillRepositoryPath()
}

function normalizePrimarySkillRepositoryForSave(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('主仓库路径不能为空。')
  }

  const [normalized] = normalizeConfiguredDirectories([trimmed])
  if (!normalized) {
    throw new Error('无法解析主仓库路径。')
  }

  return normalized
}

function normalizeSourceIconForDirectory(directory: string, icon: unknown) {
  return normalizeSourceIcons({ [directory]: icon })[normalizeConfiguredDirectories([directory])[0] ?? directory]
}

function writeSkillManagerConfig(config: {
  skillDirectories: string[]
  disabledScanDirectories: string[]
  sourceIcons: Record<string, SourceIcon>
  primarySkillRepository: string
}) {
  mkdirSync(dirname(SKILL_MANAGER_CONFIG_PATH), { recursive: true })
  writeFileSync(
    SKILL_MANAGER_CONFIG_PATH,
    JSON.stringify(config, null, 2),
    'utf8'
  )
}

function writeConfiguredDirectories(directories: string[]) {
  const skillDirectories = normalizeConfiguredDirectories(directories).filter((directory) => !isBuiltInDirectory(directory))
  const knownDirectories = new Set([
    ...skillDirectories,
    ...builtInSkillDirectories().map((directory) => directory.path),
  ])

  writeSkillManagerConfig({
    skillDirectories,
    disabledScanDirectories: readDisabledScanDirectories().filter((directory) => knownDirectories.has(directory)),
    sourceIcons: readSourceIcons(),
    primarySkillRepository: readPrimarySkillRepository(),
  })
}

function writeScanDirectoryEnabled(directory: string, enabled: boolean) {
  const [normalizedDirectory] = normalizeConfiguredDirectories([directory])
  if (!normalizedDirectory) {
    throw new Error('directory is required')
  }

  const disabledSet = new Set(readDisabledScanDirectories())
  if (enabled) {
    disabledSet.delete(normalizedDirectory)
  } else {
    disabledSet.add(normalizedDirectory)
  }

  writeSkillManagerConfig({
    skillDirectories: readUserConfiguredDirectories(),
    disabledScanDirectories: normalizeConfiguredDirectories(Array.from(disabledSet)),
    sourceIcons: readSourceIcons(),
    primarySkillRepository: readPrimarySkillRepository(),
  })
}

function writeSourceIcon(directory: string, icon: SourceIcon | null) {
  const [normalizedDirectory] = normalizeConfiguredDirectories([directory])
  if (!normalizedDirectory) {
    return
  }

  const sourceIcons = readSourceIcons()
  if (icon) {
    sourceIcons[normalizedDirectory] = icon
  } else {
    delete sourceIcons[normalizedDirectory]
  }

  writeSkillManagerConfig({
    skillDirectories: readUserConfiguredDirectories(),
    disabledScanDirectories: readDisabledScanDirectories(),
    sourceIcons,
    primarySkillRepository: readPrimarySkillRepository(),
  })
}

function savePrimarySkillRepositoryForApi(path: string) {
  const normalized = normalizePrimarySkillRepositoryForSave(path)
  writeSkillManagerConfig({
    skillDirectories: readUserConfiguredDirectories(),
    disabledScanDirectories: readDisabledScanDirectories(),
    sourceIcons: readSourceIcons(),
    primarySkillRepository: normalized,
  })
  return loadSkillManagerState()
}

function runOpenCommand(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: 'ignore' })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status ?? 'unknown'}`)
  }
}

function commandOutput(command: string, args: string[]) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    return null
  }

  const value = result.stdout.trim()
  return value || null
}

function appPathForName(appName: string) {
  const appDirectory = appName.endsWith('.app') ? appName : `${appName}.app`
  const directPath = [
    resolve('/Applications', appDirectory),
    resolve(homedir(), 'Applications', appDirectory),
  ].find((path) => {
    try {
      return existsSync(path) && statSync(path).isDirectory()
    } catch {
      return false
    }
  })

  if (directPath) {
    return directPath
  }

  const query = `kMDItemFSName == '${appDirectory.replace(/'/g, "\\'")}'`
  return commandOutput('mdfind', [query])
    ?.split('\n')
    .find((path) => {
      try {
        return existsSync(path) && statSync(path).isDirectory()
      } catch {
        return false
      }
    }) ?? null
}

function plistValue(plistPath: string, key: string) {
  return commandOutput('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, plistPath])
}

function appBundleId(appPath: string) {
  return plistValue(resolve(appPath, 'Contents', 'Info.plist'), 'CFBundleIdentifier')
}

function appIconPath(appPath: string) {
  const iconFile = plistValue(resolve(appPath, 'Contents', 'Info.plist'), 'CFBundleIconFile')
  if (!iconFile) {
    return null
  }

  const iconPath = resolve(
    appPath,
    'Contents',
    'Resources',
    iconFile.endsWith('.icns') ? iconFile : `${iconFile}.icns`
  )

  return existsSync(iconPath) ? iconPath : null
}

function iconDataUrlFromIcns(iconPath: string): SourceIcon | null {
  const token = createHash('sha1').update(iconPath).digest('hex')
  const outputPath = resolve(tmpdir(), `skill-grove-icon-64-${token}.png`)

  if (!existsSync(outputPath)) {
    runOpenCommand('sips', ['-Z', '64', '-s', 'format', 'png', iconPath, '--out', outputPath])
  }

  return {
    type: 'dataUrl',
    value: `data:image/png;base64,${readFileSync(outputPath).toString('base64')}`,
  }
}

function appIconDataUrl(appPath: string) {
  const iconPath = appIconPath(appPath)
  if (!iconPath) {
    return null
  }

  try {
    return iconDataUrlFromIcns(iconPath)
  } catch {
    return null
  }
}

function getDirectoryOpenTargets(): DirectoryOpenTarget[] {
  const finderPath = '/System/Library/CoreServices/Finder.app'
  const targets: DirectoryOpenTarget[] = [{
    id: 'finder',
    label: 'Finder',
    category: 'file-manager',
    appPath: finderPath,
    bundleId: 'com.apple.finder',
    icon: appIconDataUrl(finderPath),
  }]

  for (const candidate of OPEN_APP_CANDIDATES) {
    const appPath = appPathForName(candidate.appName)
    if (!appPath) {
      continue
    }

    targets.push({
      id: candidate.id,
      label: candidate.label,
      category: candidate.category,
      appPath,
      bundleId: appBundleId(appPath),
      icon: appIconDataUrl(appPath),
    })
  }

  return targets
}

function getDirectoryOpenTargetById(id: string) {
  return getDirectoryOpenTargets().find((target) => target.id === id) ?? null
}

function openDirectoryWithTarget(directory: string, target: string) {
  const normalizedDirectory = resolve(expandHomeDirectory(directory))
  const stats = statSync(normalizedDirectory)
  if (!stats.isDirectory()) {
    throw new Error('target is not a directory')
  }

  const openTarget = getDirectoryOpenTargetById(target)
  if (!openTarget) {
    throw new Error('unsupported open target')
  }

  if (openTarget.id === 'finder') {
    if (process.platform === 'darwin') {
      runOpenCommand('open', [normalizedDirectory])
      return
    }

    runOpenCommand(process.platform === 'win32' ? 'explorer' : 'xdg-open', [normalizedDirectory])
    return
  }

  if (process.platform === 'darwin' && openTarget.bundleId) {
    runOpenCommand('open', ['-b', openTarget.bundleId, normalizedDirectory])
    return
  }

  if (process.platform === 'darwin' && openTarget.appPath) {
    runOpenCommand('open', ['-a', openTarget.appPath, normalizedDirectory])
    return
  }

  throw new Error('failed to resolve open target')
}

function getAgentInfoForDirectory(directory: string) {
  const normalizedDirectory = resolve(directory)
  const matchedBuiltIn = [...builtInSkillDirectories()]
    .sort((left, right) => right.path.length - left.path.length)
    .find((candidate) => normalizedDirectory === candidate.path || normalizedDirectory.startsWith(`${candidate.path}/`))

  if (matchedBuiltIn) {
    return {
      agentId: matchedBuiltIn.agentId,
      agentName: matchedBuiltIn.agentName,
    }
  }

  return {
    agentId: 'unknown',
    agentName: '自定义来源',
  }
}

function ensureSkillSourceCanBeChanged(skillDirectory: string) {
  let stats
  try {
    stats = lstatSync(skillDirectory)
  } catch (error) {
    throw new Error(`来源不存在或无法访问：${error instanceof Error ? error.message : String(error)}`)
  }

  if (!stats.isDirectory() && !stats.isSymbolicLink()) {
    throw new Error('目标不是 skill 来源目录。')
  }

  if (!existsSync(resolve(skillDirectory, 'SKILL.md'))) {
    throw new Error('只允许处理包含 SKILL.md 的 skill 来源。')
  }

  const parentDirectory = dirname(skillDirectory)
  let resolvedParentDirectory: string
  try {
    resolvedParentDirectory = realpathSync(parentDirectory)
  } catch (error) {
    throw new Error(`无法确认来源所在目录：${error instanceof Error ? error.message : String(error)}`)
  }

  let resolvedSkillDirectory: string | null = null
  try {
    resolvedSkillDirectory = realpathSync(skillDirectory)
  } catch {
    resolvedSkillDirectory = null
  }

  for (const configuredDirectory of readConfiguredDirectories()) {
    let resolvedConfiguredDirectory: string
    try {
      resolvedConfiguredDirectory = realpathSync(configuredDirectory)
    } catch {
      continue
    }

    if (resolvedSkillDirectory === resolvedConfiguredDirectory) {
      throw new Error('这个来源就是扫描根目录，请先从来源设置中移除。')
    }

    if (
      resolvedParentDirectory === resolvedConfiguredDirectory ||
      resolvedParentDirectory.startsWith(`${resolvedConfiguredDirectory}/`)
    ) {
      return stats
    }
  }

  throw new Error('只允许处理当前已配置扫描目录中的来源。')
}

function ensureRealSkillSource(skillDirectory: string) {
  let stats
  try {
    stats = lstatSync(skillDirectory)
  } catch (error) {
    throw new Error(`来源不存在或无法访问：${error instanceof Error ? error.message : String(error)}`)
  }

  if (stats.isSymbolicLink()) {
    throw new Error('软链接来源不支持分享，请从真实来源操作。')
  }

  ensureSkillSourceCanBeChanged(skillDirectory)
}

function uniqueTrashPath(fileName: string) {
  const trashDirectory = resolve(homedir(), '.Trash')
  mkdirSync(trashDirectory, { recursive: true })
  const original = resolve(trashDirectory, fileName)
  if (!existsSync(original)) {
    return original
  }

  const extensionIndex = fileName.lastIndexOf('.')
  const hasExtension = extensionIndex > 0
  const stem = hasExtension ? fileName.slice(0, extensionIndex) : fileName
  const extension = hasExtension ? fileName.slice(extensionIndex) : ''

  for (let index = 1; ; index += 1) {
    const candidate = resolve(trashDirectory, `${stem} ${index}${extension}`)
    if (!existsSync(candidate)) {
      return candidate
    }
  }
}

function moveSourceToTrash(skillDirectory: string) {
  const fileName = skillDirectory.split('/').filter(Boolean).at(-1)
  if (!fileName) {
    throw new Error('来源目录名称不可用。')
  }

  const destination = uniqueTrashPath(fileName)
  try {
    renameSync(skillDirectory, destination)
  } catch (error) {
    throw new Error(`移动到废纸篓失败：${error instanceof Error ? error.message : String(error)}`)
  }

  return destination
}

function createDirectorySymlink(targetDirectory: string, linkDirectory: string) {
  if (existsSync(linkDirectory)) {
    throw new Error('目标位置已经存在。')
  }

  mkdirSync(dirname(linkDirectory), { recursive: true })
  try {
    symlinkSync(targetDirectory, linkDirectory, 'dir')
  } catch (error) {
    throw new Error(`创建软链接失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

function ensureTargetSourceDirectory(targetSourceDirectory: string) {
  const [normalizedTarget] = normalizeConfiguredDirectories([targetSourceDirectory])
  if (!normalizedTarget) {
    throw new Error('目标 Agent 目录不能为空。')
  }

  if (!readShareTargetDirectories().includes(normalizedTarget)) {
    throw new Error('只能分享到当前已安装或已配置的 Agent 目录。')
  }

  if (!existsSync(targetSourceDirectory)) {
    mkdirSync(targetSourceDirectory, { recursive: true })
    return
  }

  if (!statSync(targetSourceDirectory).isDirectory()) {
    throw new Error('目标 Agent 目录不是文件夹。')
  }

  const resolvedTargetSourceDirectory = realpathSync(targetSourceDirectory)
  for (const configuredDirectory of readConfiguredDirectories()) {
    try {
      if (resolvedTargetSourceDirectory === realpathSync(configuredDirectory)) {
        return
      }
    } catch {
      // Ignore unavailable configured directories.
    }
  }

  throw new Error('只能分享到当前已安装或已配置的 Agent 目录。')
}

function skillRelativeLocation(skillDirectory: string) {
  for (const configuredDirectory of readConfiguredDirectories()) {
    const relativeLocation = relative(configuredDirectory, skillDirectory)
    if (relativeLocation && !relativeLocation.startsWith('..') && !relativeLocation.startsWith('/')) {
      return relativeLocation
    }
  }

  throw new Error('无法确认 skill 在扫描目录中的相对位置。')
}

function skillFileHash(skillDirectory: string) {
  try {
    return stableContentHash(readFileSync(resolve(skillDirectory, 'SKILL.md'), 'utf8'))
  } catch (error) {
    throw new Error(`无法读取 SKILL.md：${error instanceof Error ? error.message : String(error)}`)
  }
}

function createSkillSymlinkForApi(skillDirectory: string, targetSourceDirectory: string) {
  const [normalizedSkillDirectory] = normalizeConfiguredDirectories([skillDirectory])
  const [normalizedTargetSourceDirectory] = normalizeConfiguredDirectories([targetSourceDirectory])
  if (!normalizedSkillDirectory) {
    throw new Error('目录不能为空。')
  }
  if (!normalizedTargetSourceDirectory) {
    throw new Error('目标 Agent 目录不能为空。')
  }

  ensureRealSkillSource(normalizedSkillDirectory)
  ensureTargetSourceDirectory(normalizedTargetSourceDirectory)

  const realSkillDirectory = realpathSync(normalizedSkillDirectory)
  const linkDirectory = resolve(normalizedTargetSourceDirectory, skillRelativeLocation(normalizedSkillDirectory))
  createDirectorySymlink(realSkillDirectory, linkDirectory)
  return loadSkillManagerState()
}

function convertSkillSourceToSymlinkForApi(skillDirectory: string, targetSkillDirectory: string) {
  const [normalizedSkillDirectory] = normalizeConfiguredDirectories([skillDirectory])
  const [normalizedTargetSkillDirectory] = normalizeConfiguredDirectories([targetSkillDirectory])
  if (!normalizedSkillDirectory) {
    throw new Error('目录不能为空。')
  }
  if (!normalizedTargetSkillDirectory) {
    throw new Error('目标 skill 目录不能为空。')
  }

  const stats = ensureSkillSourceCanBeChanged(normalizedSkillDirectory)
  if (stats.isSymbolicLink()) {
    throw new Error('当前来源已经是软链接。')
  }

  ensureSkillSourceCanBeChanged(normalizedTargetSkillDirectory)
  if (skillFileHash(normalizedSkillDirectory) !== skillFileHash(normalizedTargetSkillDirectory)) {
    throw new Error('只有内容完全相同的 skill 才能切换为软链模式。')
  }

  const realTargetDirectory = realpathSync(normalizedTargetSkillDirectory)
  if (realTargetDirectory === realpathSync(normalizedSkillDirectory)) {
    throw new Error('目标已经指向同一个真实目录。')
  }

  const trashedDirectory = moveSourceToTrash(normalizedSkillDirectory)
  try {
    createDirectorySymlink(realTargetDirectory, normalizedSkillDirectory)
  } catch (error) {
    try {
      renameSync(trashedDirectory, normalizedSkillDirectory)
    } catch {
      // Keep the original error; the source remains recoverable in Trash.
    }
    throw error
  }

  return loadSkillManagerState()
}

function migrateSkillToPrimaryRepositoryForApi(skillDirectory: string) {
  const [normalizedSkillDirectory] = normalizeConfiguredDirectories([skillDirectory])
  if (!normalizedSkillDirectory) {
    throw new Error('目录不能为空。')
  }

  ensureRealSkillSource(normalizedSkillDirectory)
  const primary = readPrimarySkillRepository()
  ensureTargetSourceDirectory(primary)

  const realSrc = realpathSync(normalizedSkillDirectory)
  const primaryResolved = realpathSync(primary)
  const norm = (value: string) => value.replace(/\\/g, '/').replace(/\/+$/, '')
  const insidePrimary =
    norm(realSrc) === norm(primaryResolved) || norm(realSrc).startsWith(`${norm(primaryResolved)}/`)
  if (insidePrimary) {
    throw new Error('当前来源已在主仓库目录内，无需迁移。')
  }

  const relativeLocation = skillRelativeLocation(normalizedSkillDirectory)
  const dest = resolve(primary, relativeLocation)

  let destExists = false
  try {
    lstatSync(dest)
    destExists = true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  if (destExists) {
    try {
      if (realpathSync(dest) === realSrc) {
        throw new Error('该 skill 已在主仓库对应该路径。')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('已在主仓库')) {
        throw error
      }
    }
    throw new Error(`主仓库中已存在冲突路径：${dest}`)
  }

  mkdirSync(dirname(dest), { recursive: true })
  try {
    renameSync(normalizedSkillDirectory, dest)
  } catch (error) {
    throw new Error(`移动到主仓库失败：${error instanceof Error ? error.message : String(error)}`)
  }

  const canonicalDest = realpathSync(dest)
  try {
    createDirectorySymlink(canonicalDest, normalizedSkillDirectory)
  } catch (error) {
    renameSync(dest, normalizedSkillDirectory)
    throw error instanceof Error ? error : new Error(String(error))
  }

  return loadSkillManagerState()
}

function exportSkillZipForApi(skillDirectory: string) {
  const [normalizedDirectory] = normalizeConfiguredDirectories([skillDirectory])
  if (!normalizedDirectory) {
    throw new Error('目录不能为空。')
  }

  ensureRealSkillSource(normalizedDirectory)
  const realSkillDirectory = realpathSync(normalizedDirectory)
  const temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'skill-grove-export-'))
  const outputPath = resolve(temporaryDirectory, `${basename(realSkillDirectory) || 'skill'}.zip`)

  try {
    const result = spawnSync('ditto', ['-c', '-k', '--keepParent', realSkillDirectory, outputPath], {
      encoding: 'utf8',
    })

    if (result.error) {
      throw result.error
    }

    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || 'Failed to export ZIP')
    }

    return readFileSync(outputPath)
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }
}

function removeSkillSourceForApi(skillDirectory: string) {
  const [normalizedDirectory] = normalizeConfiguredDirectories([skillDirectory])
  if (!normalizedDirectory) {
    throw new Error('目录不能为空。')
  }

  const stats = ensureSkillSourceCanBeChanged(normalizedDirectory)

  if (stats.isSymbolicLink()) {
    try {
      unlinkSync(normalizedDirectory)
    } catch (error) {
      throw new Error(`移除软链接失败：${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    moveSourceToTrash(normalizedDirectory)
  }

  return loadSkillManagerState()
}

function stableContentHash(input: string) {
  let hash = 0x811c9dc5

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function loadSkillManagerState(): SkillManagerState {
  const userConfiguredDirectories = readUserConfiguredDirectories()
  const disabledScanDirectories = readDisabledScanDirectories()
  const builtInDirectories = getBuiltInDirectoryStates(disabledScanDirectories)
  const configuredDirectories = readConfiguredDirectories()
  const sourceIcons = readSourceIcons()
  const ignoredDirectoryNames = new Set(['cache', 'logs', 'scenarios', '.skills-manager'])
  const discoveredSkillFiles: Array<{ skillFile: string; sourceDirectory: string }> = []

  function collectSkillFiles(directory: string, sourceDirectory: string, activeDirectories = new Set<string>()) {
    let resolvedDirectory = directory
    try {
      resolvedDirectory = realpathSync(directory)
    } catch {
      resolvedDirectory = directory
    }

    if (activeDirectories.has(resolvedDirectory)) {
      return
    }

    const nextActiveDirectories = new Set(activeDirectories)
    nextActiveDirectories.add(resolvedDirectory)

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = resolve(directory, entry.name)

      if (entry.isDirectory()) {
        if (ignoredDirectoryNames.has(entry.name)) {
          continue
        }

        collectSkillFiles(entryPath, sourceDirectory, nextActiveDirectories)
        continue
      }

      if (entry.isSymbolicLink()) {
        let stats
        try {
          stats = statSync(entryPath)
        } catch {
          continue
        }

        if (stats.isDirectory()) {
          if (ignoredDirectoryNames.has(entry.name)) {
            continue
          }

          collectSkillFiles(entryPath, sourceDirectory, nextActiveDirectories)
          continue
        }
      }

      if (entry.name === 'SKILL.md') {
        discoveredSkillFiles.push({ skillFile: entryPath, sourceDirectory })
      }
    }
  }

  for (const configuredDirectory of configuredDirectories) {
    if (!existsSync(configuredDirectory)) {
      continue
    }

    let stats
    try {
      stats = statSync(configuredDirectory)
    } catch {
      continue
    }

    if (!stats.isDirectory()) {
      continue
    }

    collectSkillFiles(configuredDirectory, configuredDirectory)
  }

  const discoveredDirectories = new Set<string>()

  const skills = discoveredSkillFiles
    .map(({ skillFile, sourceDirectory }) => {
      const skillDirectory = dirname(skillFile)
      let resolvedSkillDirectory = skillDirectory
      let resolvedSourceDirectory = sourceDirectory

      try {
        resolvedSkillDirectory = realpathSync(skillDirectory)
      } catch {
        resolvedSkillDirectory = skillDirectory
      }

      try {
        resolvedSourceDirectory = realpathSync(sourceDirectory)
      } catch {
        resolvedSourceDirectory = sourceDirectory
      }
      const agentInfo = getAgentInfoForDirectory(sourceDirectory)
      const agentIcon = sourceIcons[sourceDirectory] ?? sourceIcons[resolvedSourceDirectory] ?? null

      discoveredDirectories.add(sourceDirectory)

      let source: string
      let parsed: ReturnType<typeof matter>
      try {
        source = readFileSync(skillFile, 'utf8')
        parsed = matter(source)
      } catch {
        return null
      }

      const location = relative(sourceDirectory, skillDirectory) || skillDirectory

      return {
        id: `${sourceDirectory}::${skillDirectory}`,
        slug: location,
        name:
          typeof parsed.data.name === 'string'
            ? parsed.data.name.trim()
            : location,
        description:
          typeof parsed.data.description === 'string'
            ? parsed.data.description.trim()
            : '',
        content: parsed.content.trim(),
        location,
        sourceDirectory,
        skillDirectory,
        resolvedSourceDirectory,
        resolvedSkillDirectory,
        contentHash: stableContentHash(source),
        agentId: agentInfo.agentId,
        agentName: agentInfo.agentName,
        agentIcon,
        metadata: parsed.data,
      } satisfies LocalSkill
    })
    .filter((skill): skill is LocalSkill => skill !== null)
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

  return {
    configuredDirectories,
    shareTargetDirectories: shareTargetDirectoriesFromStates(userConfiguredDirectories, builtInDirectories),
    userConfiguredDirectories,
    disabledScanDirectories,
    builtInDirectories,
    discoveredDirectories: Array.from(discoveredDirectories).sort((left, right) =>
      left.localeCompare(right, 'zh-CN')
    ),
    sourceIcons,
    openDirectoryTargets: getDirectoryOpenTargets(),
    primarySkillRepository: readPrimarySkillRepository(),
    skills,
  }
}

async function readRequestJson(req: NodeJS.ReadableStream & {
  on: (event: 'data' | 'end' | 'error', listener: (...args: any[]) => void) => void
}) {
  const chunks: Buffer[] = []

  return await new Promise<unknown>((resolvePromise, rejectPromise) => {
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8')
        resolvePromise(body ? JSON.parse(body) : {})
      } catch (error) {
        rejectPromise(error)
      }
    })

    req.on('error', rejectPromise)
  })
}

function installSkillManagerApi(server: ViteDevServer) {
  server.middlewares.use(async (req, res, next) => {
    const url = req.url?.split('?')[0]

    if (url === `${SKILL_MANAGER_API_BASE}/state` && req.method === 'GET') {
      sendJson(res, 200, loadSkillManagerState())
      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/skill-usage` && req.method === 'GET') {
      sendJson(res, 200, devSkillUsageState())
      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/skill-usage/refresh` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { resolvedSkillDirectories?: unknown }
        const dirs = Array.isArray(body.resolvedSkillDirectories)
          ? body.resolvedSkillDirectories.filter((x): x is string => typeof x === 'string')
          : []
        sendJson(res, 200, {
          version: 1,
          countsBySkillMdPath: {} as Record<string, number>,
          countsBySkillMdPathBySource: {} as Record<string, Record<string, number>>,
          lastScanAt: new Date().toISOString(),
          scanNote:
            dirs.length > 0
              ? `Web preview: ${dirs.length} path(s) for this skill only; desktop app scans Claude Code, Codex, OpenClaw, and Craft Agents transcripts.`
              : 'Web preview: POST resolvedSkillDirectories[] for the current skill.',
        })
      } catch {
        sendJson(res, 200, devSkillUsageState())
      }
      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/directories` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directories?: unknown }
        if (!Array.isArray(body.directories)) {
          sendJson(res, 400, { error: 'directories must be an array' })
          return
        }

        const normalized = normalizeConfiguredDirectories(
          body.directories.filter((directory): directory is string => typeof directory === 'string')
        )

        writeConfiguredDirectories(normalized)
        sendJson(res, 200, loadSkillManagerState())
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update directories',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/directories/scan-enabled` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directory?: unknown; enabled?: unknown }
        if (typeof body.directory !== 'string' || typeof body.enabled !== 'boolean') {
          sendJson(res, 400, { error: 'directory and enabled are required' })
          return
        }

        writeScanDirectoryEnabled(body.directory, body.enabled)
        sendJson(res, 200, loadSkillManagerState())
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update directory scan state',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/primary-repository` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { path?: unknown }
        if (typeof body.path !== 'string') {
          sendJson(res, 400, { error: 'path must be a string' })
          return
        }

        sendJson(res, 200, savePrimarySkillRepositoryForApi(body.path))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update primary repository',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/source-icon` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directory?: unknown; icon?: unknown }
        if (typeof body.directory !== 'string') {
          sendJson(res, 400, { error: 'directory must be a string' })
          return
        }

        const icon = body.icon === null ? null : normalizeSourceIconForDirectory(body.directory, body.icon)
        if (body.icon !== null && !icon) {
          sendJson(res, 400, { error: 'icon must be a dataUrl source icon' })
          return
        }

        writeSourceIcon(body.directory, icon)
        sendJson(res, 200, loadSkillManagerState())
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update source icon',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/open-directory` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directory?: unknown; target?: unknown }
        if (typeof body.directory !== 'string') {
          sendJson(res, 400, { error: 'directory must be a string' })
          return
        }

        if (typeof body.target !== 'string') {
          sendJson(res, 400, { error: 'target must be a string' })
          return
        }

        openDirectoryWithTarget(body.directory, body.target)
        sendJson(res, 200, { ok: true })
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to open directory',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/remove-source` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }

        sendJson(res, 200, removeSkillSourceForApi(body.skillDirectory))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to remove source',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/create-symlink` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown; targetSourceDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }
        if (typeof body.targetSourceDirectory !== 'string') {
          sendJson(res, 400, { error: 'targetSourceDirectory must be a string' })
          return
        }

        sendJson(res, 200, createSkillSymlinkForApi(body.skillDirectory, body.targetSourceDirectory))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to create symlink',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/convert-to-symlink` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown; targetSkillDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }
        if (typeof body.targetSkillDirectory !== 'string') {
          sendJson(res, 400, { error: 'targetSkillDirectory must be a string' })
          return
        }

        sendJson(res, 200, convertSkillSourceToSymlinkForApi(body.skillDirectory, body.targetSkillDirectory))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to convert source',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/migrate-to-primary` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }

        sendJson(res, 200, migrateSkillToPrimaryRepositoryForApi(body.skillDirectory))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to migrate skill',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/export-zip` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }

        const zipBuffer = exportSkillZipForApi(body.skillDirectory)
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Length', String(zipBuffer.byteLength))
        res.end(zipBuffer)
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to export ZIP',
        })
      }

      return
    }

    next()
  })
}

function installSkillManagerPreviewApi(server: PreviewServer) {
  server.middlewares.use(async (req, res, next) => {
    const url = req.url?.split('?')[0]

    if (url === `${SKILL_MANAGER_API_BASE}/state` && req.method === 'GET') {
      sendJson(res, 200, loadSkillManagerState())
      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/skill-usage` && req.method === 'GET') {
      sendJson(res, 200, devSkillUsageState())
      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/skill-usage/refresh` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { resolvedSkillDirectories?: unknown }
        const dirs = Array.isArray(body.resolvedSkillDirectories)
          ? body.resolvedSkillDirectories.filter((x): x is string => typeof x === 'string')
          : []
        sendJson(res, 200, {
          version: 1,
          countsBySkillMdPath: {} as Record<string, number>,
          countsBySkillMdPathBySource: {} as Record<string, Record<string, number>>,
          lastScanAt: new Date().toISOString(),
          scanNote:
            dirs.length > 0
              ? `Web preview: ${dirs.length} path(s) for this skill only; desktop app scans Claude Code, Codex, OpenClaw, and Craft Agents transcripts.`
              : 'Web preview: POST resolvedSkillDirectories[] for the current skill.',
        })
      } catch {
        sendJson(res, 200, devSkillUsageState())
      }
      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/directories` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directories?: unknown }
        if (!Array.isArray(body.directories)) {
          sendJson(res, 400, { error: 'directories must be an array' })
          return
        }

        const normalized = normalizeConfiguredDirectories(
          body.directories.filter((directory): directory is string => typeof directory === 'string')
        )

        writeConfiguredDirectories(normalized)
        sendJson(res, 200, loadSkillManagerState())
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update directories',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/directories/scan-enabled` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directory?: unknown; enabled?: unknown }
        if (typeof body.directory !== 'string' || typeof body.enabled !== 'boolean') {
          sendJson(res, 400, { error: 'directory and enabled are required' })
          return
        }

        writeScanDirectoryEnabled(body.directory, body.enabled)
        sendJson(res, 200, loadSkillManagerState())
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update directory scan state',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/primary-repository` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { path?: unknown }
        if (typeof body.path !== 'string') {
          sendJson(res, 400, { error: 'path must be a string' })
          return
        }

        sendJson(res, 200, savePrimarySkillRepositoryForApi(body.path))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update primary repository',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/source-icon` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directory?: unknown; icon?: unknown }
        if (typeof body.directory !== 'string') {
          sendJson(res, 400, { error: 'directory must be a string' })
          return
        }

        const icon = body.icon === null ? null : normalizeSourceIconForDirectory(body.directory, body.icon)
        if (body.icon !== null && !icon) {
          sendJson(res, 400, { error: 'icon must be a dataUrl source icon' })
          return
        }

        writeSourceIcon(body.directory, icon)
        sendJson(res, 200, loadSkillManagerState())
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update source icon',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/open-directory` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directory?: unknown; target?: unknown }
        if (typeof body.directory !== 'string') {
          sendJson(res, 400, { error: 'directory must be a string' })
          return
        }

        if (typeof body.target !== 'string') {
          sendJson(res, 400, { error: 'target must be a string' })
          return
        }

        openDirectoryWithTarget(body.directory, body.target)
        sendJson(res, 200, { ok: true })
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to open directory',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/remove-source` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }

        sendJson(res, 200, removeSkillSourceForApi(body.skillDirectory))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to remove source',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/create-symlink` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown; targetSourceDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }
        if (typeof body.targetSourceDirectory !== 'string') {
          sendJson(res, 400, { error: 'targetSourceDirectory must be a string' })
          return
        }

        sendJson(res, 200, createSkillSymlinkForApi(body.skillDirectory, body.targetSourceDirectory))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to create symlink',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/convert-to-symlink` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown; targetSkillDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }
        if (typeof body.targetSkillDirectory !== 'string') {
          sendJson(res, 400, { error: 'targetSkillDirectory must be a string' })
          return
        }

        sendJson(res, 200, convertSkillSourceToSymlinkForApi(body.skillDirectory, body.targetSkillDirectory))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to convert source',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/migrate-to-primary` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }

        sendJson(res, 200, migrateSkillToPrimaryRepositoryForApi(body.skillDirectory))
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to migrate skill',
        })
      }

      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/export-zip` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { skillDirectory?: unknown }
        if (typeof body.skillDirectory !== 'string') {
          sendJson(res, 400, { error: 'skillDirectory must be a string' })
          return
        }

        const zipBuffer = exportSkillZipForApi(body.skillDirectory)
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Length', String(zipBuffer.byteLength))
        res.end(zipBuffer)
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to export ZIP',
        })
      }

      return
    }

    next()
  })
}

function skillManagerStatePlugin(): Plugin {
  return {
    name: 'skill-manager-state-plugin',
    resolveId(id) {
      if (id === VIRTUAL_SKILL_MANAGER_STATE) {
        return RESOLVED_VIRTUAL_SKILL_MANAGER_STATE
      }

      return null
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_SKILL_MANAGER_STATE) {
        return null
      }

      return `export const appVersion = ${JSON.stringify(readAppVersion())};
export const skillManagerApiBase = ${JSON.stringify(SKILL_MANAGER_API_BASE)};
export const initialSkillManagerState = ${JSON.stringify(loadSkillManagerState())};`
    },
    configureServer(server) {
      installSkillManagerApi(server)
    },
    configurePreviewServer(server) {
      installSkillManagerPreviewApi(server)
    },
  }
}

export default defineConfig({
  plugins: [skillManagerStatePlugin(), react(), tailwindcss()],
  base: './',
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyDirBeforeWrite: true,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        'skill-manager': resolve(projectRoot, 'index.html'),
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: 5176,
    open: false,
  },
  preview: {
    host: '127.0.0.1',
    port: 5177,
  },
})
