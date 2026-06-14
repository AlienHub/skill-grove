import { describe, expect, test } from 'bun:test'
import {
  directoryScanEnabled,
  optimisticScanDirectoryState,
  toggleDisabledScanDirectory,
} from './scanDirectories'

describe('toggleDisabledScanDirectory', () => {
  test('disables and re-enables a normalized directory', () => {
    const disabled = toggleDisabledScanDirectory(['/codex'], '/claude', false)

    expect(disabled).toEqual(['/codex', '/claude'])
    expect(toggleDisabledScanDirectory(disabled, '/claude', true)).toEqual(['/codex'])
  })
})

describe('directoryScanEnabled', () => {
  test('treats a directory as enabled unless it is disabled', () => {
    expect(directoryScanEnabled('/codex', ['/claude'])).toBe(true)
    expect(directoryScanEnabled('/claude', ['/claude'])).toBe(false)
  })
})

describe('optimisticScanDirectoryState', () => {
  test('updates only the toggled directory without requiring a full reload first', () => {
    const state = {
      configuredDirectories: ['/custom', '/codex', '/claude'],
      disabledScanDirectories: [] as string[],
      userConfiguredDirectories: ['/custom'],
      builtInDirectories: [
        {
          directory: '/codex',
          installed: true,
          directoryExists: true,
          scanEnabled: true,
        },
        {
          directory: '/claude',
          installed: true,
          directoryExists: true,
          scanEnabled: true,
        },
      ],
    }

    expect(optimisticScanDirectoryState(state, '/codex', false)).toEqual({
      configuredDirectories: ['/custom', '/claude'],
      disabledScanDirectories: ['/codex'],
      userConfiguredDirectories: ['/custom'],
      builtInDirectories: [
        {
          directory: '/codex',
          installed: true,
          directoryExists: true,
          scanEnabled: false,
        },
        {
          directory: '/claude',
          installed: true,
          directoryExists: true,
          scanEnabled: true,
        },
      ],
    })
  })
})
