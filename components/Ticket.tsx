import clsx from 'clsx'
import {
  CSSProperties,
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Component } from '../game/level'
import styles from './Ticket.module.css'

type Props = {
  component: Component
  /** In radians */
  rotation: number
  componentClassName?: string
} & HTMLAttributes<HTMLDivElement>

export const Ticket = ({
  component,
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

  return (
    <div
      {...attributes}
      className={clsx(styles.Ticket, attributes.className)}
      style={
        {
          ...attributes.style,
          '--scale': scale,
          '--rotation': rotation,
        } as CSSProperties
      }
    >
      <div className={styles.info}>
        <div className={styles.name}>{component.type}</div>
        <div className={styles.id}>{component.id}</div>
      </div>
      <div
        ref={ref}
        className={clsx(styles.component, componentClassName)}
        dangerouslySetInnerHTML={{ __html: component.html }}
      />
    </div>
  )
}
