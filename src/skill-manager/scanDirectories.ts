export function directoryScanEnabled(directory: string, disabledScanDirectories: string[]) {
  return !disabledScanDirectories.includes(directory)
}

export function toggleDisabledScanDirectory(
  disabledScanDirectories: string[],
  directory: string,
  enabled: boolean
) {
  const disabledSet = new Set(disabledScanDirectories)
  if (enabled) {
    disabledSet.delete(directory)
  } else {
    disabledSet.add(directory)
  }

  return Array.from(disabledSet)
}

type OptimisticScanState = {
  configuredDirectories: string[]
  disabledScanDirectories: string[]
  userConfiguredDirectories: string[]
  builtInDirectories: Array<{
    directory: string
    installed: boolean
    directoryExists: boolean
    scanEnabled: boolean
  }>
}

export function optimisticScanDirectoryState<TState extends OptimisticScanState>(
  state: TState,
  directory: string,
  enabled: boolean
): TState {
  const disabledScanDirectories = toggleDisabledScanDirectory(
    state.disabledScanDirectories,
    directory,
    enabled
  )
  const disabledSet = new Set(disabledScanDirectories)
  const builtInDirectories = state.builtInDirectories.map((builtInDirectory) =>
    builtInDirectory.directory === directory
      ? {
          ...builtInDirectory,
          scanEnabled: builtInDirectory.installed && builtInDirectory.directoryExists && enabled,
        }
      : builtInDirectory
  )
  const configuredDirectories = [
    ...state.userConfiguredDirectories.filter((userDirectory) => !disabledSet.has(userDirectory)),
    ...builtInDirectories
      .filter((builtInDirectory) => builtInDirectory.scanEnabled)
      .map((builtInDirectory) => builtInDirectory.directory),
  ]

  return {
    ...state,
    configuredDirectories,
    disabledScanDirectories,
    builtInDirectories,
  }
}
