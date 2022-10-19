import clsx from 'clsx'
import {
  CSSProperties,
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Component } from '../lib/level'
import styles from './CodedComponent.module.css'

type Props = {
  component: Component
  /** In radians */
  rotation: number
  componentClassName?: string
} & HTMLAttributes<HTMLDivElement>

export const CodedComponent = ({
  component,
  rotation,
  componentClassName,
  ...attributes
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!ref.current) return

    const size = Math.min(
      300 / ref.current.clientWidth,
      75 / ref.current.clientHeight,
    )
    setScale(size)
  }, [ref.current])

  return (
    <div
      {...attributes}
      className={clsx(styles.codedComponent, attributes.className)}
      style={
        {
          ...attributes.style,
          '--scale': scale,
          '--rotation': rotation,
        } as CSSProperties
      }
    >
      <div
        ref={ref}
        className={componentClassName}
        dangerouslySetInnerHTML={{ __html: component.html }}
      />
    </div>
  )
}
