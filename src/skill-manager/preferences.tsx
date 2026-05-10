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
const LANGUAGE_STORAGE_KEY = 'skill-grove.language'
const DEFAULT_OPEN_TARGET_STORAGE_KEY = 'skill-grove.defaultOpenTarget'

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
  const value = localStorage.getItem(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
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
  const resolvedTheme = themePreference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themePreference
  const language = languagePreference === 'system' ? systemLanguage : languagePreference

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mediaQuery) {
      return
    }

    const handleChange = () => setSystemPrefersDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) {
      return
    }

    const appWindow = getCurrentWindow()
    const { backgroundColor } = getComputedStyle(document.documentElement)
    void appWindow.setTheme(resolvedTheme).catch((error) => {
      console.warn('Failed to sync native window theme', error)
    })
    void appWindow.setBackgroundColor(backgroundColor as Color).catch((error) => {
      console.warn('Failed to sync native window background', error)
    })
  }, [resolvedTheme])

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
