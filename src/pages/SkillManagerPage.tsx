import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { appVersion, initialSkillManagerState } from 'virtual:skill-manager-state'
import { AgentSkillConfigPanel } from '../components/skill-manager/AgentSkillConfigPanel'
import { AppSettingsPanel } from '../components/skill-manager/AppSettingsPanel'
import { ApplicationDetailPanel, ApplicationSidebar } from '../components/skill-manager/ApplicationView'
import { LibraryHomePanel } from '../components/skill-manager/LibraryHomePanel'
import { PrimaryNavigationRail } from '../components/skill-manager/PrimaryNavigationRail'
import { SkillDetailPanel } from '../components/skill-manager/SkillDetailPanel'
import { SkillSidebar } from '../components/skill-manager/SkillSidebar'
import {
  checkForUpdates,
  fetchSkillManagerState,
  installUpdateAndRelaunch,
  loadSkillUsageState,
  openExternalUrl,
  refreshSkillUsage,
  removeSkillSource,
  createSkillSymlink,
  exportSkillZip,
  saveConfiguredDirectories,
  savePrimarySkillRepository,
  saveScanDirectoryEnabled,
  saveSourceIcon,
  convertSkillSourceToSymlink,
  migrateSkillToPrimaryRepository,
} from '../skill-manager/api'
import { buildSkillGroups } from '../skill-manager/skillGrouping'
import { useAppPreferences } from '../skill-manager/preferences'
import {
  readLibraryActivity,
  recordRecentlyViewedSkill,
  sortSkillGroupsByActivity,
  togglePinnedSkill,
  writeLibraryActivity,
  type LibraryActivityState,
} from '../skill-manager/libraryActivity'
import {
  groupMatchesLibraryFilter,
  readAndStoreLibraryVisitState,
} from '../skill-manager/libraryInsights'
import { resolvedSkillDirectoriesForStartupScan } from '../skill-manager/startupScan'
import { buildAgentCatalogProfiles } from '../skill-manager/catalogProfiles'
import { optimisticScanDirectoryState } from '../skill-manager/scanDirectories'
import {
  type AgentCatalogProfile,
  type Skill,
  type LibraryFilter,
  type LibraryVisitState,
  type SkillGroup,
  type SkillManagerState,
  type SkillUsageSnapshot,
  type SourceIcon,
  type UpdateCheckState,
  type UpdateCheckStatus,
  type UpdateInstallStatus,
} from '../skill-manager/types'

type SelectedPanel = 'home' | 'skill' | 'app' | 'agent-skill-config' | 'settings'

const emptySkillUsage: SkillUsageSnapshot = {
  version: 1,
  countsBySkillMdPath: {},
  countsBySkillMdPathBySource: {},
  countsByDayBySource: {},
  lastScanAt: null,
  scanNote: null,
}

const emptyLibraryVisitState: LibraryVisitState = {
  capturedAt: null,
  previousCapturedAt: null,
  hasPreviousSnapshot: false,
  changes: [],
  changesBySkillId: {},
  suggestions: [],
  suggestionsBySkillId: {},
}

const emptyLibraryActivityState: LibraryActivityState = {
  pinnedSkillIds: [],
  recentlyViewedSkillIds: [],
}

