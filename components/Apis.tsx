import { paramCase } from 'change-case'
import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import { Level } from '../game/level'
import { Ticket } from '../game/level-progress'
import { Styles as TicketStyles } from './Ticket'

export type Styles = {
  apis: {
    progresses: string | undefined
    apis: string | undefined
    circle: string | undefined
    endpoint: string | undefined
    progress: string | undefined
    root?: string
    api?: string
    ticket?: string
  }
} & TicketStyles

type Props = {
  tickets: Ticket[]
  level: Level
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const Apis = ({ tickets, level, styles, ...attributes }: Props) => (
  <div {...attributes} className={clsx(styles.apis.root)}>
    <header>APIs</header>
    <div className={styles.apis.apis}>
      {level.apis?.map((api) => (
        <div key={api.name} className={clsx(styles.apis.api)}>
          <header>
            <strong>{api.name}</strong> {api.type}
          </header>
          <div>
            {api.contentTypes.map((type) => (
              <div
                className={styles.apis.endpoint}
                key={type.name}
                data-action-zone="api"
                data-api={api.name}
                data-type={type.name}
              >
                {paramCase(type.name)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className={styles.apis.progresses}>
      {tickets.map((t) => (
        <div
          key={t.component.id}
          className={styles.apis.progress}
          style={
            {
              '--duration': t.component.forEach?.length,
            } as any
          }
        >
          <header className={styles.ticket.info}>
            <svg viewBox="0 0 300 300" className={styles.apis.circle}>
              <circle r="90" cx="150" cy="150" fill="transparent" y="565.48" />
              <circle
                r="90"
                cx="150"
                cy="150"
                style={
                  {
                    '--duration': `${t.component.forEach?.length}s`,
                  } as any
                }
                fill="transparent"
                strokeDasharray="565.48"
              />
            </svg>
            <div className={styles.ticket.name}>{t.component.type}</div>
            <div className={styles.ticket.id}>{t.component.id}</div>
            <div className={styles.ticket.points}>
              {t.component.codeLines.length}
            </div>
          </header>
        </div>
      ))}
    </div>
  </div>
)
