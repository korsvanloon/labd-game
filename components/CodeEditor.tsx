import { camelCase } from 'change-case'
import clsx from 'clsx'
import { HTMLAttributes, useEffect, useRef } from 'react'
import { Ticket } from '../game/level-progress'

export type Styles = {
  codeEditor: {
    root?: string

    header?: string
    selected?: string
    error?: string
    element?: string
    class?: string
    componentSlot?: string
    field?: string
    forEach?: string
    foreEachValue?: string
    text: string
    commitButton: string
  }
}

type Props = {
  ticket?: Ticket
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export type CodeAction =
  | 'line-up'
  | 'line-down'
  | 'indent-left'
  | 'indent-right'
  | 'commit'

export const CodeEditor = ({ ticket, styles, ...attributes }: Props) => {
  const ref = useRef<HTMLPreElement>(null)
  const lines = ticket?.component.codeLines ?? []

  useEffect(() => {
    if (!ref.current || !ticket) return
    ref.current.children
      .item(ticket.codingProgress.current)
      ?.scrollIntoView({ block: 'center' })
  }, [ref.current, ticket?.codingProgress.current])

  return (
    <div {...attributes} className={clsx(styles.codeEditor.root)}>
      <div className={styles.codeEditor.header}>{ticket?.component.type}</div>
      <pre ref={ref} data-action-zone="code-editor">
        {ticket &&
          lines
            .slice(0, ticket.codingProgress.indents.length)
            .map((line, i) => (
              <code
                key={i}
                className={clsx(
                  ticket.codingProgress.current === i &&
                    styles.codeEditor.selected,
                  ticket.codingProgress.errors[i] && styles.codeEditor.error,
                )}
              >
                {'  '.repeat(ticket.codingProgress.indents[i])}
                {line.type === 'element' ? (
                  <>
                    <span className={styles.codeEditor.element}>
                      {line.element}
                    </span>
                    {line.classes.map((c) => (
                      <span key={c} className={styles.codeEditor.class}>
                        {c}
                      </span>
                    ))}
                  </>
                ) : line.type === 'component-slot' ? (
                  <span className={styles.codeEditor.componentSlot}>
                    {line.component}
                  </span>
                ) : line.type === 'field' ? (
                  <span className={styles.codeEditor.field}>
                    {camelCase(line.name)}
                  </span>
                ) : line.type === 'for-each' ? (
                  <>
                    <span className={styles.codeEditor.forEach}>for-each </span>
                    <span className={styles.codeEditor.foreEachValue}>
                      {line.component}s
                    </span>
                  </>
                ) : line.type === 'text' ? (
                  <span className={clsx(styles.codeEditor.text)}>
                    {line.text}
                  </span>
                ) : undefined}
              </code>
            ))}
      </pre>
      <button
        className={clsx(styles.codeEditor.commitButton)}
        disabled={
          ticket?.codingProgress.indents.length !==
          ticket?.component.codeLines.length
        }
        data-action-zone="commit-button"
      >
        Commit
      </button>
    </div>
  )
}
