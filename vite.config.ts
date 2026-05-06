import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve, relative } from 'path'
import { fileURLToPath } from 'url'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'fs'
import { homedir } from 'os'
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

type SkillManagerState = {
  configuredDirectories: string[]
  discoveredDirectories: string[]
  sourceIcons: Record<string, SourceIcon>
  skills: LocalSkill[]
}

type SkillManagerConfig = {
  skillDirectories?: unknown
  sourceIcons?: unknown
}

const BUILT_IN_SKILL_DIRECTORIES = [
  { path: resolve(homedir(), '.agents/skills'), agentId: 'agents', agentName: 'Agents' },
  { path: resolve(homedir(), '.codex/skills'), agentId: 'codex', agentName: 'Codex' },
  { path: resolve(homedir(), '.claude/skills'), agentId: 'claude', agentName: 'Claude' },
  { path: resolve(homedir(), '.cursor/skills'), agentId: 'cursor', agentName: 'Cursor' },
  { path: resolve(homedir(), '.config/opencode/skills'), agentId: 'opencode', agentName: 'OpenCode' },
  { path: resolve(homedir(), '.gemini/antigravity/skills'), agentId: 'antigravity', agentName: 'Antigravity' },
  { path: resolve(homedir(), '.config/agents/skills'), agentId: 'amp', agentName: 'Amp' },
  { path: resolve(homedir(), '.kilocode/skills'), agentId: 'kilo_code', agentName: 'Kilo Code' },
  { path: resolve(homedir(), '.roo/skills'), agentId: 'roo_code', agentName: 'Roo Code' },
  { path: resolve(homedir(), '.config/goose/skills'), agentId: 'goose', agentName: 'Goose' },
  { path: resolve(homedir(), '.gemini/skills'), agentId: 'gemini', agentName: 'Gemini' },
  { path: resolve(homedir(), '.copilot/skills'), agentId: 'github_copilot', agentName: 'GitHub Copilot' },
  { path: resolve(homedir(), '.openclaw/skills'), agentId: 'openclaw', agentName: 'OpenClaw' },
  { path: resolve(homedir(), '.factory/skills'), agentId: 'droid', agentName: 'Droid' },
  { path: resolve(homedir(), '.codeium/windsurf/skills'), agentId: 'windsurf', agentName: 'Windsurf' },
  { path: resolve(homedir(), '.trae/skills'), agentId: 'trae', agentName: 'TRAE IDE' },
  { path: resolve(homedir(), '.deepagents/agent/skills'), agentId: 'deepagents', agentName: 'Deep Agents' },
  { path: resolve(homedir(), '.firebender/skills'), agentId: 'firebender', agentName: 'Firebender' },
  { path: resolve(homedir(), '.augment/skills'), agentId: 'augment', agentName: 'Augment' },
  { path: resolve(homedir(), '.bob/skills'), agentId: 'bob', agentName: 'IBM Bob' },
  { path: resolve(homedir(), '.codebuddy/skills'), agentId: 'codebuddy', agentName: 'CodeBuddy' },
  { path: resolve(homedir(), '.commandcode/skills'), agentId: 'command_code', agentName: 'Command Code' },
  { path: resolve(homedir(), '.snowflake/cortex/skills'), agentId: 'cortex', agentName: 'Cortex Code' },
  { path: resolve(homedir(), '.config/crush/skills'), agentId: 'crush', agentName: 'Crush' },
  { path: resolve(homedir(), '.iflow/skills'), agentId: 'iflow', agentName: 'iFlow CLI' },
  { path: resolve(homedir(), '.junie/skills'), agentId: 'junie', agentName: 'Junie' },
  { path: resolve(homedir(), '.kiro/skills'), agentId: 'kiro', agentName: 'Kiro CLI' },
  { path: resolve(homedir(), '.kode/skills'), agentId: 'kode', agentName: 'Kode' },
  { path: resolve(homedir(), '.mcpjam/skills'), agentId: 'mcpjam', agentName: 'MCPJam' },
  { path: resolve(homedir(), '.vibe/skills'), agentId: 'mistral_vibe', agentName: 'Mistral Vibe' },
  { path: resolve(homedir(), '.mux/skills'), agentId: 'mux', agentName: 'Mux' },
  { path: resolve(homedir(), '.neovate/skills'), agentId: 'neovate', agentName: 'Neovate' },
  { path: resolve(homedir(), '.openhands/skills'), agentId: 'openhands', agentName: 'OpenHands' },
  { path: resolve(homedir(), '.pi/agent/skills'), agentId: 'pi', agentName: 'Pi' },
  { path: resolve(homedir(), '.pochi/skills'), agentId: 'pochi', agentName: 'Pochi' },
  { path: resolve(homedir(), '.qoder/skills'), agentId: 'qoder', agentName: 'Qoder' },
  { path: resolve(homedir(), '.qwen/skills'), agentId: 'qwen_code', agentName: 'Qwen Code' },
  { path: resolve(homedir(), '.trae-cn/skills'), agentId: 'trae_cn', agentName: 'TRAE CN' },
  { path: resolve(homedir(), '.zencoder/skills'), agentId: 'zencoder', agentName: 'Zencoder' },
  { path: resolve(homedir(), '.adal/skills'), agentId: 'adal', agentName: 'AdaL' },
  { path: resolve(homedir(), '.hermes/skills'), agentId: 'hermes', agentName: 'Hermes' },
] as const
const SKILL_MANAGER_CONFIG_PATH = resolve(homedir(), '.agents', 'skill-manager.json')
const SKILL_MANAGER_API_BASE = '/__skill_manager__'
const VIRTUAL_SKILL_MANAGER_STATE = 'virtual:skill-manager-state'
const RESOLVED_VIRTUAL_SKILL_MANAGER_STATE = '\0virtual:skill-manager-state'
const projectRoot = dirname(fileURLToPath(import.meta.url))

