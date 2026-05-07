import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppPreferences } from '../../skill-manager/preferences'

export function SkillInstructions({ content }: { content: string }) {
  const { t } = useAppPreferences()

  if (!content.trim()) {
    return (
      <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] px-5 py-6 text-[12px] text-foreground/56 shadow-minimal-flat">
        {t('instructions.empty')}
      </div>
    )
  }

  return (
    <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] px-5 py-5 shadow-minimal-flat">
      <article className="prose max-w-none text-[14px] leading-6 text-foreground/84 prose-headings:text-[14px] prose-headings:font-semibold prose-headings:text-foreground prose-p:text-[14px] prose-p:text-foreground/84 prose-li:text-[14px] prose-li:text-foreground/84 prose-strong:text-foreground prose-code:text-[13px] prose-code:text-foreground prose-pre:overflow-x-auto prose-pre:rounded-[8px] prose-pre:bg-[var(--surface-muted)]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}
