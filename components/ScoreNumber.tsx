import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import styles from './ScoreNumber.module.css'

type Props = {
  children?: React.ReactNode
  changed: boolean
} & HTMLAttributes<HTMLDivElement>

export const ScoreNumber = ({ changed, children, ...attributes }: Props) => {
  return (
    <div
      {...attributes}
      className={clsx(
        styles.ScoreNumber,
        changed && styles.change,
        attributes.className,
      )}
    >
      {children}
    </div>
  )
}