function filterSkillGroups(
  skillGroups: SkillGroup[],
  queryValue: string,
  activeFilter: LibraryFilter,
  visitState: LibraryVisitState
) {
  const query = queryValue.trim().toLowerCase()
  const filterMatchedGroups = skillGroups.filter((group) =>
    groupMatchesLibraryFilter(group, activeFilter, visitState)
  )

  if (!query) {
    return filterMatchedGroups
  }

  return filterMatchedGroups.filter((group) => {
    const haystack = group.skills
      .map((skill) => `${skill.name} ${skill.slug} ${skill.description} ${skill.location} ${skill.sourceDirectory}`)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

function resolvedSkillDirectoriesForGroup(group: SkillGroup) {
  return [...new Set(group.skills.map((skill) => skill.resolvedSkillDirectory))]
}

export function SkillManagerPage() {
  const { t } = useAppPreferences()
  const isTauriWindow = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
  const [skillState, setSkillState] = useState<SkillManagerState>(initialSkillManagerState)
  const [hasLoadedSkillState, setHasLoadedSkillState] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    initialSkillManagerState.skills[0]?.id ?? null
  )
  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel>('home')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [isPrimaryNavCollapsed, setIsPrimaryNavCollapsed] = useState(false)
  const [isSavingDirectories, setIsSavingDirectories] = useState(false)
  const [pendingScanDirectory, setPendingScanDirectory] = useState<string | null>(null)
  const [directoryFeedbackMessage, setDirectoryFeedbackMessage] = useState<string | null>(null)
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [activeLibraryFilter, setActiveLibraryFilter] = useState<LibraryFilter>('all')
  const [libraryVisitState, setLibraryVisitState] = useState<LibraryVisitState>(emptyLibraryVisitState)
  const [libraryActivity, setLibraryActivity] = useState<LibraryActivityState>(emptyLibraryActivityState)
  const [updateCheckStatus, setUpdateCheckStatus] = useState<UpdateCheckStatus>('idle')
  const [updateCheckState, setUpdateCheckState] = useState<UpdateCheckState | null>(null)
  const [updateCheckError, setUpdateCheckError] = useState<string | null>(null)
  const [updateInstallStatus, setUpdateInstallStatus] = useState<UpdateInstallStatus>('idle')
  const [updateInstallError, setUpdateInstallError] = useState<string | null>(null)
  const [isSavingPrimaryRepository, setIsSavingPrimaryRepository] = useState(false)
  const [primaryRepositoryError, setPrimaryRepositoryError] = useState<string | null>(null)
  const [skillUsage, setSkillUsage] = useState<SkillUsageSnapshot>(emptySkillUsage)
  const [usageRefreshing, setUsageRefreshing] = useState(false)
  const [hasLoadedSkillUsageState, setHasLoadedSkillUsageState] = useState(false)
  const startupUsageScanStarted = useRef(false)
  const autoScannedUsageKeys = useRef(new Set<string>())
  const lastSkillDataRefreshAt = useRef(0)

  const skillGroups = useMemo(
    () => sortSkillGroupsByActivity(buildSkillGroups(skillState.skills), libraryActivity),
    [libraryActivity, skillState.skills]
  )
  const catalogProfiles: AgentCatalogProfile[] = useMemo(
    () => buildAgentCatalogProfiles(skillState.skills),
    [skillState.skills]
  )
  const selectedAppProfile = useMemo(
    () => catalogProfiles.find((profile) => profile.agentId === selectedAppId) ?? catalogProfiles[0] ?? null,
    [catalogProfiles, selectedAppId]
  )
  const skillGroupsBySkillId = useMemo(() => {
    const groupsBySkillId = new Map<string, SkillGroup>()

    for (const group of skillGroups) {
      for (const skill of group.skills) {
        groupsBySkillId.set(skill.id, group)
      }
    }

    return groupsBySkillId
  }, [skillGroups])
  const skillsById = useMemo(() => new Map(skillState.skills.map((skill) => [skill.id, skill])), [skillState.skills])
  const multiSourceGroupCount = useMemo(
    () => skillGroups.filter((group) => group.sourceCount > 1).length,
    [skillGroups]
  )
  const filteredSkillGroups = useMemo(
    () => filterSkillGroups(skillGroups, skillSearchQuery, activeLibraryFilter, libraryVisitState),
    [activeLibraryFilter, libraryVisitState, skillGroups, skillSearchQuery]
  )
  const hasPendingUpdate = Boolean(updateCheckState?.hasUpdate)
  const hasPrimaryNav = selectedPanel !== 'home'
  const hasContextSidebar = selectedPanel === 'skill' || selectedPanel === 'app'

  const selectedSkillGroup = useMemo(
    () =>
      skillGroups.find((group) => group.skills.some((skill) => skill.id === selectedSkillId)) ??
      skillGroups[0] ??
      null,
    [selectedSkillId, skillGroups]
  )

  const selectedSkill = useMemo(
    () =>
      selectedSkillGroup?.skills.find((skill) => skill.id === selectedSkillId) ??
      selectedSkillGroup?.primarySkill ??
      null,
    [selectedSkillGroup, selectedSkillId]
  )

  useEffect(() => {
    let isMounted = true

    lastSkillDataRefreshAt.current = Date.now()
    fetchSkillManagerState()
      .then((state) => {
        if (!isMounted) {
          return
        }

        setSkillState(state)
        setHasLoadedSkillState(true)
      })
      .catch(() => {
        // Keep build-time fallback state when the API is unavailable.
        if (isMounted) {
          setHasLoadedSkillState(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isTauriWindow) {
      return
    }

    let isMounted = true
    const refreshSkillDataOnAppOpen = () => {
      if (document.visibilityState === 'hidden') {
        return
      }

      const now = Date.now()
      if (now - lastSkillDataRefreshAt.current < 2000) {
        return
      }

      lastSkillDataRefreshAt.current = now
      fetchSkillManagerState()
        .then((state) => {
          if (isMounted) {
            setSkillState(state)
            setHasLoadedSkillState(true)
          }
        })
        .catch((error) => {
          console.warn('Failed to refresh skill data on app open', error)
        })
    }

    window.addEventListener('focus', refreshSkillDataOnAppOpen)
    document.addEventListener('visibilitychange', refreshSkillDataOnAppOpen)

    return () => {
      isMounted = false
      window.removeEventListener('focus', refreshSkillDataOnAppOpen)
      document.removeEventListener('visibilitychange', refreshSkillDataOnAppOpen)
    }
  }, [isTauriWindow])

  useEffect(() => {
    let isMounted = true

    loadSkillUsageState()
      .then((usage) => {
        if (isMounted) {
          setSkillUsage(usage)
        }
      })
      .catch(() => {
        if (isMounted) {
          setSkillUsage(emptySkillUsage)
        }
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedSkillUsageState(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (
      !isTauriWindow ||
      !hasLoadedSkillState ||
      !hasLoadedSkillUsageState ||
      startupUsageScanStarted.current
    ) {
      return
    }

    const resolvedSkillDirectories = resolvedSkillDirectoriesForStartupScan(skillState.skills)
    if (!resolvedSkillDirectories.length) {
      return
    }

    startupUsageScanStarted.current = true
    let isMounted = true

    setUsageRefreshing(true)
    refreshSkillUsage(resolvedSkillDirectories)
      .then((next) => {
        if (isMounted) {
          setSkillUsage(next)
        }

        for (const group of skillGroups) {
          const scanKey = [...resolvedSkillDirectoriesForGroup(group)].sort().join('\n')
          if (scanKey) {
            autoScannedUsageKeys.current.add(scanKey)
          }
        }
      })
      .catch((error) => {
        console.warn('Failed to refresh skill usage on startup', error)
      })
      .finally(() => {
        if (isMounted) {
          setUsageRefreshing(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [hasLoadedSkillState, hasLoadedSkillUsageState, isTauriWindow, skillGroups, skillState.skills])

  useEffect(() => {
    setLibraryActivity(readLibraryActivity())
  }, [])

  useEffect(() => {
    if (!isTauriWindow || selectedPanel !== 'skill' || !selectedSkillGroup?.skills.length) {
      return
    }

    const resolvedSkillDirectories = resolvedSkillDirectoriesForGroup(selectedSkillGroup)
    const scanKey = [...resolvedSkillDirectories].sort().join('\n')
    if (!scanKey || autoScannedUsageKeys.current.has(scanKey)) {
      return
    }

    autoScannedUsageKeys.current.add(scanKey)
    let isMounted = true

    setUsageRefreshing(true)
    refreshSkillUsage(resolvedSkillDirectories)
      .then((next) => {
        if (isMounted) {
          setSkillUsage(next)
        }
      })
      .catch((error) => {
        console.warn('Failed to auto refresh skill usage', error)
      })
      .finally(() => {
        if (isMounted) {
          setUsageRefreshing(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isTauriWindow, selectedPanel, selectedSkillGroup])

  useEffect(() => {
    if (!hasLoadedSkillState) {
      return
    }

    setLibraryVisitState(readAndStoreLibraryVisitState(skillGroups))
  }, [hasLoadedSkillState, skillGroups])

  const handleCheckForUpdates = useCallback(async () => {
    setUpdateCheckStatus('checking')
    setUpdateCheckError(null)

    try {
      const nextUpdateCheck = await checkForUpdates()
      setUpdateCheckState(nextUpdateCheck)
      setUpdateCheckStatus('ready')
    } catch {
      setUpdateCheckStatus('error')
      setUpdateCheckError(t('updates.connectionError'))
    }
  }, [t])

  const handleOpenExternalUrl = useCallback((url: string) => {
    void openExternalUrl(url)
  }, [])

  const handleSavePrimaryRepository = useCallback(
    async (path: string) => {
      setPrimaryRepositoryError(null)
      setIsSavingPrimaryRepository(true)
      try {
        const nextState = await savePrimarySkillRepository(path)
        setSkillState(nextState)
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : t('settings.primaryRepositorySaveFailed')
        setPrimaryRepositoryError(message)
      } finally {
        setIsSavingPrimaryRepository(false)
      }
    },
    [t]
  )

  const handleInstallUpdate = useCallback(async () => {
    setUpdateInstallStatus('installing')
    setUpdateInstallError(null)

    try {
      await installUpdateAndRelaunch()
    } catch {
      setUpdateInstallStatus('error')
      setUpdateInstallError(t('updates.installError'))
    }
  }, [t])

  useEffect(() => {
    void handleCheckForUpdates()
  }, [handleCheckForUpdates])

  useEffect(() => {
    if (selectedPanel !== 'skill') {
      return
    }

    if (
      !selectedSkillId ||
      !skillGroups.some((group) => group.skills.some((skill) => skill.id === selectedSkillId))
    ) {
      setSelectedSkillId(skillGroups[0]?.primarySkill.id ?? null)
    }
  }, [selectedPanel, selectedSkillId, skillGroups])

  useEffect(() => {
    if (selectedPanel !== 'app') {
      return
    }

    if (!selectedAppId || !catalogProfiles.some((profile) => profile.agentId === selectedAppId)) {
      setSelectedAppId(catalogProfiles[0]?.agentId ?? null)
    }
  }, [catalogProfiles, selectedAppId, selectedPanel])

  const updateDirectories = async (directories: string[]) => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(null)
    try {
      const nextState = await saveConfiguredDirectories(directories)
      setSkillState(nextState)
    } finally {
      setIsSavingDirectories(false)
    }
  }

  const handleRefresh = async () => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(null)
    try {
      const nextState = await fetchSkillManagerState()
      setSkillState(nextState)
    } finally {
      setIsSavingDirectories(false)
    }
  }

  const handleRemoveDirectory = async (directory: string) => {
    await updateDirectories(
      skillState.userConfiguredDirectories.filter((configuredDirectory) => configuredDirectory !== directory)
    )
  }

  const handleChooseDirectory = async (directory: string) => {
    if (!directory) {
      setDirectoryFeedbackMessage(t('directories.noFolderPath'))
      return
    }

    setDirectoryFeedbackMessage(t('directories.selectedFolder', { directory }))
    await updateDirectories([...skillState.userConfiguredDirectories, directory])
  }

  const handleSetDirectoryScanEnabled = async (directory: string, enabled: boolean) => {
    const previousState = skillState
    setPendingScanDirectory(directory)
    setDirectoryFeedbackMessage(null)
    setSkillState((currentState) => optimisticScanDirectoryState(currentState, directory, enabled))

    try {
      const nextState = await saveScanDirectoryEnabled(directory, enabled)
      setSkillState(nextState)
    } catch (error) {
      setSkillState(previousState)
      setDirectoryFeedbackMessage(error instanceof Error ? error.message : t('directories.scanToggleFailed'))
    } finally {
      setPendingScanDirectory(null)
    }
  }

  const handleSaveSourceIcon = (directory: string, icon: SourceIcon | null) => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(icon ? t('directories.updatingIcon') : t('directories.resettingIcon'))

    void saveSourceIcon(directory, icon)
      .then((nextState) => {
        setSkillState(nextState)
        setDirectoryFeedbackMessage(icon ? t('directories.iconUpdated') : t('directories.iconReset'))
      })
      .catch(() => {
        setDirectoryFeedbackMessage(t('directories.iconUpdateFailed'))
      })
      .finally(() => {
        setIsSavingDirectories(false)
      })
  }

  const handleSelectSkillGroup = (group: SkillGroup) => {
    setSelectedPanel('skill')
    setSelectedSkillId(group.primarySkill.id)
    setLibraryActivity((currentActivity) => {
      const nextActivity = recordRecentlyViewedSkill(currentActivity, group.id)
      writeLibraryActivity(nextActivity)
      return nextActivity
    })
  }

  const handleSelectSkillView = () => {
    setSelectedPanel('skill')
    setSelectedSkillId((currentSkillId) => currentSkillId ?? skillGroups[0]?.primarySkill.id ?? null)
  }

  const handleSelectAppView = () => {
    setSelectedPanel('app')
    setSelectedAppId((currentAppId) => currentAppId ?? catalogProfiles[0]?.agentId ?? null)
  }

  const handleTogglePinnedSkill = (group: SkillGroup) => {
    setLibraryActivity((currentActivity) => {
      const nextActivity = togglePinnedSkill(currentActivity, group.id)
      writeLibraryActivity(nextActivity)
      return nextActivity
    })
  }

  const handleRemoveSkillSource = useCallback(async (skill: Skill) => {
    const nextState = await removeSkillSource(skill.skillDirectory)
    setSkillState(nextState)
  }, [])

  const handleCreateSkillSymlink = useCallback(async (skill: Skill, targetSourceDirectory: string) => {
    const nextState = await createSkillSymlink(skill.skillDirectory, targetSourceDirectory)
    setSkillState(nextState)
  }, [])

  const handleConvertSkillSourceToSymlink = useCallback(async (skill: Skill, targetSkill: Skill) => {
    const nextState = await convertSkillSourceToSymlink(skill.skillDirectory, targetSkill.skillDirectory)
    setSkillState(nextState)
  }, [])

  const handleMigrateSkillToPrimary = useCallback(async (skill: Skill) => {
    const nextState = await migrateSkillToPrimaryRepository(skill.skillDirectory)
    setSkillState(nextState)
  }, [])

  const handleExportSkillZip = useCallback(async (skill: Skill) => {
    await exportSkillZip(skill.skillDirectory, skill.slug || skill.name)
  }, [])

  const handleRefreshSkillUsage = useCallback(async () => {
    const group = selectedSkillGroup
    if (!group?.skills.length) {
      return
    }

    const resolvedSkillDirectories = resolvedSkillDirectoriesForGroup(group)

    setUsageRefreshing(true)
    try {
      const next = await refreshSkillUsage(resolvedSkillDirectories)
      setSkillUsage(next)
    } catch (error) {
      console.warn('Failed to refresh skill usage', error)
    } finally {
      setUsageRefreshing(false)
    }
  }, [selectedSkillGroup])

  const handleStartWindowDrag = useCallback(async (event: MouseEvent<HTMLDivElement>) => {
    if (!isTauriWindow || event.button !== 0) {
      return
    }

    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    void getCurrentWindow().startDragging().catch((error) => {
      console.warn('Failed to start window dragging', error)
    })
  }, [isTauriWindow])

  return (
    <div className="h-screen overflow-hidden bg-background text-[14px] text-foreground">
      {isTauriWindow ? (
        <div
          aria-hidden="true"
          className="titlebar-drag-region fixed inset-x-0 top-0 z-titlebar h-8 bg-transparent"
          data-tauri-drag-region
          onMouseDown={handleStartWindowDrag}
        />
      ) : null}

      <main className="mx-auto h-screen max-w-none bg-[var(--background-elevated)]">
        <div
          className={`grid h-full gap-0 ${
            !hasPrimaryNav
              ? 'grid-cols-[minmax(0,1fr)]'
              : hasContextSidebar && isPrimaryNavCollapsed
              ? 'grid-cols-[52px_minmax(220px,260px)_minmax(0,1fr)]'
              : hasContextSidebar
                ? 'grid-cols-[180px_minmax(220px,260px)_minmax(0,1fr)]'
                : isPrimaryNavCollapsed
                  ? 'grid-cols-[52px_minmax(0,1fr)]'
                  : 'grid-cols-[180px_minmax(0,1fr)]'
          }`}
        >
          {hasPrimaryNav ? (
            <PrimaryNavigationRail
              hasPendingUpdate={hasPendingUpdate}
              hasTitlebarInset={isTauriWindow}
              isCollapsed={isPrimaryNavCollapsed}
              selectedPanel={selectedPanel}
              onSelectAgentSkillConfig={() => setSelectedPanel('agent-skill-config')}
              onSelectAppView={handleSelectAppView}
              onSelectHome={() => setSelectedPanel('home')}
              onSelectSettings={() => setSelectedPanel('settings')}
              onSelectSkillView={handleSelectSkillView}
              onToggleCollapsed={() => setIsPrimaryNavCollapsed((isCollapsed) => !isCollapsed)}
            />
          ) : null}

          {selectedPanel === 'skill' ? (
            <SkillSidebar
              activeFilter={activeLibraryFilter}
              filteredSkillGroups={filteredSkillGroups}
              hasTitlebarInset={isTauriWindow}
              multiSourceGroupCount={multiSourceGroupCount}
              selectedGroupId={selectedSkillGroup?.id ?? null}
              selectedPanel={selectedPanel}
              skillGroups={skillGroups}
              skillSearchQuery={skillSearchQuery}
              visitState={libraryVisitState}
              pinnedSkillIds={libraryActivity.pinnedSkillIds}
              onFilterChange={setActiveLibraryFilter}
              onSearchChange={setSkillSearchQuery}
              onSelectSkillGroup={handleSelectSkillGroup}
            />
          ) : selectedPanel === 'app' ? (
            <ApplicationSidebar
              hasTitlebarInset={isTauriWindow}
              profiles={catalogProfiles}
              selectedProfileId={selectedAppProfile?.agentId ?? null}
              onSelectProfile={(profile) => {
                setSelectedPanel('app')
                setSelectedAppId(profile.agentId)
              }}
            />
          ) : null}

          {selectedPanel === 'home' ? (
            <LibraryHomePanel
              catalogProfiles={catalogProfiles}
              skillGroups={skillGroups}
              visitState={libraryVisitState}
              onOpenAgentSkillConfig={() => setSelectedPanel('agent-skill-config')}
              onOpenSettings={() => setSelectedPanel('settings')}
              onSelectSkillGroup={handleSelectSkillGroup}
            />
          ) : selectedPanel === 'app' ? (
            <ApplicationDetailPanel
              hasTitlebarInset={isTauriWindow}
              profile={selectedAppProfile}
              skillUsage={skillUsage}
              skillsById={skillsById}
              skillGroupsBySkillId={skillGroupsBySkillId}
              onSelectSkillGroup={handleSelectSkillGroup}
            />
          ) : selectedPanel === 'agent-skill-config' ? (
            <AgentSkillConfigPanel
              builtInDirectories={skillState.builtInDirectories}
              configuredDirectories={skillState.configuredDirectories}
              disabledScanDirectories={skillState.disabledScanDirectories}
              feedbackMessage={directoryFeedbackMessage}
              hasTitlebarInset={isTauriWindow}
              inputDisabled={isSavingDirectories}
              pendingScanDirectory={pendingScanDirectory}
              sourceIcons={skillState.sourceIcons}
              skillCount={skillGroups.length}
              userConfiguredDirectories={skillState.userConfiguredDirectories}
              onRefresh={handleRefresh}
              onRemoveDirectory={handleRemoveDirectory}
              onSaveSourceIcon={handleSaveSourceIcon}
              onSetDirectoryScanEnabled={handleSetDirectoryScanEnabled}
              onSetFeedbackMessage={setDirectoryFeedbackMessage}
              onSelectDirectory={handleChooseDirectory}
            />
          ) : selectedPanel === 'settings' ? (
            <AppSettingsPanel
              currentVersion={appVersion}
              hasTitlebarInset={isTauriWindow}
              isSavingPrimaryRepository={isSavingPrimaryRepository}
              openDirectoryTargets={skillState.openDirectoryTargets}
              primaryRepositoryError={primaryRepositoryError}
              primarySkillRepository={skillState.primarySkillRepository}
              updateCheck={updateCheckState}
              updateCheckError={updateCheckError}
              updateCheckStatus={updateCheckStatus}
              updateInstallError={updateInstallError}
              updateInstallStatus={updateInstallStatus}
              onCheckForUpdates={handleCheckForUpdates}
              onInstallUpdate={handleInstallUpdate}
              onOpenExternalUrl={handleOpenExternalUrl}
              onSavePrimaryRepository={handleSavePrimaryRepository}
            />
          ) : selectedSkill && selectedSkillGroup ? (
            <SkillDetailPanel
              hasTitlebarInset={isTauriWindow}
              openDirectoryTargets={skillState.openDirectoryTargets}
              primarySkillRepository={skillState.primarySkillRepository}
              recentChanges={libraryVisitState.changesBySkillId[selectedSkillGroup.id] ?? []}
              shareTargetDirectories={skillState.shareTargetDirectories}
              isPinned={libraryActivity.pinnedSkillIds.includes(selectedSkillGroup.id)}
              selectedSkill={selectedSkill}
              selectedSkillGroup={selectedSkillGroup}
              skillUsage={skillUsage}
              usageRefreshing={usageRefreshing}
              onRefreshUsage={handleRefreshSkillUsage}
              onCreateSymlink={handleCreateSkillSymlink}
              onExportZip={handleExportSkillZip}
              onMigrateToPrimary={handleMigrateSkillToPrimary}
              onRemoveSource={handleRemoveSkillSource}
              onSelectSkill={setSelectedSkillId}
              onConvertToSymlink={handleConvertSkillSourceToSymlink}
              onTogglePinned={() => handleTogglePinnedSkill(selectedSkillGroup)}
            />
          ) : null}
        </div>
      </main>
    </div>
  )
}
