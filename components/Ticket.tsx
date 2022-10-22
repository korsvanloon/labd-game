import clsx from 'clsx'
import {
  CSSProperties,
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Ticket } from '../game/level-progress'
import styles from './Ticket.module.css'

type Props = {
  ticket: Ticket
  /** In radians */
  rotation: number
  componentClassName?: string
} & HTMLAttributes<HTMLDivElement>

export const TicketCard = ({
  ticket,
  rotation,
  componentClassName,
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
      className={clsx(styles.location)}
      style={
        {
          ...attributes.style,
          '--scale': scale,
          '--rotation': rotation,
        } as CSSProperties
      }
    >
      <div
        className={clsx(styles.Ticket, attributes.className, ticket.progress)}
        data-action-zone="ticket"
        data-component-id={component.id}
      >
        <header className={styles.info}>
          <div className={styles.name}>{component.type}</div>
          <div className={styles.id}>{component.id}</div>
          <div className={styles.points}>{component.codeLines.length}</div>
        </header>
        <div
          ref={ref}
          className={clsx(styles.component, componentClassName)}
          dangerouslySetInnerHTML={{ __html: component.html }}
        />

        <footer className={styles.footer}>
          <div>{ticket.progress}</div>
          {component.forEach && (
            <>
              <div>API: {component.forEach.api}</div>
              <div>Amount: {component.forEach.length}</div>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
