import { invoke } from '@tauri-apps/api/core'
import { appVersion, skillManagerApiBase } from 'virtual:skill-manager-state'
import {
  type DirectoryOpenTarget,
  type SkillManagerState,
  type SkillUsageSnapshot,
  type SourceIcon,
  type UpdateCheckState,
} from './types'

export type OpenDirectoryTarget = DirectoryOpenTarget['id']

const GITHUB_LATEST_RELEASE_URL = 'https://api.github.com/repos/AlienHub/skill-grove/releases/latest'

type GitHubReleaseAsset = {
  name?: unknown
  browser_download_url?: unknown
}

type GitHubRelease = {
  tag_name?: unknown
  name?: unknown
  html_url?: unknown
  body?: unknown
  assets?: unknown
}

function normalizeVersion(version: string) {
  return version.trim().replace(/^v/i, '')
}

function versionSegments(version: string) {
  const numericParts = normalizeVersion(version).match(/\d+/g)
  return numericParts ? numericParts.slice(0, 4).map((part) => Number.parseInt(part, 10)) : [0]
}

function compareVersions(leftVersion: string, rightVersion: string) {
  const leftSegments = versionSegments(leftVersion)
  const rightSegments = versionSegments(rightVersion)
  const segmentCount = Math.max(leftSegments.length, rightSegments.length)

  for (let index = 0; index < segmentCount; index += 1) {
    const leftValue = leftSegments[index] ?? 0
    const rightValue = rightSegments[index] ?? 0

    if (leftValue > rightValue) {
      return 1
    }

    if (leftValue < rightValue) {
      return -1
    }
  }

  return 0
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function releaseAssets(value: unknown) {
  return Array.isArray(value) ? (value as GitHubReleaseAsset[]) : []
}

function preferredReleaseAsset(assets: GitHubReleaseAsset[]) {
  const supportedAssets = assets
    .map((asset) => ({
      name: stringValue(asset.name),
      url: stringValue(asset.browser_download_url),
    }))
    .filter((asset): asset is { name: string; url: string } => Boolean(asset.name && asset.url))

  return supportedAssets.find((asset) => asset.name.toLowerCase().endsWith('.dmg')) ?? supportedAssets[0] ?? null
}

function safeZipFileName(value: string) {
  const name = value
    .trim()
    .replace(/\.zip$/i, '')
    .replace(/[/:*?"<>|\\]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${name || 'skill'}.zip`
}

async function responseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: unknown }
    return typeof body.error === 'string' && body.error.trim() ? body.error.trim() : fallback
  } catch {
    return fallback
  }
}

export async function fetchSkillManagerState() {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('load_skill_manager_state')
  }

  const response = await fetch(`${skillManagerApiBase}/state`)
  if (!response.ok) {
    throw new Error('Failed to load skill manager state')
  }

  return (await response.json()) as SkillManagerState
}

function emptyDevSkillUsage(): SkillUsageSnapshot {
  return {
    version: 1,
    countsBySkillMdPath: {},
    countsBySkillMdPathBySource: {},
    countsByDayBySource: {},
    lastScanAt: null,
    scanNote: null,
  }
}

export async function loadSkillUsageState() {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillUsageSnapshot>('load_skill_usage_state')
  }

  const response = await fetch(`${skillManagerApiBase}/skill-usage`)
  if (!response.ok) {
    return emptyDevSkillUsage()
  }

  return (await response.json()) as SkillUsageSnapshot
}

export async function refreshSkillUsage(resolvedSkillDirectories: string[]) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillUsageSnapshot>('refresh_skill_usage', { resolvedSkillDirectories })
  }

  const response = await fetch(`${skillManagerApiBase}/skill-usage/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resolvedSkillDirectories }),
  })
  if (!response.ok) {
    return emptyDevSkillUsage()
  }

  return (await response.json()) as SkillUsageSnapshot
}

export async function saveConfiguredDirectories(directories: string[]) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_configured_directories', { directories })
  }

  const response = await fetch(`${skillManagerApiBase}/directories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directories }),
  })

  if (!response.ok) {
    throw new Error('Failed to update configured directories')
  }

  return (await response.json()) as SkillManagerState
}

export async function saveScanDirectoryEnabled(directory: string, enabled: boolean) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_scan_directory_enabled', { directory, enabled })
  }

  const response = await fetch(`${skillManagerApiBase}/directories/scan-enabled`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directory, enabled }),
  })

  if (!response.ok) {
    throw new Error('Failed to update directory scan state')
  }

  return (await response.json()) as SkillManagerState
}