function sendJson(res: NodeJS.WritableStream & {
  statusCode?: number
  setHeader?: (name: string, value: string) => void
  end: (chunk?: string) => void
}, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
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

function existingBuiltInDirectories() {
  return BUILT_IN_SKILL_DIRECTORIES
    .map((directory) => directory.path)
    .filter((directory) => {
      try {
        return existsSync(directory) && statSync(directory).isDirectory()
      } catch {
        return false
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

function readConfiguredDirectories() {
  const config = readSkillManagerConfig()
  const configuredDirectories = Array.isArray(config.skillDirectories)
    ? config.skillDirectories.filter((directory): directory is string => typeof directory === 'string')
    : []

  return normalizeConfiguredDirectories([...configuredDirectories, ...existingBuiltInDirectories()])
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

function normalizeSourceIconForDirectory(directory: string, icon: unknown) {
  return normalizeSourceIcons({ [directory]: icon })[normalizeConfiguredDirectories([directory])[0] ?? directory]
}

function writeSkillManagerConfig(config: { skillDirectories: string[]; sourceIcons: Record<string, SourceIcon> }) {
  mkdirSync(dirname(SKILL_MANAGER_CONFIG_PATH), { recursive: true })
  writeFileSync(
    SKILL_MANAGER_CONFIG_PATH,
    JSON.stringify(config, null, 2),
    'utf8'
  )
}

function writeConfiguredDirectories(directories: string[]) {
  writeSkillManagerConfig({
    skillDirectories: normalizeConfiguredDirectories(directories),
    sourceIcons: readSourceIcons(),
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
    skillDirectories: readConfiguredDirectories(),
    sourceIcons,
  })
}

function getAgentInfoForDirectory(directory: string) {
  const normalizedDirectory = resolve(directory)
  const matchedBuiltIn = [...BUILT_IN_SKILL_DIRECTORIES]
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

function stableContentHash(input: string) {
  let hash = 0x811c9dc5

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function loadSkillManagerState(): SkillManagerState {
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
    discoveredDirectories: Array.from(discoveredDirectories).sort((left, right) =>
      left.localeCompare(right, 'zh-CN')
    ),
    sourceIcons,
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

      return `export const skillManagerApiBase = ${JSON.stringify(SKILL_MANAGER_API_BASE)};
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
