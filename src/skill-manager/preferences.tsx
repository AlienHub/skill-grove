import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getCurrentWindow, type Color } from '@tauri-apps/api/window'
import { translate, type Language, type TranslationKey } from './i18n'

export type ThemePreference = 'system' | 'light' | 'dark'
export type LanguagePreference = 'system' | Language

const THEME_STORAGE_KEY = 'skill-grove.theme'
const LEGACY_THEME_STORAGE_KEY = 'skill-studio.theme'
const LANGUAGE_STORAGE_KEY = 'skill-grove.language'
const DEFAULT_OPEN_TARGET_STORAGE_KEY = 'skill-grove.defaultOpenTarget'

function isTauriRuntime() {
  return '__TAURI_INTERNALS__' in window
}

type PreferencesContextValue = {
  defaultOpenTargetId: string | null
  themePreference: ThemePreference
  resolvedTheme: 'light' | 'dark'
  languagePreference: LanguagePreference
  language: Language
  setDefaultOpenTargetId: (targetId: string | null) => void
  setThemePreference: (theme: ThemePreference) => void
  setLanguagePreference: (language: LanguagePreference) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function readThemePreference(): ThemePreference {
  let value = localStorage.getItem(THEME_STORAGE_KEY)
  if (!value) {
    value = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    if (value) {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    }
  }

  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference
}

function applyResolvedTheme(resolvedTheme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  document.documentElement.dataset.theme = resolvedTheme
}

function readLanguagePreference(): LanguagePreference {
  const value = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return value === 'zh-CN' || value === 'en-US' || value === 'system' ? value : 'system'
}

function readDefaultOpenTargetId() {
  const value = localStorage.getItem(DEFAULT_OPEN_TARGET_STORAGE_KEY)
  return value && value.trim() ? value : null
}

function prefersDarkMode() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function getSystemLanguage(): Language {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  const language = languages.find(Boolean)?.toLowerCase() ?? ''
  return language.startsWith('zh') ? 'zh-CN' : 'en-US'
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(readThemePreference)
  const [languagePreference, setLanguagePreferenceState] = useState<LanguagePreference>(readLanguagePreference)
  const [defaultOpenTargetId, setDefaultOpenTargetIdState] = useState<string | null>(readDefaultOpenTargetId)
  const [systemPrefersDark, setSystemPrefersDark] = useState(prefersDarkMode)
  const [systemLanguage] = useState<Language>(getSystemLanguage)
  const resolvedTheme = resolveTheme(themePreference, systemPrefersDark)
  const language = languagePreference === 'system' ? systemLanguage : languagePreference

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mediaQuery) {
      return
    }

    setSystemPrefersDark(mediaQuery.matches)
    const handleChange = () => setSystemPrefersDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isTauriRuntime()) {
      return
    }

    let disposed = false
    let unlisten: (() => void) | undefined
    const appWindow = getCurrentWindow()

    void (async () => {
      try {
        const theme = await appWindow.theme()
        if (!disposed && theme) {
          setSystemPrefersDark(theme === 'dark')
        }

        unlisten = await appWindow.onThemeChanged(({ payload: theme }) => {
          setSystemPrefersDark(theme === 'dark')
        })
      } catch (error) {
        console.warn('Failed to subscribe to native theme changes', error)
      }
    })()

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    applyResolvedTheme(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (!isTauriRuntime()) {
      return
    }

    const appWindow = getCurrentWindow()
    const nativeTheme = themePreference === 'system' ? null : themePreference
    const { backgroundColor } = getComputedStyle(document.documentElement)

    void (async () => {
      try {
        await appWindow.setTheme(nativeTheme)
        if (themePreference === 'system') {
          const theme = await appWindow.theme()
          if (theme) {
            setSystemPrefersDark(theme === 'dark')
          }
        }
      } catch (error) {
        console.warn('Failed to sync native window theme', error)
      }
    })()
    void appWindow.setBackgroundColor(backgroundColor as Color).catch((error) => {
      console.warn('Failed to sync native window background', error)
    })
  }, [resolvedTheme, themePreference])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setThemePreference = (theme: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    setThemePreferenceState(theme)
  }

  const setLanguagePreference = (nextLanguage: LanguagePreference) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    setLanguagePreferenceState(nextLanguage)
  }

  const setDefaultOpenTargetId = (targetId: string | null) => {
    if (targetId) {
      localStorage.setItem(DEFAULT_OPEN_TARGET_STORAGE_KEY, targetId)
    } else {
      localStorage.removeItem(DEFAULT_OPEN_TARGET_STORAGE_KEY)
    }

    setDefaultOpenTargetIdState(targetId)
  }

  const value = useMemo<PreferencesContextValue>(
    () => ({
      defaultOpenTargetId,
      themePreference,
      resolvedTheme,
      languagePreference,
      language,
      setDefaultOpenTargetId,
      setThemePreference,
      setLanguagePreference,
      t: (key, params) => translate(language, key, params),
    }),
    [defaultOpenTargetId, language, languagePreference, resolvedTheme, themePreference]
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function useAppPreferences() {
  const value = useContext(PreferencesContext)
  if (!value) {
    throw new Error('useAppPreferences must be used inside PreferencesProvider')
  }

  return value
}
