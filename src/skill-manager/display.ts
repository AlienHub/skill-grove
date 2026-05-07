import { type TranslationKey } from './i18n'

export function displayAgentName(
  agentId: string,
  agentName: string,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
) {
  return agentId === 'unknown' || agentName === '自定义来源'
    ? t('common.customSource')
    : agentName
}
