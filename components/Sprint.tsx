import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import { Ticket } from '../game/level-progress'
import styles from './Sprint.module.css'
import { TicketCard } from './Ticket'

type Props = {
  tickets: Ticket[]
} & HTMLAttributes<HTMLDivElement>

export const Sprint = ({ tickets, ...attributes }: Props) => {
  return (
    <div {...attributes} className={clsx(styles.Sprint)}>
      <header>Current Sprint</header>
      <div>
        {tickets
          .filter(
            (p) =>
              queueProgresses.includes(p.progress) && p.player === undefined,
          )
          .map((ticket) => (
            <TicketCard
              ticket={ticket}
              key={ticket.component.id}
              rotation={-0.5 * Math.PI}
              className={styles.openTicket}
              componentClassName={clsx(styles.openTicketComponent)}
            />
          ))}
      </div>
    </div>
  )
}

const queueProgresses: Ticket['progress'][] = ['specified', 'coded', 'ready']
