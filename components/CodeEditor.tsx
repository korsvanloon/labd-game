import clsx from 'clsx'
import { HTMLAttributes, useEffect, useRef } from 'react'
import { LevelState } from '../lib/level-progress'
import styles from './CodeEditor.module.css'
import { Ticket } from './Ticket'

type Props = {
  levelProgress: LevelState
} & HTMLAttributes<HTMLDivElement>

export type CodeAction =
  | 'line-up'
  | 'line-down'
  | 'indent-left'
  | 'indent-right'

export const CodeEditor = ({
  levelProgress: { componentsProgress, codingProgress },
  ...attributes
}: Props) => {
  const ref = useRef<HTMLPreElement>(null)
  const ticket = componentsProgress.find((p) => p.progress === 'specified')
  const lines = ticket?.component.structure ?? []

  useEffect(() => {
    if (!ref.current) return
    ref.current.children
      .item(codingProgress.current)
      ?.scrollIntoView({ block: 'center' })
  }, [ref.current, codingProgress.current])

  return (
    <div {...attributes} className={clsx(styles.CodeEditor)}>
      <div className={styles.header}>{ticket?.component.type}</div>
      <pre
        className={clsx('scrollable', 'action-zone', 'code-editor')}
        ref={ref}
      >
        {lines.slice(0, codingProgress.indents.length).map((line, i) => (
          <code
            key={i}
            className={clsx(
              codingProgress.current === i && styles.selected,
              codingProgress.errors[i] && styles.error,
            )}
          >
            {'  '.repeat(codingProgress.indents[i])}
            {line.line.split('.').map((word, i) => (
              <span
                key={i}
                className={clsx(i === 0 ? styles.element : styles.class)}
              >
                {word.trim()}
              </span>
            ))}
          </code>
        ))}
      </pre>
      <button
        className={clsx(styles.submit)}
        disabled={codingProgress.indents.length !== codingProgress.current}
      >
        Commit
      </button>

      <div className={styles.tickets}>
        {componentsProgress
          .filter((p) => p.progress === 'coded')
          .map(({ component }, i, a) => (
            <Ticket
              component={component}
              key={component.id}
              rotation={-1.4}
              style={{
                zIndex: a.length - i,
                left: `calc(80% - ${i + 1}   * min(8vw, 8vh))`,
              }}
              className={styles.ticket}
              componentClassName={clsx(
                styles.ticketComponent,
                'action-zone',
                'object',
                'coded-component',
              )}
            />
          ))}
      </div>
    </div>
  )
}
