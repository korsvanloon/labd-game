import clsx from 'clsx'
import { HTMLAttributes } from 'react'

export type Styles = {
  scoreNumber: {
    root?: string
    change?: string
  }
}

type Props = {
  children?: React.ReactNode
  changed: boolean
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const ScoreNumber = ({
  changed,
  children,
  styles,
  ...attributes
}: Props) => {
  return (
    <div
      {...attributes}
      className={clsx(
        styles.scoreNumber.root,
        changed && styles.scoreNumber.change,
        attributes.className,
      )}
    >
      {children}
    </div>
  )
}
