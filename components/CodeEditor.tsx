import { camelCase } from 'change-case'
import clsx from 'clsx'
import { HTMLAttributes, useEffect, useRef } from 'react'
import { LevelState } from '../game/level-progress'
import styles from './CodeEditor.module.css'

type Props = {
  levelProgress: LevelState
} & HTMLAttributes<HTMLDivElement>

export type CodeAction =
  | 'line-up'
  | 'line-down'
  | 'indent-left'
  | 'indent-right'
  | 'commit'

export const CodeEditor = ({
  levelProgress: { tickets, codingProgress },
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
    <div {...attributes} className={clsx(styles.CodeEditor)}>
      <div className={styles.header}>{ticket?.component.type}</div>
      <pre ref={ref} data-action-zone="code-editor">
        {lines.slice(0, codingProgress.indents.length).map((line, i) => (
          <code
            key={i}
            className={clsx(
              codingProgress.current === i && styles.selected,
              codingProgress.errors[i] && styles.error,
            )}
          >
            {'  '.repeat(codingProgress.indents[i])}
            {line.type === 'element' ? (
              <>
                <span className={styles.element}>{line.element}</span>
                {line.classes.map((c) => (
                  <span key={c} className={styles.class}>
                    {c}
                  </span>
                ))}
              </>
            ) : line.type === 'component-slot' ? (
              <span className={styles.componentSlot}>{line.component}</span>
            ) : line.type === 'field' ? (
              <span className={styles.field}>{camelCase(line.name)}</span>
            ) : line.type === 'for-each' ? (
              <>
                <span className={styles.forEach}>for-each </span>
                <span className={styles.foreEachValue}>{line.component}s</span>
              </>
            ) : line.type === 'text' ? (
              <span className={clsx(styles.text)}>{line.text}</span>
            ) : undefined}
          </code>
        ))}
      </pre>
      <button
        className={clsx(styles.commitButton)}
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
