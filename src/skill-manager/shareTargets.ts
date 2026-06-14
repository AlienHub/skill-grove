export function buildAvailableShareTargets(
  targetDirectories: string[],
  currentSourceDirectory: string,
  existingSourceDirectories: string[]
) {
  const unavailableDirectories = new Set([currentSourceDirectory, ...existingSourceDirectories])

  return targetDirectories.filter((directory) => !unavailableDirectories.has(directory))
}

export function toggleShareTargetSelection(
  selectedTargets: string[],
  target: string,
  orderedTargets: string[]
) {
  const selectedSet = new Set(selectedTargets)
  if (selectedSet.has(target)) {
    selectedSet.delete(target)
  } else {
    selectedSet.add(target)
  }

  return orderedTargets.filter((orderedTarget) => selectedSet.has(orderedTarget))
}
