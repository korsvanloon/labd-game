import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import { Ticket } from '../game/level-progress'
import { Styles as TicketStyles, TicketCard } from './Ticket'

export type Styles = {
  sprint: {
    root?: string
    openTicket?: string
    openTicketComponent?: string
  }
} & TicketStyles

type Props = {
  tickets: Ticket[]
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const Sprint = ({ tickets, styles, ...attributes }: Props) => {
  return (
    <div {...attributes} className={clsx(styles.sprint.root)}>
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
              rotation={0}
              // rotation={-0.5 * Math.PI}
              className={styles.sprint.openTicket}
              componentClassName={clsx(styles.sprint.openTicketComponent)}
              styles={styles}
            />
          ))}
      </div>
    </div>
  )
}

const queueProgresses: Ticket['progress'][] = ['specified', 'coded', 'ready']
