import {
  type UpdateCheckState,
  type UpdateCheckStatus,
  type UpdateInstallStatus,
} from '../../skill-manager/types'
import { useAppPreferences } from '../../skill-manager/preferences'

function formatCheckedAt(value: string, locale: string) {
  const checkedAt = new Date(value)
  if (Number.isNaN(checkedAt.getTime())) {
    return null
  }

  return checkedAt.toLocaleString(locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VersionUpdatePanel({
  currentVersion,
  updateCheck,
  updateCheckError,
  updateCheckStatus,
  updateInstallError,
  updateInstallStatus,
  onCheckForUpdates,
  onInstallUpdate,
  onOpenExternalUrl,
}: {
  currentVersion: string
  updateCheck: UpdateCheckState | null
  updateCheckError: string | null
  updateCheckStatus: UpdateCheckStatus
  updateInstallError: string | null
  updateInstallStatus: UpdateInstallStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
  onOpenExternalUrl: (url: string) => void
}) {
  const { language, t } = useAppPreferences()
  const isChecking = updateCheckStatus === 'checking'
  const isInstalling = updateInstallStatus === 'installing'
  const latestVersion = updateCheck?.latestVersion ? `v${updateCheck.latestVersion}` : null
  const checkedAt = updateCheck ? formatCheckedAt(updateCheck.checkedAt, language) : null
  const handleOpenRelease = () => {
    if (updateCheck?.releaseUrl) {
      onOpenExternalUrl(updateCheck.releaseUrl)
    }
  }
  const statusText = (() => {
    if (isChecking) {
      return t('updates.checking')
    }

    if (updateCheckStatus === 'error') {
      return updateCheckError ?? t('updates.error')
    }

    if (updateCheck?.hasUpdate && latestVersion) {
      return t('updates.found', { version: latestVersion })
    }

    if (updateCheckStatus === 'ready') {
      return t('updates.latest')
    }

    return t('updates.waiting')
  })()
  const versionStatusText = updateCheckStatus === 'idle' ? null : statusText

  return (
    <section>
      <h3 className="mb-4 text-[14px] font-semibold text-foreground">{t('updates.about')}</h3>

      <div className="overflow-hidden rounded-[8px] border border-border/50 bg-[var(--surface)] shadow-minimal-flat">
        <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
          <div className="text-[14px] font-semibold text-foreground">{t('updates.version')}</div>
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right">
            <span className="text-[14px] font-medium text-foreground/48">v{currentVersion}</span>
            {versionStatusText ? (
              <span className="text-[12px] text-foreground/42">· {versionStatusText}</span>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-border/45 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-foreground">{t('updates.checkUpdates')}</div>
            <div className="mt-1 text-[12px] text-foreground/48">
              {checkedAt ? t('updates.lastChecked', { checkedAt }) : t('updates.autoCheckHint')}
            </div>
            {updateInstallStatus === 'error' && updateInstallError ? (
              <div className="mt-1 text-[12px] text-red-500/80">{updateInstallError}</div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {updateCheck?.hasUpdate ? (
              <>
                <button
                  className="cursor-pointer rounded-[8px] bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={isInstalling}
                  onClick={onInstallUpdate}
                  type="button"
                >
                  {isInstalling ? t('updates.installing') : t('updates.install')}
                </button>
                {updateCheck.releaseUrl ? (
                  <button
                    className="cursor-pointer rounded-[8px] border border-border/50 bg-[var(--surface)] px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5"
                    onClick={handleOpenRelease}
                    type="button"
                  >
                    {t('updates.openRelease')}
                  </button>
                ) : null}
              </>
            ) : (
              <button
                className="cursor-pointer rounded-[8px] border border-border/60 bg-[var(--surface)] px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:text-foreground/35"
                disabled={isChecking}
                onClick={onCheckForUpdates}
                type="button"
              >
                {isChecking ? t('common.checking') : t('updates.checkNow')}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