export async function savePrimarySkillRepository(path: string) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_primary_skill_repository', { path })
  }

  const response = await fetch(`${skillManagerApiBase}/primary-repository`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  })

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to update primary skill repository'))
  }

  return (await response.json()) as SkillManagerState
}

export async function saveSourceIcon(directory: string, icon: SourceIcon | null) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_source_icon', { directory, icon })
  }

  const response = await fetch(`${skillManagerApiBase}/source-icon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directory, icon }),
  })

  if (!response.ok) {
    throw new Error('Failed to update source icon')
  }

  return (await response.json()) as SkillManagerState
}

export async function openSkillDirectory(directory: string, target: OpenDirectoryTarget) {
  if ('__TAURI_INTERNALS__' in window) {
    await invoke('open_skill_directory', { directory, target })
    return
  }

  const response = await fetch(`${skillManagerApiBase}/open-directory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directory, target }),
  })

  if (!response.ok) {
    throw new Error('Failed to open directory')
  }
}

export async function removeSkillSource(skillDirectory: string) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('remove_skill_source', { skillDirectory })
  }

  const response = await fetch(`${skillManagerApiBase}/remove-source`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skillDirectory }),
  })

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to remove source'))
  }

  return (await response.json()) as SkillManagerState
}

export async function createSkillSymlink(skillDirectory: string, targetSourceDirectory: string) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('create_skill_symlink', { skillDirectory, targetSourceDirectory })
  }

  const response = await fetch(`${skillManagerApiBase}/create-symlink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skillDirectory, targetSourceDirectory }),
  })

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to create symlink'))
  }

  return (await response.json()) as SkillManagerState
}

export async function convertSkillSourceToSymlink(skillDirectory: string, targetSkillDirectory: string) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('convert_skill_source_to_symlink', { skillDirectory, targetSkillDirectory })
  }

  const response = await fetch(`${skillManagerApiBase}/convert-to-symlink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skillDirectory, targetSkillDirectory }),
  })

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to convert source'))
  }

  return (await response.json()) as SkillManagerState
}

export async function migrateSkillToPrimaryRepository(skillDirectory: string) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('migrate_skill_to_primary_repository', { skillDirectory })
  }

  const response = await fetch(`${skillManagerApiBase}/migrate-to-primary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skillDirectory }),
  })

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to migrate skill to primary repository'))
  }

  return (await response.json()) as SkillManagerState
}

export async function exportSkillZip(skillDirectory: string, fileName: string) {
  const downloadName = safeZipFileName(fileName)

  if ('__TAURI_INTERNALS__' in window) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const outputPath = await save({
      title: 'Export Skill ZIP',
      defaultPath: downloadName,
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
    })

    if (!outputPath) {
      return false
    }

    await invoke('export_skill_zip', { skillDirectory, outputPath })
    return true
  }

  const response = await fetch(`${skillManagerApiBase}/export-zip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skillDirectory }),
  })

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to export ZIP'))
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = downloadName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
  return true
}

export async function openExternalUrl(url: string) {
  if ('__TAURI_INTERNALS__' in window) {
    await invoke('open_external_url', { url })
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function installUpdateAndRelaunch() {
  if (!('__TAURI_INTERNALS__' in window)) {
    throw new Error('Automatic updates are only available in the desktop app')
  }

  const [{ check: checkUpdater }, { relaunch }] = await Promise.all([
    import('@tauri-apps/plugin-updater'),
    import('@tauri-apps/plugin-process'),
  ])
  const update = await checkUpdater()

  if (!update) {
    throw new Error('No signed updater package is available')
  }

  await update.downloadAndInstall()
  await relaunch()
}

export async function checkForUpdates(): Promise<UpdateCheckState> {
  const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to check GitHub releases')
  }

  const release = (await response.json()) as GitHubRelease
  const latestTag = stringValue(release.tag_name)
  const latestVersion = latestTag ? normalizeVersion(latestTag) : null
  const asset = preferredReleaseAsset(releaseAssets(release.assets))

  return {
    currentVersion: appVersion,
    latestVersion,
    latestTag,
    releaseName: stringValue(release.name),
    releaseUrl: stringValue(release.html_url),
    releaseNotes: stringValue(release.body) ?? '',
    assetName: asset?.name ?? null,
    assetUrl: asset?.url ?? null,
    hasUpdate: latestVersion ? compareVersions(latestVersion, appVersion) > 0 : false,
    checkedAt: new Date().toISOString(),
  }
}
