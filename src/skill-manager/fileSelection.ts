export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolvePromise, rejectPromise) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolvePromise(reader.result)
        return
      }

      rejectPromise(new Error('Failed to read icon file'))
    }
    reader.onerror = () => rejectPromise(reader.error ?? new Error('Failed to read icon file'))
    reader.readAsDataURL(file)
  })
}

export function normalizeSelectedDirectoryPath(path: string, webkitRelativePath?: string) {
  if (!path) {
    return ''
  }

  if (!webkitRelativePath) {
    return path
  }

  const normalizedFilePath = path.replace(/\\/g, '/')
  const normalizedRelativePath = webkitRelativePath.replace(/\\/g, '/')
  const rootDirectoryName = normalizedRelativePath.split('/')[0]
  if (!rootDirectoryName) {
    return path
  }

  const marker = `/${rootDirectoryName}/`
  const markerIndex = normalizedFilePath.indexOf(marker)

  if (markerIndex === -1) {
    return path
  }

  return normalizedFilePath.slice(0, markerIndex + rootDirectoryName.length + 1)
}
