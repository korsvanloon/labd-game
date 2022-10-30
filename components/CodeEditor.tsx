import { camelCase } from 'change-case'
import clsx from 'clsx'
import { HTMLAttributes, useEffect, useRef } from 'react'
import { LevelState } from '../game/level-progress'

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
  levelProgress: LevelState
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export type CodeAction =
  | 'line-up'
  | 'line-down'
  | 'indent-left'
  | 'indent-right'
  | 'commit'

export const CodeEditor = ({
  levelProgress: { tickets, codingProgress },
  styles,
  ...attributes
}: Props) => {
  const ref = useRef<HTMLPreElement>(null)
  const ticket = tickets.find((p) => p.progress === 'coding')
  const lines = ticket?.component.codeLines ?? []

  useEffect(() => {
    if (!ref.current) return
    ref.current.children
      .item(codingProgress.current)
      ?.scrollIntoView({ block: 'center' })
  }, [ref.current, codingProgress.current])

  return (
    <div {...attributes} className={clsx(styles.codeEditor.root)}>
      <div className={styles.codeEditor.header}>{ticket?.component.type}</div>
      <pre ref={ref} data-action-zone="code-editor">
        {lines.slice(0, codingProgress.indents.length).map((line, i) => (
          <code
            key={i}
            className={clsx(
              codingProgress.current === i && styles.codeEditor.selected,
              codingProgress.errors[i] && styles.codeEditor.error,
            )}
          >
            {'  '.repeat(codingProgress.indents[i])}
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
              <span className={clsx(styles.codeEditor.text)}>{line.text}</span>
            ) : undefined}
          </code>
        ))}
      </pre>
      <button
        className={clsx(styles.codeEditor.commitButton)}
        disabled={
          codingProgress.indents.length !== ticket?.component.codeLines.length
        }
        data-action-zone="commit-button"
      >
        Commit
      </button>
    </div>
  )
}
