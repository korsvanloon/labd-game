import clsx from 'clsx'
import {
  CSSProperties,
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Ticket } from '../game/level-progress'

export type Styles = {
  ticket: {
    root?: string
    card?: string
    info?: string
    name?: string
    id?: string
    points?: string
    component?: string
    footer?: string
  }
}

type Props = {
  ticket: Ticket
  /** In radians */
  rotation?: number
  componentClassName?: string
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const TicketCard = ({
  ticket,
  rotation,
  componentClassName,
  styles,
  ...attributes
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.1)

  useEffect(() => {
    if (!ref.current) return

    const boundX = window.innerWidth * 0.2
    const boundY = window.innerWidth * 0.1
    const size = Math.min(
      boundX / ref.current.clientWidth,
      boundY / ref.current.clientHeight,
    )
    setScale(size)
  }, [ref.current])

  const component = ticket.component

  return (
    <div
      {...attributes}
      className={clsx(styles.ticket.root)}
      style={
        {
          ...attributes.style,
          '--scale': scale,
          '--rotation': rotation,
        } as CSSProperties
      }
    >
      <div
        className={clsx(
          styles.ticket.card,
          attributes.className,
          ticket.progress,
        )}
        data-action-zone="ticket"
        data-component-id={component.id}
      >
        <header className={styles.ticket.info}>
          <div className={styles.ticket.name}>{component.type}</div>
          <div className={styles.ticket.id}>{component.id}</div>
          <div className={styles.ticket.points}>
            {component.codeLines.length}
          </div>
        </header>
        <div
          ref={ref}
          className={clsx(styles.ticket.component, componentClassName)}
          dangerouslySetInnerHTML={{ __html: component.html }}
        />

        <footer className={styles.ticket.footer}>
          <div>{ticket.progress}</div>
          {component.forEach && (
            <>
              <div>API: {component.forEach.api}</div>
              <div>Amount: {component.forEach.ids.length}</div>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
