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
      <article className="prose max-w-none text-[14px] leading-7 text-foreground/84 prose-headings:mb-2 prose-headings:mt-7 prose-headings:font-semibold prose-headings:text-foreground prose-h1:text-[18px] prose-h2:text-[16px] prose-h3:text-[14px] prose-p:my-3 prose-p:text-[14px] prose-p:text-foreground/84 prose-a:text-accent prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-li:text-[14px] prose-li:text-foreground/84 prose-strong:text-foreground prose-code:rounded-[5px] prose-code:bg-[var(--surface-muted)] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[12px] prose-code:font-medium prose-code:text-foreground prose-pre:my-4 prose-pre:overflow-x-auto prose-pre:rounded-[8px] prose-pre:border prose-pre:border-border/45 prose-pre:bg-[var(--surface-muted)] prose-pre:p-4 prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:text-foreground/58 prose-table:text-[13px]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}
